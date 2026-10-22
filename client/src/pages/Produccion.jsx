import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../services/api";

const ETAPAS = ["Solicitud", "Planificación", "Asignación", "Producción", "Revisión", "Entrega", "Finalizado"];
const CARGOS = {
  Solicitud: "border-slate-400", Planificación: "border-indigo-400", Asignación: "border-cyan-500",
  Producción: "border-brand-violet", Revisión: "border-amber-400", Entrega: "border-emerald-400", Finalizado: "border-emerald-600",
};
const fechaCorta = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("es-PE") : "Sin fecha";
const fechaHora = (value) => value ? new Date(value).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" }) : "Sin fecha registrada";
const vacio = { titulo: "", fecha_planificacion: "", fecha_entrega: "", id_proyecto: "", id_servicio: "", id_usuario: "" };

function Produccion() {
  const [ordenes, setOrdenes] = useState([]);
  const [catalogos, setCatalogos] = useState({ proyectos: [], servicios: [], usuarios: [] });
  const [resumen, setResumen] = useState({ en_produccion: 0, pendientes: 0, finalizados_mes: 0, atrasados: 0 });
  const [busqueda, setBusqueda] = useState("");
  const [diasFinalizados, setDiasFinalizados] = useState("7");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modalOrden, setModalOrden] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalHistorial, setModalHistorial] = useState(false);
  const [ordenActiva, setOrdenActiva] = useState(null);
  const [form, setForm] = useState(vacio);
  const [guardando, setGuardando] = useState(false);
  const [actualizando, setActualizando] = useState(null);
  const [arrastrada, setArrastrada] = useState(null);
  const [destino, setDestino] = useState("");
  const [busquedaHistorial, setBusquedaHistorial] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const queryTablero = useMemo(() => {
    const params = new URLSearchParams({ dias_finalizados: diasFinalizados });
    if (busqueda.trim()) params.set("q", busqueda.trim());
    return params.toString();
  }, [busqueda, diasFinalizados]);
  const queryHistorial = useMemo(() => {
    const params = new URLSearchParams();
    if (busquedaHistorial.trim()) params.set("q", busquedaHistorial.trim());
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    return params.toString();
  }, [busquedaHistorial, desde, hasta]);
  const rangoInvalido = desde && hasta && desde > hasta;

  async function cargarTablero() {
    setCargando(true); setError("");
    try {
      const response = await api.get(`/produccion/ordenes?${queryTablero}`);
      setOrdenes(response.data || []);
    } catch (err) { setError(err.message || "No se pudieron cargar las órdenes de trabajo."); }
    finally { setCargando(false); }
  }

  async function cargarResumen() {
    try { const response = await api.get("/produccion/resumen"); setResumen(response.data || resumen); }
    catch (err) { console.error("No se pudo cargar el resumen de producción:", err); }
  }

  useEffect(() => { cargarTablero(); }, [queryTablero]);
  useEffect(() => {
    api.get("/produccion/catalogos").then((response) => setCatalogos(response.data || { proyectos: [], servicios: [], usuarios: [] }))
      .catch((err) => setError(err.message || "No se pudieron cargar los datos para la orden."));
    cargarResumen();
  }, []);

  useEffect(() => {
    if (!modalHistorial || rangoInvalido) return;
    let cancelado = false;
    setCargandoHistorial(true);
    api.get(`/produccion/historial${queryHistorial ? `?${queryHistorial}` : ""}`)
      .then((response) => { if (!cancelado) setHistorial(response.data || []); })
      .catch((err) => { if (!cancelado) setError(err.message || "No se pudo cargar el historial."); })
      .finally(() => { if (!cancelado) setCargandoHistorial(false); });
    return () => { cancelado = true; };
  }, [modalHistorial, queryHistorial, rangoInvalido]);

  function abrirNuevaOrden() { setForm(vacio); setError(""); setModalOrden(true); }

  async function crearOrden(event) {
    event.preventDefault(); setGuardando(true); setError("");
    const payload = { ...form, fecha_planificacion: form.fecha_planificacion || null, fecha_entrega: form.fecha_entrega || null, id_proyecto: Number(form.id_proyecto), id_servicio: form.id_servicio ? Number(form.id_servicio) : null, id_usuario: Number(form.id_usuario) };
    try {
      await api.post("/produccion/ordenes", payload);
      setModalOrden(false);
      await Promise.all([cargarTablero(), cargarResumen()]);
    } catch (err) { setError(err.message || "No se pudo crear la orden."); }
    finally { setGuardando(false); }
  }

  async function abrirDetalle(orden) {
    try {
      const response = await api.get(`/produccion/ordenes/${orden.id_orden}`);
      setOrdenActiva(response.data); setModalDetalle(true);
    } catch (err) { setError(err.message || "No se pudo cargar el detalle de la orden."); }
  }

  async function cambiarEtapa(orden, nuevoEstado) {
    const anterior = orden.estado_flujo;
    const indice = ETAPAS.indexOf(anterior);
    if (ETAPAS[indice + 1] !== nuevoEstado) {
      setError(`El flujo de producción requiere avanzar en orden; la siguiente etapa es “${ETAPAS[indice + 1] || "ninguna"}”.`);
      setArrastrada(null); setDestino("");
      return;
    }
    try {
      setActualizando(orden.id_orden); setError("");
      setOrdenes((items) => items.map((item) => Number(item.id_orden) === Number(orden.id_orden) ? { ...item, estado_flujo: nuevoEstado } : item));
      const response = await api.patch(`/produccion/ordenes/${orden.id_orden}/etapa`, { estado_flujo: nuevoEstado });
      const actualizado = response.data;
      setOrdenes((items) => {
        const actual = items.map((item) => Number(item.id_orden) === Number(orden.id_orden) ? { ...item, ...actualizado } : item);
        if (nuevoEstado === "Finalizado" && !actual.some((item) => Number(item.id_orden) === Number(orden.id_orden))) actual.push(actualizado);
        return actual;
      });
      if (ordenActiva?.id_orden === orden.id_orden) setOrdenActiva(actualizado);
      await cargarResumen();
    } catch (err) {
      setOrdenes((items) => items.map((item) => Number(item.id_orden) === Number(orden.id_orden) ? { ...item, estado_flujo: anterior } : item));
      setError(err.message || "No se pudo mover la orden a la siguiente etapa.");
    } finally { setActualizando(null); setArrastrada(null); setDestino(""); }
  }

  function iniciarArrastre(event, orden) {
    if (orden.estado_flujo === "Finalizado") { event.preventDefault(); return; }
    setArrastrada(orden); event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(orden.id_orden));
  }

  async function soltarOrden(event, etapa) {
    event.preventDefault(); event.dataTransfer.dropEffect = "move";
    const id = Number(event.dataTransfer.getData("text/plain"));
    const orden = ordenes.find((item) => Number(item.id_orden) === id);
    setDestino("");
    if (!orden || orden.estado_flujo === etapa) { setArrastrada(null); return; }
    await cambiarEtapa(orden, etapa);
  }

  const grupos = ETAPAS.map((etapa) => [etapa, ordenes.filter((orden) => orden.estado_flujo === etapa)]);
  const porCodigoProyecto = (orden) => `${orden.codigo} · ${orden.titulo}`;

  return <DashboardLayout><section className="space-y-5">
    <div className="flex items-center justify-between flex-wrap gap-3"><div><h1 className="font-display text-2xl font-bold text-nx-900">Producción y Operaciones</h1><p className="text-sm text-slate-500">Órdenes de trabajo y flujo de ejecución de servicios.</p></div><div className="flex gap-2"><button type="button" onClick={() => setModalHistorial(true)} className="rounded-xl border border-nx-line bg-white px-4 py-2 text-sm font-semibold">Ver historial</button><button type="button" onClick={abrirNuevaOrden} disabled={!catalogos.proyectos.length || !catalogos.usuarios.length} className="rounded-xl bg-gradient-to-r from-brand-violet to-brand-indigo text-white text-sm font-semibold px-4 py-2 shadow-pop disabled:opacity-50">+ Orden de trabajo</button></div></div>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="bg-white rounded-2xl p-4 shadow-soft border border-nx-line"><p className="text-xs text-slate-500">En producción</p><p className="font-display text-xl font-extrabold mt-1">{resumen.en_produccion}</p></div><div className="bg-white rounded-2xl p-4 shadow-soft border border-nx-line"><p className="text-xs text-slate-500">Pendientes</p><p className="font-display text-xl font-extrabold mt-1">{resumen.pendientes}</p></div><div className="bg-white rounded-2xl p-4 shadow-soft border border-nx-line"><p className="text-xs text-slate-500">Finalizados este mes</p><p className="font-display text-xl font-extrabold mt-1">{resumen.finalizados_mes}</p></div><div className="bg-white rounded-2xl p-4 shadow-soft border border-rose-200"><p className="text-xs text-rose-600">Atrasados</p><p className="font-display text-xl font-extrabold mt-1 text-rose-600">{resumen.atrasados}</p></div></div>
    <div className="bg-white rounded-2xl shadow-soft border border-nx-line p-3 flex flex-wrap gap-3 items-center"><input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar código, orden, proyecto, servicio o responsable…" className="flex-1 min-w-[250px] border border-nx-line rounded-lg px-3 py-2 text-sm"/><label className="flex items-center gap-2 text-xs font-semibold text-slate-600">Finalizados recientes<select value={diasFinalizados} onChange={(e) => setDiasFinalizados(e.target.value)} className="border border-nx-line rounded-lg px-3 py-2 bg-white text-sm"><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option></select></label></div>
    {cargando ? <div className="p-10 bg-white rounded-2xl text-center text-slate-400">Cargando órdenes…</div> : <div className="flex gap-4 overflow-x-auto pb-2">{grupos.map(([etapa, items]) => <div key={etapa} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDestino(etapa); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDestino(""); }} onDrop={(event) => soltarOrden(event, etapa)} className={`min-w-[260px] w-[280px] shrink-0 bg-white/70 rounded-2xl p-3 border transition ${destino === etapa ? "border-dashed border-brand-violet bg-violet-50/50" : "border-nx-line"}`}><div className="flex items-center justify-between mb-3"><h2 className="text-xs font-bold text-slate-500">{etapa.toLocaleUpperCase("es-PE")}</h2><span className="min-w-6 h-6 px-2 rounded-full bg-nx-bg text-xs font-semibold flex items-center justify-center">{items.length}</span></div><div className="min-h-[180px] space-y-2">{items.map((orden) => <article key={orden.id_orden} draggable={orden.estado_flujo !== "Finalizado" && actualizando !== orden.id_orden} onDragStart={(event) => iniciarArrastre(event, orden)} onDragEnd={() => { setArrastrada(null); setDestino(""); }} className={`bg-white rounded-xl p-3 shadow-soft border-l-4 ${CARGOS[orden.estado_flujo]} border-y border-r border-nx-line text-sm ${orden.estado_flujo === "Finalizado" ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} transition ${arrastrada?.id_orden === orden.id_orden ? "opacity-50" : ""} ${actualizando === orden.id_orden ? "opacity-60" : ""}`}><button type="button" onClick={() => abrirDetalle(orden)} className="w-full text-left"><p className="font-semibold">{porCodigoProyecto(orden)}</p><p className="text-xs text-slate-500 mt-1">{orden.proyecto} · {orden.cliente}</p><p className="text-xs text-slate-500">{orden.servicio || "Sin servicio"} · {orden.responsable}</p>{orden.fecha_entrega && <p className={`text-xs mt-1 ${orden.estado_flujo !== "Finalizado" && orden.fecha_entrega.slice(0, 10) < new Date().toISOString().slice(0, 10) ? "text-rose-600 font-semibold" : "text-slate-500"}`}>{orden.estado_flujo === "Finalizado" ? `Finalizado: ${fechaHora(orden.fecha_finalizacion)}` : `Entrega: ${fechaCorta(orden.fecha_entrega)}`}</p>}{orden.estado_flujo === "Finalizado" && !orden.fecha_finalizacion && <p className="text-[11px] text-amber-600 mt-1">Sin fecha de finalización registrada</p>}</button></article>)}{items.length === 0 && <p className="text-xs text-slate-400 text-center py-8">{arrastrada ? "Soltar aquí" : "Sin órdenes"}</p>}</div></div>)}</div>}
  </section>

  {modalOrden && <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"><form onSubmit={crearOrden} className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"><div className="px-6 py-4 border-b border-nx-line flex justify-between"><div><h2 className="font-display font-bold text-lg">Nueva orden de trabajo</h2><p className="text-xs text-slate-400">La orden inicia en Solicitud.</p></div><button type="button" onClick={() => setModalOrden(false)} aria-label="Cerrar">×</button></div><div className="p-6 grid sm:grid-cols-2 gap-4 text-sm"><label className="sm:col-span-2 text-xs font-semibold text-slate-600">Título *<input required maxLength="150" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"/></label><label className="text-xs font-semibold text-slate-600">Proyecto *<select required value={form.id_proyecto} onChange={(e) => setForm({ ...form, id_proyecto: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"><option value="">Selecciona proyecto</option>{catalogos.proyectos.map((item) => <option key={item.id_proyecto} value={item.id_proyecto}>{item.nombre}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Responsable *<select required value={form.id_usuario} onChange={(e) => setForm({ ...form, id_usuario: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"><option value="">Selecciona responsable</option>{catalogos.usuarios.map((item) => <option key={item.id_usuario} value={item.id_usuario}>{item.nombre}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Servicio (opcional)<select value={form.id_servicio} onChange={(e) => setForm({ ...form, id_servicio: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"><option value="">Sin servicio</option>{catalogos.servicios.map((item) => <option key={item.id_servicio} value={item.id_servicio}>{item.nombre}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Fecha de planificación<input type="date" value={form.fecha_planificacion} onChange={(e) => setForm({ ...form, fecha_planificacion: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"/></label><label className="text-xs font-semibold text-slate-600">Fecha de entrega<input type="date" value={form.fecha_entrega} onChange={(e) => setForm({ ...form, fecha_entrega: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"/></label></div><div className="px-6 py-4 bg-nx-bg border-t border-nx-line flex justify-end gap-2"><button type="button" onClick={() => setModalOrden(false)} className="px-4 py-2 rounded-lg border border-nx-line bg-white text-sm">Cancelar</button><button disabled={guardando || !catalogos.proyectos.length || !catalogos.usuarios.length} className="px-5 py-2 rounded-lg bg-brand-violet text-white text-sm font-semibold disabled:opacity-50">{guardando ? "Guardando…" : "Crear orden"}</button></div></form></div>}

  {modalDetalle && ordenActiva && <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"><div className="px-6 py-4 border-b border-nx-line flex justify-between"><div><h2 className="font-display font-bold text-lg">{ordenActiva.codigo} · {ordenActiva.titulo}</h2><p className="text-xs text-slate-400">{ordenActiva.proyecto} · {ordenActiva.cliente}</p></div><button type="button" onClick={() => setModalDetalle(false)} aria-label="Cerrar">×</button></div><div className="p-6 overflow-y-auto space-y-5"><div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm"><div><p className="text-xs text-slate-400">Etapa actual</p>{ordenActiva.estado_flujo}</div><div><p className="text-xs text-slate-400">Servicio</p>{ordenActiva.servicio || "Sin servicio"}</div><div><p className="text-xs text-slate-400">Responsable</p>{ordenActiva.responsable}</div><div><p className="text-xs text-slate-400">Planificación</p>{fechaCorta(ordenActiva.fecha_planificacion)}</div><div><p className="text-xs text-slate-400">Fecha de entrega</p>{fechaCorta(ordenActiva.fecha_entrega)}</div><div><p className="text-xs text-slate-400">Finalización</p>{fechaHora(ordenActiva.fecha_finalizacion)}</div></div><div><h3 className="font-display text-sm font-bold mb-2">Historial de etapas</h3><div className="space-y-2">{ordenActiva.historial?.length ? ordenActiva.historial.map((etapa) => <div key={etapa.id_etapa} className="flex gap-3 border-l-2 border-brand-violet pl-3 py-1"><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{etapa.nombre_etapa}</p>{etapa.comentario && <p className="text-xs text-slate-500">{etapa.comentario}</p>}<p className="text-[11px] text-slate-400">{etapa.usuario} · {fechaHora(etapa.fecha)}</p></div></div>) : <p className="text-sm text-slate-400">No hay historial de etapas registrado.</p>}</div></div></div><div className="px-6 py-4 bg-nx-bg border-t border-nx-line flex justify-between items-center"><span className="text-xs text-slate-500">Arrastra la orden a la siguiente columna para avanzar.</span><button type="button" onClick={() => setModalDetalle(false)} className="px-4 py-2 rounded-lg border border-nx-line bg-white text-sm">Cerrar</button></div></div></div>}

  {modalHistorial && <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"><div className="px-6 py-4 border-b border-nx-line flex justify-between items-center"><div><h2 className="font-display font-bold text-lg">Historial de órdenes finalizadas</h2><p className="text-xs text-slate-400">Incluye todas las órdenes finalizadas registradas en la base de datos.</p></div><button type="button" onClick={() => setModalHistorial(false)} aria-label="Cerrar">×</button></div><div className="p-4 border-b border-nx-line flex flex-wrap gap-3 items-end"><label className="flex-1 min-w-[220px] text-xs font-semibold text-slate-600">Buscar<input type="search" value={busquedaHistorial} onChange={(e) => setBusquedaHistorial(e.target.value)} placeholder="Código, orden, proyecto, servicio o responsable…" className="mt-1 w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"/></label><label className="text-xs font-semibold text-slate-600">Desde<input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="mt-1 block border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"/></label><label className="text-xs font-semibold text-slate-600">Hasta<input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="mt-1 block border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"/></label></div>{rangoInvalido && <p role="alert" className="px-5 py-2 text-sm text-rose-700 bg-rose-50">La fecha inicial debe ser anterior o igual a la fecha final.</p>}<div className="p-4 overflow-auto flex-1"><table className="w-full min-w-[900px] text-sm"><thead className="sticky top-0 bg-nx-bg text-xs text-slate-500 uppercase"><tr>{["Código", "Orden", "Proyecto", "Servicio", "Responsable", "Finalizada"].map((item) => <th key={item} className="text-left px-3 py-3">{item}</th>)}</tr></thead><tbody className="divide-y divide-nx-line">{cargandoHistorial ? <tr><td colSpan="6" className="text-center py-10 text-slate-400">Cargando historial…</td></tr> : historial.length ? historial.map((orden) => <tr key={orden.id_orden} className="hover:bg-nx-bg/60"><td className="px-3 py-3 font-mono text-xs">{orden.codigo}</td><td className="px-3 py-3 font-medium">{orden.titulo}</td><td className="px-3 py-3">{orden.proyecto} · {orden.cliente}</td><td className="px-3 py-3">{orden.servicio || "—"}</td><td className="px-3 py-3">{orden.responsable}</td><td className="px-3 py-3">{fechaHora(orden.fecha_finalizacion)}</td></tr>) : <tr><td colSpan="6" className="text-center py-10 text-slate-400">No hay órdenes finalizadas para esos filtros.</td></tr>}</tbody></table></div><div className="px-6 py-4 bg-nx-bg border-t border-nx-line flex justify-end"><button type="button" onClick={() => setModalHistorial(false)} className="px-4 py-2 rounded-lg border border-nx-line bg-white text-sm">Cerrar historial</button></div></div></div>}
  </DashboardLayout>;
}

export default Produccion;
