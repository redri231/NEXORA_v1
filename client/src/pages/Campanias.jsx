import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../services/api";

const ESTADOS = ["Planificada", "Activa", "Pausada", "Finalizada", "Bajo rendimiento"];
const TRANSICIONES = {
  Planificada: ["Activa"],
  Activa: ["Pausada", "Finalizada", "Bajo rendimiento"],
  Pausada: ["Activa", "Finalizada", "Bajo rendimiento"],
  "Bajo rendimiento": ["Activa", "Pausada", "Finalizada"],
  Finalizada: [],
};
const BADGES = {
  Planificada: "bg-slate-100 text-slate-700",
  Activa: "bg-emerald-100 text-emerald-700",
  Pausada: "bg-amber-100 text-amber-700",
  Finalizada: "bg-indigo-100 text-indigo-700",
  "Bajo rendimiento": "bg-rose-100 text-rose-700",
};
const moneda = (value) => value == null ? "—" : new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(Number(value || 0));
const fecha = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("es-PE") : "Sin fecha";
const vacio = { nombre: "", objetivo: "", publico_objetivo: "", fecha_inicio: "", fecha_fin: "", presupuesto: "", id_cliente: "", id_proyecto: "", id_usuario: "", canales: "" };

function Campanias() {
  const [campanias, setCampanias] = useState([]);
  const [catalogos, setCatalogos] = useState({ clientes: [], usuarios: [], proyectos: [] });
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [productos, setProductos] = useState([]);
  const [solicitudesMaterial, setSolicitudesMaterial] = useState([]);
  const [indicadorForm, setIndicadorForm] = useState({ alcance: 0, impresiones: 0, clics: 0, leads: 0, conversiones: 0, costo_por_lead: "", roi: "" });
  const [mostrarIndicadorForm, setMostrarIndicadorForm] = useState(false);
  const [mostrarMaterialForm, setMostrarMaterialForm] = useState(false);
  const [materialForm, setMaterialForm] = useState({ id_producto: "", cantidad_solicitada: 1 });
  const [guardandoDetalle, setGuardandoDetalle] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [edicion, setEdicion] = useState(null);
  const [form, setForm] = useState(vacio);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (busqueda.trim()) params.set("q", busqueda.trim());
    if (estadoFiltro) params.set("estado", estadoFiltro);
    return params.toString();
  }, [busqueda, estadoFiltro]);

  async function cargar() {
    setCargando(true);
    setError("");
    try {
      const response = await api.get(`/campanias${query ? `?${query}` : ""}`);
      setCampanias(response.data || []);
    } catch (err) { setError(err.message || "No se pudieron cargar las campañas."); }
    finally { setCargando(false); }
  }

  useEffect(() => { cargar(); }, [query]);
  useEffect(() => {
    api.get("/campanias/catalogos")
      .then((response) => setCatalogos(response.data || { clientes: [], usuarios: [], proyectos: [] }))
      .catch((err) => setError(err.message || "No se pudieron cargar los datos de campañas."));
  }, []);
  useEffect(() => {
    api.get("/campanias/materiales").then((response) => setProductos(response.data || []))
      .catch((err) => setError(err.message || "No se pudo cargar el catálogo de materiales."));
  }, []);

  function abrirNueva() { setEdicion(null); setForm(vacio); setError(""); setModal(true); }
  function abrirEdicion(campania) {
    setEdicion(campania.id_campania);
    setForm({ ...campania, presupuesto: campania.presupuesto ?? "", fecha_inicio: campania.fecha_inicio?.slice(0, 10) || "", fecha_fin: campania.fecha_fin?.slice(0, 10) || "", id_cliente: String(campania.id_cliente), id_proyecto: campania.id_proyecto ? String(campania.id_proyecto) : "", id_usuario: String(campania.id_usuario), canales: (campania.canales || []).join(", ") });
    setModal(true);
  }

  async function guardar(event) {
    event.preventDefault();
    setGuardando(true); setError("");
    const payload = {
      nombre: form.nombre, objetivo: form.objetivo, publico_objetivo: form.publico_objetivo,
      fecha_inicio: form.fecha_inicio || null, fecha_fin: form.fecha_fin || null,
      presupuesto: form.presupuesto === "" ? null : Number(form.presupuesto),
      id_cliente: Number(form.id_cliente), id_proyecto: form.id_proyecto ? Number(form.id_proyecto) : null,
      id_usuario: Number(form.id_usuario), canales: form.canales.split(",").map((item) => item.trim()).filter(Boolean),
    };
    try {
      if (edicion) await api.put(`/campanias/${edicion}`, payload);
      else await api.post("/campanias", payload);
      setModal(false); await cargar();
    } catch (err) { setError(err.message || "No se pudo guardar la campaña."); }
    finally { setGuardando(false); }
  }

  async function cambiarEstado(campania, estado) {
    if (estado === "Finalizada" && !window.confirm(`¿Finalizar la campaña “${campania.nombre}”?`)) return;
    try { await api.patch(`/campanias/${campania.id_campania}/estado`, { estado }); await cargar(); }
    catch (err) { setError(err.message || "No se pudo cambiar el estado."); }
  }

  async function exportarExcel() {
    setExportando(true);
    try {
      const fechaActual = new Date().toISOString().slice(0, 10);
      await api.download(`/reportes/campanias/excel${query ? `?${query}` : ""}`, `NEXORA_Campanias_${fechaActual}.xlsx`);
    } catch (err) { setError(err.message || "No se pudo exportar el Excel."); }
    finally { setExportando(false); }
  }

  async function exportarPDF() { try { const fecha = new Date().toISOString().slice(0, 10); await api.download(`/reportes/campanias/pdf${query ? `?${query}` : ""}`, `NEXORA_Campanias_${fecha}.pdf`); } catch (err) { setError(err.message || "No se pudo exportar el PDF."); } }

  async function abrirDetalle(campania) {
    try {
      const [response, solicitudes] = await Promise.all([
        api.get(`/campanias/${campania.id_campania}`),
        api.get(`/campanias/${campania.id_campania}/solicitudes-material`),
      ]);
      setDetalle(response.data);
      setSolicitudesMaterial(solicitudes.data || []);
      setMostrarIndicadorForm(false); setMostrarMaterialForm(false);
    } catch (err) { setError(err.message || "No se pudo cargar el detalle de la campaña."); }
  }

  async function registrarIndicador(event) {
    event.preventDefault();
    if (!detalle) return;
    setGuardandoDetalle(true); setError("");
    try {
      await api.post(`/campanias/${detalle.id_campania}/indicadores`, {
        ...Object.fromEntries(["alcance", "impresiones", "clics", "leads", "conversiones"].map((key) => [key, Number(indicadorForm[key])])),
        costo_por_lead: indicadorForm.costo_por_lead === "" ? null : Number(indicadorForm.costo_por_lead),
        roi: indicadorForm.roi === "" ? null : Number(indicadorForm.roi),
      });
      setIndicadorForm({ alcance: 0, impresiones: 0, clics: 0, leads: 0, conversiones: 0, costo_por_lead: "", roi: "" });
      setMostrarIndicadorForm(false); await abrirDetalle(detalle); await cargar();
    } catch (err) { setError(err.message || "No se pudo guardar la medición."); }
    finally { setGuardandoDetalle(false); }
  }

  async function solicitarMaterial(event) {
    event.preventDefault();
    if (!detalle || !materialForm.id_producto) return;
    setGuardandoDetalle(true); setError("");
    try {
      await api.post(`/campanias/${detalle.id_campania}/solicitudes-material`, { id_producto: Number(materialForm.id_producto), cantidad_solicitada: Number(materialForm.cantidad_solicitada) });
      setMaterialForm({ id_producto: "", cantidad_solicitada: 1 }); setMostrarMaterialForm(false); await abrirDetalle(detalle);
    } catch (err) { setError(err.message || "No se pudo enviar la solicitud."); }
    finally { setGuardandoDetalle(false); }
  }

  const clienteElegido = catalogos.clientes.find((item) => String(item.id_cliente) === form.id_cliente);
  const proyectosDisponibles = catalogos.proyectos.filter((item) => !clienteElegido || Number(item.id_cliente) === Number(clienteElegido.id_cliente));

  return <DashboardLayout>
    <section className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-display text-2xl font-bold text-nx-900">Campañas de Marketing</h1><p className="text-sm text-slate-500">Planificación, seguimiento y rendimiento de campañas.</p></div>
        <button type="button" onClick={abrirNueva} className="rounded-xl bg-gradient-to-r from-brand-violet to-brand-indigo text-white text-sm font-semibold px-4 py-2.5 shadow-pop">+ Nueva campaña</button>
      </div>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <div className="bg-white rounded-2xl shadow-soft border border-nx-line p-3 flex flex-wrap gap-3">
        <input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar campaña, cliente o canal…" className="flex-1 min-w-[220px] border border-nx-line rounded-lg px-3 py-2 text-sm" />
        <select value={estadoFiltro} onChange={(event) => setEstadoFiltro(event.target.value)} className="border border-nx-line rounded-lg px-3 py-2 text-sm bg-white"><option value="">Todos los estados</option>{ESTADOS.map((estado) => <option key={estado}>{estado}</option>)}</select>
        <button type="button" onClick={exportarExcel} disabled={exportando} className="border border-nx-line bg-white hover:bg-nx-bg text-nx-800 font-semibold text-sm px-4 py-2 rounded-lg disabled:opacity-50">{exportando ? "Exportando…" : "Exportar Excel"}</button>
        <button type="button" onClick={exportarPDF} className="border border-nx-line bg-white hover:bg-nx-bg text-nx-800 font-semibold text-sm px-4 py-2 rounded-lg">Descargar PDF</button>
      </div>
      {cargando ? <div className="rounded-2xl bg-white p-12 text-center text-slate-400">Cargando campañas…</div> : campanias.length === 0 ? <div className="rounded-2xl bg-white p-12 text-center text-slate-400">No hay campañas que coincidan con la búsqueda.</div> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {campanias.map((campania) => {
          const indicador = campania.indicador_vigente;
          return <article key={campania.id_campania} className="bg-white rounded-2xl p-4 shadow-soft border border-nx-line space-y-3">
            <div className="flex justify-between items-start gap-3"><div className="min-w-0"><h2 className="font-display font-bold truncate">{campania.nombre}</h2><p className="text-xs text-slate-500 truncate">{campania.cliente} · {(campania.canales || []).join(" / ") || "Sin canales"}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${BADGES[campania.estado]}`}>{campania.estado}</span></div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs"><div className="bg-nx-bg rounded-lg py-2"><p className="font-bold text-sm">{Number(indicador?.alcance || 0).toLocaleString("es-PE")}</p>Alcance</div><div className="bg-nx-bg rounded-lg py-2"><p className="font-bold text-sm">{Number(indicador?.clics || 0).toLocaleString("es-PE")}</p>Clics</div><div className="bg-nx-bg rounded-lg py-2"><p className="font-bold text-sm">{indicador?.roi == null ? "—" : `${indicador.roi}x`}</p>ROI</div></div>
            <div className="text-xs text-slate-500 flex justify-between"><span>{fecha(campania.fecha_inicio)} – {fecha(campania.fecha_fin)}</span><span>{moneda(campania.presupuesto)}</span></div>
            <div className="flex items-center gap-2 border-t border-nx-line pt-3"><button type="button" onClick={() => abrirDetalle(campania)} className="text-xs font-semibold text-brand-violet">Mediciones</button>{campania.estado === "Planificada" && <button type="button" onClick={() => abrirEdicion(campania)} className="text-xs font-semibold text-slate-600">Editar</button>}<select aria-label={`Estado de ${campania.nombre}`} value="" onChange={(event) => event.target.value && cambiarEstado(campania, event.target.value)} className="ml-auto max-w-[145px] rounded-lg border border-nx-line px-2 py-1 text-xs"><option value="">Cambiar estado</option>{(TRANSICIONES[campania.estado] || []).map((estado) => <option key={estado}>{estado}</option>)}</select></div>
          </article>;
        })}
      </div>}
    </section>

    {modal && <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"><form onSubmit={guardar} className="bg-white w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-nx-line flex justify-between"><div><h2 className="font-display font-bold text-lg">{edicion ? "Editar campaña" : "Nueva campaña"}</h2><p className="text-xs text-slate-400">Planificación de campaña</p></div><button type="button" onClick={() => setModal(false)} aria-label="Cerrar">×</button></div>
      <div className="p-6 overflow-y-auto grid sm:grid-cols-2 gap-4 text-sm">
        <label className="sm:col-span-2 text-xs font-semibold text-slate-600">Nombre *<input required maxLength="150" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-slate-600">Cliente *<select required value={form.id_cliente} onChange={(e) => setForm({ ...form, id_cliente: e.target.value, id_proyecto: "" })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"><option value="">Selecciona cliente</option>{catalogos.clientes.map((item) => <option key={item.id_cliente} value={item.id_cliente}>{item.nombre}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">Responsable *<select required value={form.id_usuario} onChange={(e) => setForm({ ...form, id_usuario: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"><option value="">Selecciona responsable</option>{catalogos.usuarios.map((item) => <option key={item.id_usuario} value={item.id_usuario}>{item.nombre}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">Proyecto (opcional)<select value={form.id_proyecto} onChange={(e) => setForm({ ...form, id_proyecto: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"><option value="">Sin proyecto</option>{proyectosDisponibles.map((item) => <option key={item.id_proyecto} value={item.id_proyecto}>{item.nombre}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">Canales (separados por coma)<input value={form.canales} onChange={(e) => setForm({ ...form, canales: e.target.value })} placeholder="Instagram, Meta, Google" className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-slate-600">Fecha inicio<input type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-slate-600">Fecha fin<input type="date" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-slate-600">Presupuesto (S/)<input type="number" min="0" step="0.01" value={form.presupuesto} onChange={(e) => setForm({ ...form, presupuesto: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal" /></label>
        <label className="sm:col-span-2 text-xs font-semibold text-slate-600">Público objetivo<input maxLength="150" value={form.publico_objetivo || ""} onChange={(e) => setForm({ ...form, publico_objetivo: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal" /></label>
        <label className="sm:col-span-2 text-xs font-semibold text-slate-600">Objetivo<textarea maxLength="255" rows="2" value={form.objetivo || ""} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal" /></label>
      </div>
      <div className="px-6 py-4 bg-nx-bg border-t border-nx-line flex justify-end gap-2"><button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg border border-nx-line bg-white text-sm">Cancelar</button><button disabled={guardando} className="px-5 py-2 rounded-lg bg-brand-violet text-white text-sm font-semibold disabled:opacity-50">{guardando ? "Guardando…" : "Guardar campaña"}</button></div>
    </form></div>}

    {detalle && <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-nx-line flex justify-between items-center"><div><h2 className="font-display font-bold text-lg">{detalle.nombre}</h2><p className="text-xs text-slate-400">Mediciones periódicas · más reciente primero</p></div><button type="button" onClick={() => setDetalle(null)} aria-label="Cerrar">×</button></div>
      <div className="p-6 overflow-y-auto"><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 text-sm"><div><p className="text-xs text-slate-400">Cliente</p>{detalle.cliente}</div><div><p className="text-xs text-slate-400">Responsable</p>{detalle.responsable}</div><div><p className="text-xs text-slate-400">Proyecto</p>{detalle.proyecto || "Sin proyecto"}</div><div><p className="text-xs text-slate-400">Canales</p>{(detalle.canales || []).join(", ") || "Sin canales"}</div></div>
        <div className="flex gap-2 mb-3"><button type="button" onClick={() => { setMostrarIndicadorForm(!mostrarIndicadorForm); setMostrarMaterialForm(false); }} className="rounded-lg bg-brand-violet text-white px-3 py-2 text-xs font-semibold">+ Registrar medición</button><button type="button" onClick={() => { setMostrarMaterialForm(!mostrarMaterialForm); setMostrarIndicadorForm(false); }} className="rounded-lg border border-nx-line px-3 py-2 text-xs font-semibold">+ Solicitar material</button></div>
        {mostrarIndicadorForm && <form onSubmit={registrarIndicador} className="mb-4 p-4 bg-nx-bg rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3">{[["alcance", "Alcance"], ["impresiones", "Impresiones"], ["clics", "Clics"], ["leads", "Leads"], ["conversiones", "Conversiones"], ["costo_por_lead", "Costo por lead (S/) · manual"], ["roi", "ROI (x) · manual"]].map(([key, label]) => <label key={key} className="text-xs font-semibold text-slate-600">{label}<input required={!['costo_por_lead', 'roi'].includes(key)} type="number" min={key === "roi" ? "-9999.99" : "0"} step={['costo_por_lead', 'roi'].includes(key) ? "0.01" : "1"} value={indicadorForm[key]} onChange={(e) => setIndicadorForm({ ...indicadorForm, [key]: e.target.value })} className="mt-1 w-full border border-nx-line bg-white rounded-lg px-3 py-2 text-sm font-normal" /></label>)}<p className="col-span-full text-xs text-slate-500">El costo por lead y el ROI se capturan manualmente según la medición de la plataforma.</p><div className="col-span-full flex justify-end"><button disabled={guardandoDetalle} className="rounded-lg bg-brand-violet text-white px-4 py-2 text-xs font-semibold">{guardandoDetalle ? "Guardando…" : "Guardar medición"}</button></div></form>}
        {mostrarMaterialForm && <form onSubmit={solicitarMaterial} className="mb-4 p-4 bg-nx-bg rounded-xl flex flex-wrap items-end gap-3"><label className="flex-1 min-w-[220px] text-xs font-semibold text-slate-600">Material<select required value={materialForm.id_producto} onChange={(e) => setMaterialForm({ ...materialForm, id_producto: e.target.value })} className="mt-1 w-full border border-nx-line bg-white rounded-lg px-3 py-2 text-sm font-normal"><option value="">Selecciona material</option>{productos.map((item) => <option key={item.id_producto} value={item.id_producto}>{item.codigo} · {item.nombre} (stock {item.stock_actual} {item.unidad_medida})</option>)}</select></label><label className="w-32 text-xs font-semibold text-slate-600">Cantidad<input required type="number" min="1" step="1" value={materialForm.cantidad_solicitada} onChange={(e) => setMaterialForm({ ...materialForm, cantidad_solicitada: e.target.value })} className="mt-1 w-full border border-nx-line bg-white rounded-lg px-3 py-2 text-sm font-normal" /></label><button disabled={guardandoDetalle || !materialForm.id_producto} className="rounded-lg bg-brand-violet text-white px-4 py-2 text-xs font-semibold">{guardandoDetalle ? "Enviando…" : "Enviar solicitud"}</button></form>}
        <div className="overflow-x-auto border border-nx-line rounded-xl"><table className="w-full text-sm"><thead className="bg-nx-bg text-xs text-slate-500"><tr>{["Fecha", "Alcance", "Impresiones", "Clics", "Leads", "Conversiones", "CPL", "ROI"].map((x) => <th key={x} className="text-left px-3 py-2">{x}</th>)}</tr></thead><tbody className="divide-y divide-nx-line">{(detalle.indicadores || []).length ? detalle.indicadores.map((item) => <tr key={item.id_indicador}><td className="px-3 py-2">{fecha(item.fecha_registro)}</td><td className="px-3 py-2">{item.alcance}</td><td className="px-3 py-2">{item.impresiones}</td><td className="px-3 py-2">{item.clics}</td><td className="px-3 py-2">{item.leads}</td><td className="px-3 py-2">{item.conversiones}</td><td className="px-3 py-2">{moneda(item.costo_por_lead)}</td><td className="px-3 py-2">{item.roi == null ? "—" : `${item.roi}x`}</td></tr>) : <tr><td colSpan="8" className="px-3 py-8 text-center text-slate-400">Aún no hay mediciones registradas.</td></tr>}</tbody></table></div>
        <h3 className="font-display font-bold text-sm mt-6 mb-2">Solicitudes a almacén</h3><div className="overflow-x-auto border border-nx-line rounded-xl"><table className="w-full text-sm"><thead className="bg-nx-bg text-xs text-slate-500"><tr>{["Fecha", "Material", "Cantidad", "Solicitante", "Estado"].map((x) => <th key={x} className="text-left px-3 py-2">{x}</th>)}</tr></thead><tbody className="divide-y divide-nx-line">{solicitudesMaterial.length ? solicitudesMaterial.map((item) => <tr key={item.id_solicitud}><td className="px-3 py-2">{new Date(item.fecha).toLocaleDateString("es-PE")}</td><td className="px-3 py-2">{item.codigo_producto} · {item.producto}</td><td className="px-3 py-2">{item.cantidad_solicitada} {item.unidad_medida}</td><td className="px-3 py-2">{item.solicitante}</td><td className="px-3 py-2">{item.estado}</td></tr>) : <tr><td colSpan="5" className="px-3 py-6 text-center text-slate-400">Aún no hay solicitudes de material.</td></tr>}</tbody></table></div>
      </div><div className="px-6 py-4 bg-nx-bg border-t border-nx-line flex justify-end"><button type="button" onClick={() => setDetalle(null)} className="px-4 py-2 rounded-lg border border-nx-line bg-white text-sm">Cerrar</button></div>
    </div></div>}
  </DashboardLayout>;
}

export default Campanias;
