import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../services/api";

const ESTADOS = ["Planificación", "En ejecución", "En revisión", "Atrasado", "Completado", "Cancelado"];
const TRANSICIONES = {
  Planificación: ["En ejecución", "Cancelado"],
  "En ejecución": ["En revisión", "Atrasado", "Cancelado"],
  "En revisión": ["En ejecución", "Completado", "Atrasado", "Cancelado"],
  Atrasado: ["En ejecución", "En revisión", "Cancelado"],
  Completado: [], Cancelado: [],
};
const ESTILO = {
  Planificación: "border-slate-400", "En ejecución": "border-brand-violet",
  "En revisión": "border-amber-400", Atrasado: "border-rose-500",
  Completado: "border-emerald-500", Cancelado: "border-slate-300",
};
const BADGE = {
  Planificación: "bg-slate-100 text-slate-700", "En ejecución": "bg-violet-100 text-violet-700",
  "En revisión": "bg-amber-100 text-amber-700", Atrasado: "bg-rose-100 text-rose-700",
  Completado: "bg-emerald-100 text-emerald-700", Cancelado: "bg-slate-100 text-slate-500",
};
const moneda = (value) => value == null ? "—" : new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(Number(value || 0));
const fecha = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("es-PE") : "—";
const vacio = { nombre: "", fecha_inicio: "", fecha_fin: "", presupuesto: "", objetivo: "", avance: 0, id_cliente: "", id_cotizacion: "", id_usuario: "", equipo: [] };

