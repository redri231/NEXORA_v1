import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const campo = "w-full rounded-lg border border-nx-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-violet";
const opcionesPorRol = {
  administrador: ["Ventas", "Proyectos", "Inventario", "Finanzas", "Productividad"],
  gerencia: ["Ventas", "Proyectos", "Inventario", "Finanzas", "Productividad"],
  "marketing y ventas": ["Ventas"],
  operaciones: ["Proyectos", "Productividad"],
  logistica: ["Inventario"],
  finanzas: ["Finanzas"],
};
const filtrosIniciales = { tipo: "", fecha_desde: "", fecha_hasta: "", id_cliente: "", area: "" };
const moneda = (value) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(Number(value || 0));
const fechaCorta = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("es-PE") : "—";
const tipoLabel = { Ventas: "Ventas", Proyectos: "Proyectos", Inventario: "Inventario", Finanzas: "Finanzas", Productividad: "Productividad del equipo" };

function rangoAtajo(atajo) {
  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  let desde = primerDiaMes;
  let hasta = hoy;
  if (atajo === "mes_pasado") {
    desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
  } else if (atajo === "ultimos_3") {
    desde = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
  }
  const iso = (value) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  return { fecha_desde: iso(desde), fecha_hasta: iso(hasta) };
}

function formatoCelda(key, value) {
  if (value == null || value === "") return "—";
  if (["monto_ventas", "monto_cobrado", "monto_total"].includes(key)) return moneda(value);
  if (["fecha_inicio", "fecha_fin", "fecha_entrega_real"].includes(key)) return fechaCorta(value);
  if (key === "mes") return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  if (["avance", "cumplimiento", "carga_pct"].includes(key)) return `${value}%`;
  return value;
}

function totalesParaTarjetas(totales, tipo) {
  const porTipo = {
    Ventas: [["Ventas", "ventas"], ["Monto vendido", "monto_ventas", "money"], ["Cobrado", "monto_cobrado", "money"]],
    Proyectos: [["Proyectos", "proyectos"], ["Avance promedio", "avance_promedio", "percent"], ["Tareas completadas", "tareas_completadas"]],
    Inventario: [["Productos", "productos"], ["Unidades en stock", "stock_total"], ["Stock bajo", "stock_bajo", "warning"]],
    Finanzas: [["Movimientos", "movimientos"], ["Ingresos cobrados", "ingresos_cobrados", "money"], ["Gastos pagados", "gastos_pagados", "money"]],
    Productividad: [["Personas", "personas"], ["Tareas completadas", "completadas"], ["Tareas pendientes", "pendientes", "warning"], ["Cumplimiento", "cumplimiento", "percent"], ["Carga promedio actual", "carga_promedio", "percent"]],
  };
  return (porTipo[tipo] || []).map(([label, key, format]) => ({ label, value: format === "money" ? moneda(totales[key]) : `${totales[key] ?? 0}${format === "percent" ? "%" : ""}`, warning: format === "warning" }));
}

export default function Reportes() {
  const { usuario } = useAuth();
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [catalogos, setCatalogos] = useState({ clientes: [], areas: [] });
  const [historial, setHistorial] = useState([]);
  const [vista, setVista] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoPagina, setCargandoPagina] = useState(true);
  const [exportando, setExportando] = useState("");
  const [error, setError] = useState("");
  const rol = String(usuario?.rol || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const tipos = opcionesPorRol[rol] || [];
  const usaRango = filtros.tipo !== "Inventario";
  const usaCliente = ["Ventas", "Proyectos", "Finanzas"].includes(filtros.tipo);
  const usaArea = ["Proyectos", "Productividad"].includes(filtros.tipo);
  const query = useMemo(() => {
    const p = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => { if (value) p.set(key, value); });
    return p.toString();
  }, [filtros]);

  const cargarDatosBase = useCallback(async () => {
    try {
      const [catalogosResponse, historialResponse] = await Promise.all([api.get("/reportes/catalogos"), api.get("/reportes/historial")]);
      setCatalogos(catalogosResponse.data || { clientes: [], areas: [] });
      setHistorial(historialResponse.data || []);
    } catch (e) { setError(e.message || "No se pudieron cargar los datos de Reportes."); }
    finally { setCargandoPagina(false); }
  }, []);

  useEffect(() => { cargarDatosBase(); }, [cargarDatosBase]);

  function actualizarFiltro(key, value) {
    setFiltros((actual) => {
      if (key !== "tipo") return { ...actual, [key]: value };
      const actualiza = { ...actual, tipo: value };
      if (value === "Inventario") { actualiza.fecha_desde = ""; actualiza.fecha_hasta = ""; actualiza.id_cliente = ""; actualiza.area = ""; }
      if (!["Ventas", "Proyectos", "Finanzas"].includes(value)) actualiza.id_cliente = "";
      if (!["Proyectos", "Productividad"].includes(value)) actualiza.area = "";
      return actualiza;
    });
    setVista(null);
  }

  async function generarReporte(event) {
    event.preventDefault();
    setError(""); setCargando(true); setVista(null);
    try {
      const response = await api.get(`/reportes/vista-previa?${query}`);
      setVista(response.data);
      const historyResponse = await api.get("/reportes/historial");
      setHistorial(historyResponse.data || []);
    } catch (e) { setError(e.message || "No se pudo generar la vista previa."); }
    finally { setCargando(false); }
  }

  async function descargar(tipo, filtrosReporte, formato) {
    const p = new URLSearchParams();
    Object.entries(filtrosReporte).forEach(([key, value]) => { if (value) p.set(key, value); });
    const params = p.toString();
    const nombreTipo = tipo.toLocaleLowerCase("es").replaceAll(" ", "_");
    setError(""); setExportando(`${tipo}-${formato}`);
    try { await api.download(`/reportes/exportar/${formato}?${params}`, `NEXORA_${nombreTipo}_${filtrosReporte.fecha_desde || "corte"}_${filtrosReporte.fecha_hasta || "actual"}.${formato === "excel" ? "xlsx" : "pdf"}`); }
    catch (e) { setError(e.message || `No se pudo exportar a ${formato.toUpperCase()}.`); }
    finally { setExportando(""); }
  }

  const puedeGenerar = Boolean(filtros.tipo) && (!usaRango || (filtros.fecha_desde && filtros.fecha_hasta));
  const tarjetas = vista ? totalesParaTarjetas(vista.totales, vista.tipo) : [];

  return <DashboardLayout><section className="space-y-5">
    <header>
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-violet">Consulta y exportación</p>
      <h1 className="mt-1 text-2xl font-bold text-nx-950">Reportes</h1>
      <p className="mt-1 text-sm text-slate-500">Genera reportes consolidados por área y periodo.</p>
    </header>

    {error && <div role="alert" className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Cerrar">×</button></div>}

    <form onSubmit={generarReporte} className="grid gap-3 rounded-2xl border border-nx-line bg-white p-5 shadow-soft md:grid-cols-2 xl:grid-cols-5">
      <label className="text-xs font-semibold text-slate-600">Tipo de reporte
        <select required className={`${campo} mt-1`} value={filtros.tipo} onChange={(e) => actualizarFiltro("tipo", e.target.value)}><option value="">Selecciona un tipo</option>{tipos.map((tipo) => <option key={tipo}>{tipo}</option>)}</select>
      </label>
      <label className="text-xs font-semibold text-slate-600">Desde
        <input type="date" className={`${campo} mt-1`} disabled={!usaRango} required={usaRango} value={filtros.fecha_desde} onChange={(e) => actualizarFiltro("fecha_desde", e.target.value)} />
      </label>
      <label className="text-xs font-semibold text-slate-600">Hasta
        <input type="date" className={`${campo} mt-1`} disabled={!usaRango} required={usaRango} value={filtros.fecha_hasta} onChange={(e) => actualizarFiltro("fecha_hasta", e.target.value)} />
      </label>
      <label className="text-xs font-semibold text-slate-600">Cliente
        <select className={`${campo} mt-1 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`} value={filtros.id_cliente} disabled={!filtros.tipo || !usaCliente} onChange={(e) => actualizarFiltro("id_cliente", e.target.value)}><option value="">{!filtros.tipo ? "Selecciona primero un reporte" : usaCliente ? "Todos los clientes" : "No aplica a este reporte"}</option>{catalogos.clientes.map((cliente) => <option key={cliente.id_cliente} value={cliente.id_cliente}>{cliente.nombre}</option>)}</select>
      </label>
      <label className="text-xs font-semibold text-slate-600">Área
        <select className={`${campo} mt-1 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`} value={filtros.area} disabled={!filtros.tipo || !usaArea} onChange={(e) => actualizarFiltro("area", e.target.value)}><option value="">{!filtros.tipo ? "Selecciona primero un reporte" : usaArea ? "Todas las áreas" : "No aplica a este reporte"}</option>{catalogos.areas.map((area) => <option key={area}>{area}</option>)}</select>
      </label>
      <div className="flex flex-wrap items-center gap-2 md:col-span-2 xl:col-span-5">
        <span className="mr-1 text-xs font-semibold text-slate-500">Atajos:</span>
        {[ ["Este mes", "este_mes"], ["Mes pasado", "mes_pasado"], ["Últimos 3 meses", "ultimos_3"] ].map(([label, key]) => <button key={key} type="button" disabled={!usaRango} onClick={() => { setFiltros((actual) => ({ ...actual, ...rangoAtajo(key) })); setVista(null); }} className="rounded-lg border border-nx-line px-3 py-2 text-xs font-semibold text-nx-800 hover:bg-nx-bg disabled:opacity-40">{label}</button>)}
        {filtros.tipo === "Inventario" && <span className="text-xs text-slate-500">El inventario muestra el estado actual; la vista no conserva cortes históricos.</span>}
        {filtros.tipo === "Proyectos" && <span className="text-xs text-slate-500">El periodo usa entrega real; si falta, fecha fin prevista y luego fecha de inicio.</span>}
        {filtros.tipo === "Finanzas" && <span className="text-xs text-slate-500">El periodo filtra la fecha de cada movimiento; anulados aparecen separados por estado.</span>}
        {filtros.tipo === "Productividad" && <span className="text-xs text-slate-500">El rango filtra tareas por fecha de creación; el SQL no almacena cuándo se completaron.</span>}
        <button type="submit" disabled={!puedeGenerar || cargando || cargandoPagina} className="ml-auto rounded-lg bg-gradient-to-r from-brand-violet to-brand-indigo px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{cargando ? "Generando…" : "Generar reporte"}</button>
      </div>
    </form>

    {vista && <>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-lg font-bold text-nx-950">Vista previa · {tipoLabel[vista.tipo]}</h2><p className="text-xs text-slate-500">{vista.tipo === "Inventario" ? "Existencias actuales" : `${fechaCorta(vista.filtros.fecha_desde)} – ${fechaCorta(vista.filtros.fecha_hasta)}`} · {vista.filas.length} filas</p></div><div className="flex gap-2"><button type="button" disabled={Boolean(exportando)} onClick={() => descargar(vista.tipo, vista.filtros, "pdf")} className="rounded-lg border border-nx-line bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">{exportando === `${vista.tipo}-pdf` ? "Generando PDF…" : "PDF"}</button><button type="button" disabled={Boolean(exportando)} onClick={() => descargar(vista.tipo, vista.filtros, "excel")} className="rounded-lg border border-nx-line bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">{exportando === `${vista.tipo}-excel` ? "Generando Excel…" : "Excel"}</button></div></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{tarjetas.map((item) => <article key={item.label} className={`rounded-2xl border bg-white p-4 shadow-soft ${item.warning && Number(vista.totales.stock_bajo ?? vista.totales.pendientes) > 0 ? "border-amber-200" : "border-nx-line"}`}><p className="text-xs text-slate-500">{item.label}</p><p className={`mt-1 font-display text-2xl font-extrabold ${item.warning && Number(vista.totales.stock_bajo ?? vista.totales.pendientes) > 0 ? "text-amber-600" : "text-nx-950"}`}>{item.value}</p></article>)}</div>
      <div className="overflow-hidden rounded-2xl border border-nx-line bg-white shadow-soft"><div className="max-h-[520px] overflow-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="sticky top-0 z-10 bg-nx-bg text-xs uppercase text-slate-500"><tr>{vista.columnas.map(([label, key]) => <th key={key} className="whitespace-nowrap px-4 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-nx-line">{vista.filas.map((fila, index) => <tr key={fila.id_proyecto || fila.id_producto || fila.id_usuario || `${index}-${fila.cliente || fila.mes || fila.tipo || "fila"}`} className={`${vista.tipo === "Inventario" && fila.estado_stock === "Stock bajo" ? "bg-amber-50" : "hover:bg-nx-bg/60"}`}>{vista.columnas.map(([, key]) => <td key={key} className={`whitespace-nowrap px-4 py-3 ${vista.tipo === "Inventario" && key === "estado_stock" && fila.estado_stock === "Stock bajo" ? "font-semibold text-amber-700" : ""}`}>{formatoCelda(key, fila[key])}</td>)}</tr>)}{!vista.filas.length && <tr><td colSpan={vista.columnas.length} className="px-4 py-12 text-center text-slate-500">No hay registros para el periodo y filtros seleccionados.</td></tr>}</tbody></table></div></div>
      <p className="text-xs text-slate-400">Este reporte fue registrado en tu historial con el tipo y rango seleccionados.</p>
    </>}

    <div className="space-y-3">
      <div><h2 className="font-display text-lg font-bold text-nx-950">Reportes generados</h2><p className="text-sm text-slate-500">Tus vistas previas recientes con opción para volver a descargar. El historial guarda filtros; al descargar vuelve a consultar los datos actuales.</p></div>
      {historial.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{historial.map((reporte) => {
        const filtrosGuardados = { tipo: reporte.tipo, fecha_desde: reporte.fecha_desde ? String(reporte.fecha_desde).slice(0, 10) : "", fecha_hasta: reporte.fecha_hasta ? String(reporte.fecha_hasta).slice(0, 10) : "", id_cliente: reporte.id_cliente || "", area: reporte.area || "" };
        return <article key={reporte.id_reporte} className="flex items-center justify-between gap-3 rounded-2xl border border-nx-line bg-white p-4 shadow-soft"><div className="min-w-0"><p className="truncate text-sm font-semibold text-nx-950">Reporte de {tipoLabel[reporte.tipo]}</p><p className="mt-1 text-xs text-slate-500">{reporte.tipo === "Inventario" ? "Corte actual" : `${fechaCorta(reporte.fecha_desde)} – ${fechaCorta(reporte.fecha_hasta)}`}{reporte.cliente ? ` · ${reporte.cliente}` : ""}{reporte.area ? ` · ${reporte.area}` : ""}</p><p className="mt-1 text-[11px] text-slate-400">Generado {new Date(reporte.fecha_generacion).toLocaleString("es-PE")}</p></div><div className="flex shrink-0 gap-1"><button type="button" onClick={() => descargar(reporte.tipo, filtrosGuardados, "pdf")} disabled={Boolean(exportando)} className="rounded-lg border border-nx-line px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50">PDF</button><button type="button" onClick={() => descargar(reporte.tipo, filtrosGuardados, "excel")} disabled={Boolean(exportando)} className="rounded-lg border border-nx-line px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50">Excel</button></div></article>;
      })}</div> : <div className="rounded-2xl border border-nx-line bg-white p-8 text-center text-sm text-slate-500">{cargandoPagina ? "Cargando historial…" : "Todavía no generaste reportes."}</div>}
    </div>
  </section></DashboardLayout>;
}