function Proyectos() {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState([]);
  const [catalogos, setCatalogos] = useState({ clientes: [], usuarios: [], cotizaciones: [] });
  const [query, setQuery] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [vista, setVista] = useState("kanban");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editarId, setEditarId] = useState(null);
  const [form, setForm] = useState(vacio);
  const [detalle, setDetalle] = useState(null);
  const [nuevoMiembro, setNuevoMiembro] = useState("");
  const [rolMiembro, setRolMiembro] = useState("");
  const [proyectoArrastrado, setProyectoArrastrado] = useState(null);
  const [columnaDestino, setColumnaDestino] = useState("");
  const [actualizandoEstado, setActualizandoEstado] = useState(null);

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (estadoFiltro) params.set("estado", estadoFiltro);
    return params.toString();
  }, [query, estadoFiltro]);

  async function cargar() {
    setCargando(true); setError("");
    try { const response = await api.get(`/proyectos${qs ? `?${qs}` : ""}`); setProyectos(response.data || []); }
    catch (err) { setError(err.message || "No se pudieron cargar los proyectos."); }
    finally { setCargando(false); }
  }

  useEffect(() => { cargar(); }, [qs]);
  useEffect(() => {
    api.get("/proyectos/catalogos").then((response) => setCatalogos(response.data || { clientes: [], usuarios: [], cotizaciones: [] }))
      .catch((err) => setError(err.message || "No se pudieron cargar los catálogos."));
  }, []);

  function abrirNuevo() { setEditarId(null); setForm(vacio); setError(""); setModal(true); }
  function abrirEdicion(proyecto) {
    setEditarId(proyecto.id_proyecto);
    setForm({ nombre: proyecto.nombre, fecha_inicio: proyecto.fecha_inicio?.slice(0, 10) || "", fecha_fin: proyecto.fecha_fin?.slice(0, 10) || "", presupuesto: proyecto.presupuesto ?? "", objetivo: proyecto.objetivo || "", avance: proyecto.avance ?? 0, id_cliente: String(proyecto.id_cliente), id_cotizacion: proyecto.id_cotizacion ? String(proyecto.id_cotizacion) : "", id_usuario: String(proyecto.id_usuario), equipo: (proyecto.equipo || []).map((m) => ({ id_usuario: String(m.id_usuario), rol_proyecto: m.rol_proyecto || "" })) });
    setModal(true);
  }

  async function abrirDetalle(proyecto) {
    try { const response = await api.get(`/proyectos/${proyecto.id_proyecto}`); setDetalle(response.data); }
    catch (err) { setError(err.message || "No se pudo cargar el proyecto."); }
  }

  async function guardar(event) {
    event.preventDefault(); setGuardando(true); setError("");
    const payload = { ...form, fecha_inicio: form.fecha_inicio || null, fecha_fin: form.fecha_fin || null, presupuesto: form.presupuesto === "" ? null : Number(form.presupuesto), avance: Number(form.avance), id_cliente: Number(form.id_cliente), id_cotizacion: form.id_cotizacion ? Number(form.id_cotizacion) : null, id_usuario: Number(form.id_usuario), equipo: form.equipo.map((item) => ({ ...item, id_usuario: Number(item.id_usuario), rol_proyecto: item.rol_proyecto || null })) };
    try {
      if (editarId) await api.put(`/proyectos/${editarId}`, payload); else await api.post("/proyectos", payload);
      setModal(false); await cargar();
    } catch (err) { setError(err.message || "No se pudo guardar el proyecto."); }
    finally { setGuardando(false); }
  }

  async function cambiarEstado(proyecto, estado) {
    if (estado === "Cancelado" && !window.confirm(`¿Cancelar el proyecto “${proyecto.nombre}”?`)) return;
    if (estado === "Completado" && !window.confirm(`¿Marcar “${proyecto.nombre}” como completado? Su avance quedará en 100%.`)) return;
    const anterior = proyecto.estado;
    try {
      setActualizandoEstado(proyecto.id_proyecto);
      setProyectos((items) => items.map((item) => Number(item.id_proyecto) === Number(proyecto.id_proyecto) ? { ...item, estado, ...(estado === "Completado" ? { avance: 100 } : {}) } : item));
      const response = await api.patch(`/proyectos/${proyecto.id_proyecto}/estado`, { estado });
      setProyectos((items) => items.map((item) => Number(item.id_proyecto) === Number(proyecto.id_proyecto) ? { ...item, ...response.data } : item));
      if (detalle?.id_proyecto === proyecto.id_proyecto) setDetalle((item) => ({ ...item, ...response.data }));
    }
    catch (err) {
      setProyectos((items) => items.map((item) => Number(item.id_proyecto) === Number(proyecto.id_proyecto) ? { ...item, estado: anterior } : item));
      if (detalle?.id_proyecto === proyecto.id_proyecto) setDetalle((item) => ({ ...item, estado: anterior }));
      setError(err.message || "No se pudo cambiar el estado del proyecto.");
    }
    finally { setActualizandoEstado(null); setProyectoArrastrado(null); setColumnaDestino(""); }
  }

  function iniciarArrastre(event, proyecto) {
    setProyectoArrastrado(proyecto);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(proyecto.id_proyecto));
  }

  async function soltarProyecto(event, nuevoEstado) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const id = Number(event.dataTransfer.getData("text/plain"));
    const proyecto = proyectos.find((item) => Number(item.id_proyecto) === id);
    setColumnaDestino("");
    if (!proyecto || proyecto.estado === nuevoEstado) { setProyectoArrastrado(null); return; }
    if (!(TRANSICIONES[proyecto.estado] || []).includes(nuevoEstado)) {
      setError(`No se permite mover un proyecto de “${proyecto.estado}” a “${nuevoEstado}”.`);
      setProyectoArrastrado(null);
      return;
    }
    await cambiarEstado(proyecto, nuevoEstado);
  }

  function agregarMiembro() {
    if (!nuevoMiembro || form.equipo.some((item) => String(item.id_usuario) === nuevoMiembro)) return;
    setForm({ ...form, equipo: [...form.equipo, { id_usuario: nuevoMiembro, rol_proyecto: rolMiembro }] });
    setNuevoMiembro(""); setRolMiembro("");
  }

  const clientesPorId = Object.fromEntries(catalogos.clientes.map((item) => [item.id_cliente, item.nombre]));
  const agrupados = ESTADOS.map((estado) => [estado, proyectos.filter((item) => item.estado === estado)]);
  const cotizacionesCliente = catalogos.cotizaciones.filter((item) => !form.id_cliente || Number(item.id_cliente) === Number(form.id_cliente));

  function tarjeta(proyecto) {
    return <article key={proyecto.id_proyecto} role="button" tabIndex={0} draggable={actualizandoEstado !== proyecto.id_proyecto} onDragStart={(event) => iniciarArrastre(event, proyecto)} onDragEnd={() => { setProyectoArrastrado(null); setColumnaDestino(""); }} onClick={() => abrirDetalle(proyecto)} onKeyDown={(e) => e.key === "Enter" && abrirDetalle(proyecto)} className={`bg-white rounded-xl p-3 shadow-soft border-l-4 ${ESTILO[proyecto.estado]} border-y border-r border-nx-line text-sm cursor-grab active:cursor-grabbing hover:shadow-pop transition ${proyectoArrastrado?.id_proyecto === proyecto.id_proyecto ? "opacity-50" : ""} ${actualizandoEstado === proyecto.id_proyecto ? "opacity-60" : ""}`}>
      <p className="font-semibold">{proyecto.nombre}</p><p className="text-xs text-slate-500 mt-1">Cliente: {proyecto.cliente}</p>
      <p className="text-xs text-slate-500">{proyecto.fecha_fin ? `Entrega: ${fecha(proyecto.fecha_fin)}` : proyecto.cotizacion || "Sin fecha de entrega"}</p>
      <div className="flex justify-between text-[11px] text-slate-500 mt-2"><span>{proyecto.responsable}</span><span>{proyecto.avance}% · {proyecto.tareas_completadas}/{proyecto.total_tareas} tareas</span></div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5"><div className={`h-1.5 rounded-full ${proyecto.estado === "Atrasado" ? "bg-rose-400" : proyecto.estado === "Completado" ? "bg-emerald-400" : "bg-brand-violet"}`} style={{ width: `${proyecto.avance}%` }} /></div>
    </article>;
  }

  return <DashboardLayout><section className="space-y-5">
    <div className="flex items-center justify-between flex-wrap gap-3"><div><h1 className="font-display text-2xl font-bold text-nx-900">Proyectos</h1><p className="text-sm text-slate-500">Proyectos contratados y servicios en ejecución.</p></div><div className="flex items-center gap-2"><div className="bg-white border border-nx-line rounded-lg p-1 flex text-xs font-medium"><button type="button" onClick={() => setVista("kanban")} className={`px-3 py-1.5 rounded-md ${vista === "kanban" ? "bg-nx-900 text-white" : "text-slate-500"}`}>Kanban</button><button type="button" onClick={() => setVista("lista")} className={`px-3 py-1.5 rounded-md ${vista === "lista" ? "bg-nx-900 text-white" : "text-slate-500"}`}>Lista</button></div><button type="button" onClick={abrirNuevo} className="rounded-xl bg-gradient-to-r from-brand-violet to-brand-indigo text-white text-sm font-semibold px-4 py-2 shadow-pop">+ Nuevo proyecto</button></div></div>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    <div className="bg-white rounded-2xl shadow-soft border border-nx-line p-3 flex flex-wrap gap-3"><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar proyecto, cliente o cotización…" className="flex-1 min-w-[220px] border border-nx-line rounded-lg px-3 py-2 text-sm"/><select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className="border border-nx-line rounded-lg px-3 py-2 text-sm bg-white"><option value="">Todos los estados</option>{ESTADOS.map((estado) => <option key={estado}>{estado}</option>)}</select></div>
    {cargando ? <div className="p-10 bg-white rounded-2xl text-center text-slate-400">Cargando proyectos…</div> : vista === "kanban" ? <div className="flex gap-4 overflow-x-auto pb-2">{agrupados.map(([estado, items]) => <div key={estado} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setColumnaDestino(estado); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setColumnaDestino(""); }} onDrop={(event) => soltarProyecto(event, estado)} className={`min-w-[260px] w-[280px] shrink-0 bg-white/70 rounded-2xl p-3 border transition ${columnaDestino === estado ? "border-dashed border-brand-violet bg-violet-50/50" : "border-nx-line"}`}><div className="flex items-center justify-between mb-2"><p className="text-xs font-bold text-slate-500">{estado.toLocaleUpperCase("es-PE")}</p><span className="text-xs text-slate-400">{items.length}</span></div><div className="min-h-[180px] space-y-2">{items.map(tarjeta)}{items.length === 0 && <p className="text-xs text-slate-400 text-center py-6">{proyectoArrastrado ? "Soltar proyecto aquí" : "Sin proyectos"}</p>}</div></div>)}</div> : <div className="bg-white rounded-2xl shadow-soft border border-nx-line overflow-x-auto"><table className="w-full min-w-[950px] text-sm"><thead className="bg-nx-bg text-slate-500 text-xs uppercase"><tr>{["Proyecto", "Cliente", "Responsable", "Entrega", "Progreso", "Tareas", "Estado", ""].map((x, i) => <th key={i} className="text-left px-4 py-3">{x}</th>)}</tr></thead><tbody className="divide-y divide-nx-line">{proyectos.map((item) => <tr key={item.id_proyecto} onClick={() => abrirDetalle(item)} className="hover:bg-nx-bg/60 cursor-pointer"><td className="px-4 py-3 font-medium">{item.nombre}</td><td className="px-4 py-3">{item.cliente}</td><td className="px-4 py-3">{item.responsable}</td><td className="px-4 py-3">{fecha(item.fecha_fin)}</td><td className="px-4 py-3"><div className="w-28 h-1.5 bg-slate-100 rounded-full"><div className="h-1.5 bg-brand-violet rounded-full" style={{ width: `${item.avance}%` }}/></div><span className="text-xs text-slate-500">{item.avance}%</span></td><td className="px-4 py-3">{item.tareas_completadas}/{item.total_tareas}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE[item.estado]}`}>{item.estado}</span></td><td className="px-4 py-3 text-right"><button type="button" onClick={(e) => { e.stopPropagation(); abrirDetalle(item); }} className="text-xs font-semibold text-brand-violet">Detalle</button></td></tr>)}</tbody></table></div>}
  </section>

  {modal && <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"><form onSubmit={guardar} className="bg-white w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"><div className="px-6 py-4 border-b border-nx-line flex justify-between"><div><h2 className="font-display font-bold text-lg">{editarId ? "Editar proyecto" : "Nuevo proyecto"}</h2><p className="text-xs text-slate-400">Los proyectos vinculados a cotización requieren una cotización aprobada.</p></div><button type="button" onClick={() => setModal(false)} aria-label="Cerrar">×</button></div>
    <div className="p-6 overflow-y-auto grid sm:grid-cols-2 gap-4 text-sm">
      <label className="sm:col-span-2 text-xs font-semibold text-slate-600">Nombre *<input required maxLength="150" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"/></label>
      <label className="text-xs font-semibold text-slate-600">Cliente *<select required value={form.id_cliente} onChange={(e) => setForm({ ...form, id_cliente: e.target.value, id_cotizacion: "" })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"><option value="">Selecciona cliente</option>{catalogos.clientes.map((item) => <option key={item.id_cliente} value={item.id_cliente}>{item.nombre}</option>)}</select></label>
      <label className="text-xs font-semibold text-slate-600">Responsable *<select required value={form.id_usuario} onChange={(e) => setForm({ ...form, id_usuario: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"><option value="">Selecciona responsable</option>{catalogos.usuarios.map((item) => <option key={item.id_usuario} value={item.id_usuario}>{item.nombre}</option>)}</select></label>
      <label className="text-xs font-semibold text-slate-600">Cotización aprobada (opcional)<select value={form.id_cotizacion} onChange={(e) => setForm({ ...form, id_cotizacion: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"><option value="">Sin cotización</option>{cotizacionesCliente.map((item) => <option key={item.id_cotizacion} value={item.id_cotizacion}>{item.codigo} · {item.cliente} · {moneda(item.monto_total)}</option>)}</select></label>
      <label className="text-xs font-semibold text-slate-600">Presupuesto (S/)<input type="number" min="0" step="0.01" value={form.presupuesto} onChange={(e) => setForm({ ...form, presupuesto: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"/></label>
      <label className="text-xs font-semibold text-slate-600">Fecha inicio<input type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"/></label>
      <label className="text-xs font-semibold text-slate-600">Fecha fin / entrega<input type="date" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"/></label>
      <label className="text-xs font-semibold text-slate-600">Avance (%)<input type="number" min="0" max="100" step="1" value={form.avance} onChange={(e) => setForm({ ...form, avance: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"/></label>
      <label className="sm:col-span-2 text-xs font-semibold text-slate-600">Objetivo<textarea maxLength="255" rows="2" value={form.objetivo || ""} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"/></label>
      <div className="sm:col-span-2 rounded-xl border border-nx-line p-3"><p className="text-xs font-semibold text-slate-600 mb-2">Equipo del proyecto</p><div className="flex flex-wrap gap-2"><select value={nuevoMiembro} onChange={(e) => setNuevoMiembro(e.target.value)} className="flex-1 min-w-[150px] border border-nx-line rounded-lg px-3 py-2 text-sm"><option value="">Seleccionar integrante</option>{catalogos.usuarios.filter((item) => !form.equipo.some((member) => Number(member.id_usuario) === Number(item.id_usuario))).map((item) => <option key={item.id_usuario} value={item.id_usuario}>{item.nombre}</option>)}</select><input value={rolMiembro} maxLength="60" onChange={(e) => setRolMiembro(e.target.value)} placeholder="Rol (opcional)" className="min-w-[130px] border border-nx-line rounded-lg px-3 py-2 text-sm"/><button type="button" onClick={agregarMiembro} disabled={!nuevoMiembro} className="px-3 py-2 border border-nx-line rounded-lg text-sm disabled:opacity-40">Agregar</button></div><div className="mt-2 flex flex-wrap gap-2">{form.equipo.map((item) => { const usuario = catalogos.usuarios.find((x) => Number(x.id_usuario) === Number(item.id_usuario)); return <span key={item.id_usuario} className="inline-flex items-center gap-2 rounded-full bg-nx-bg px-3 py-1 text-xs">{usuario?.nombre}{item.rol_proyecto ? ` · ${item.rol_proyecto}` : ""}<button type="button" onClick={() => setForm({ ...form, equipo: form.equipo.filter((m) => m.id_usuario !== item.id_usuario) })} aria-label="Quitar integrante">×</button></span>; })}</div></div>
    </div><div className="px-6 py-4 bg-nx-bg border-t border-nx-line flex justify-end gap-2"><button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg border border-nx-line bg-white text-sm">Cancelar</button><button disabled={guardando} className="px-5 py-2 rounded-lg bg-brand-violet text-white text-sm font-semibold disabled:opacity-50">{guardando ? "Guardando…" : "Guardar proyecto"}</button></div></form></div>}

  {detalle && <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"><div className="px-6 py-4 border-b border-nx-line flex justify-between"><div><h2 className="font-display font-bold text-lg">{detalle.nombre}</h2><p className="text-xs text-slate-400">{detalle.cliente} · {detalle.responsable}</p></div><button type="button" onClick={() => setDetalle(null)} aria-label="Cerrar">×</button></div><div className="p-6 overflow-y-auto space-y-5"><div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm"><div><p className="text-xs text-slate-400">Estado</p><span className={`inline-flex rounded-full px-2 py-1 text-xs ${BADGE[detalle.estado]}`}>{detalle.estado}</span></div><div><p className="text-xs text-slate-400">Fechas</p>{fecha(detalle.fecha_inicio)} – {fecha(detalle.fecha_fin)}</div><div><p className="text-xs text-slate-400">Presupuesto</p>{moneda(detalle.presupuesto)}</div><div><p className="text-xs text-slate-400">Cotización</p>{detalle.cotizacion || "Sin vínculo"}</div><div><p className="text-xs text-slate-400">Avance</p>{detalle.avance}%</div><div><p className="text-xs text-slate-400">Tareas</p>{detalle.tareas_completadas}/{detalle.total_tareas} completadas</div></div>{detalle.objetivo && <div><p className="text-xs text-slate-400">Objetivo</p><p className="text-sm">{detalle.objetivo}</p></div>}<div><p className="text-xs text-slate-400 mb-1">Equipo</p><p className="text-sm">{detalle.equipo.length ? detalle.equipo.map((item) => `${item.nombre}${item.rol_proyecto ? ` (${item.rol_proyecto})` : ""}`).join(", ") : "Sin integrantes adicionales"}</p></div><div><div className="flex justify-between items-center mb-2"><p className="font-display text-sm font-bold">Tareas del proyecto</p><button type="button" onClick={() => navigate(`/tareas?proyecto=${detalle.id_proyecto}`)} className="text-xs font-semibold text-brand-violet">Abrir tablero</button></div><div className="space-y-2">{detalle.tareas.length ? detalle.tareas.slice(0, 8).map((item) => <div key={item.id_tarea} className="flex items-center justify-between rounded-lg border border-nx-line p-2 text-sm"><span>{item.titulo}</span><span className="text-xs text-slate-500">{item.estado} · {item.prioridad}</span></div>) : <p className="text-sm text-slate-400">Este proyecto todavía no tiene tareas.</p>}</div></div></div><div className="px-6 py-4 bg-nx-bg border-t border-nx-line flex flex-wrap items-center justify-between gap-2"><div className="flex gap-2">{!['Completado', 'Cancelado'].includes(detalle.estado) && <button type="button" onClick={() => { setDetalle(null); abrirEdicion(detalle); }} className="px-4 py-2 rounded-lg border border-nx-line bg-white text-sm">Editar</button>}<button type="button" onClick={() => navigate(`/tareas?proyecto=${detalle.id_proyecto}`)} className="px-4 py-2 rounded-lg border border-nx-line bg-white text-sm">Ver tareas</button></div><div className="flex gap-2"><select value="" onChange={(e) => e.target.value && cambiarEstado(detalle, e.target.value)} className="border border-nx-line rounded-lg px-3 py-2 bg-white text-sm"><option value="">Cambiar estado</option>{(TRANSICIONES[detalle.estado] || []).map((state) => <option key={state}>{state}</option>)}</select><button type="button" onClick={() => setDetalle(null)} className="px-4 py-2 rounded-lg border border-nx-line bg-white text-sm">Cerrar</button></div></div></div></div>}
  </DashboardLayout>;
}

export default Proyectos;
