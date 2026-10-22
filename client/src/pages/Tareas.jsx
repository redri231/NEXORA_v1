import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../services/api";

const ESTADOS = ["Por hacer", "En progreso", "En revisión", "Completada"];
const PRIORIDADES = ["Baja", "Media", "Alta", "Urgente"];
const COLOR_PRIORIDAD = { Baja: "bg-slate-100 text-slate-600", Media: "bg-amber-100 text-amber-700", Alta: "bg-violet-100 text-violet-700", Urgente: "bg-rose-100 text-rose-700" };
const vacio = { titulo: "", descripcion: "", fecha_limite: "", prioridad: "Media", id_proyecto: "", id_usuario: "" };
const fecha = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("es-PE") : "Sin fecha límite";

function Tareas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tareas, setTareas] = useState([]);
  const [catalogos, setCatalogos] = useState({ proyectos: [], usuarios: [] });
  const [busqueda, setBusqueda] = useState("");
  const [proyectoFiltro, setProyectoFiltro] = useState(searchParams.get("proyecto") || "");
  const [prioridadFiltro, setPrioridadFiltro] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [editarId, setEditarId] = useState(null);
  const [form, setForm] = useState(vacio);
  const [tareaArrastrada, setTareaArrastrada] = useState(null);
  const [columnaDestino, setColumnaDestino] = useState("");
  const [actualizandoEstado, setActualizandoEstado] = useState(null);

  useEffect(() => {
    const idProyecto = searchParams.get("proyecto") || "";
    setProyectoFiltro(idProyecto);
  }, [searchParams]);

  const qs = useMemo(() => {
    const params = new URLSearchParams();
    if (busqueda.trim()) params.set("q", busqueda.trim());
    if (proyectoFiltro) params.set("id_proyecto", proyectoFiltro);
    if (prioridadFiltro) params.set("prioridad", prioridadFiltro);
    return params.toString();
  }, [busqueda, proyectoFiltro, prioridadFiltro]);

  async function cargar() {
    setCargando(true); setError("");
    try { const response = await api.get(`/tareas${qs ? `?${qs}` : ""}`); setTareas(response.data || []); }
    catch (err) { setError(err.message || "No se pudieron cargar las tareas."); }
    finally { setCargando(false); }
  }

  useEffect(() => { cargar(); }, [qs]);
  useEffect(() => {
    api.get("/tareas/catalogos").then((response) => setCatalogos(response.data || { proyectos: [], usuarios: [] }))
      .catch((err) => setError(err.message || "No se pudieron cargar los datos de las tareas."));
  }, []);

  function abrirNueva() { setEditarId(null); setForm({ ...vacio, id_proyecto: proyectoFiltro }); setError(""); setModal(true); }
  function abrirEdicion(tarea) {
    setEditarId(tarea.id_tarea);
    setForm({ titulo: tarea.titulo, descripcion: tarea.descripcion || "", fecha_limite: tarea.fecha_limite?.slice(0, 10) || "", prioridad: tarea.prioridad, id_proyecto: String(tarea.id_proyecto), id_usuario: tarea.id_usuario ? String(tarea.id_usuario) : "" });
    setModal(true);
  }

  async function guardar(event) {
    event.preventDefault(); setGuardando(true); setError("");
    const payload = { ...form, fecha_limite: form.fecha_limite || null, id_proyecto: Number(form.id_proyecto), id_usuario: form.id_usuario ? Number(form.id_usuario) : null };
    try {
      if (editarId) await api.put(`/tareas/${editarId}`, payload); else await api.post("/tareas", payload);
      setModal(false); await cargar();
    } catch (err) { setError(err.message || "No se pudo guardar la tarea."); }
    finally { setGuardando(false); }
  }

  async function cambiarEstado(tarea, estado) {
    const anterior = tarea.estado;
    try {
      setActualizandoEstado(tarea.id_tarea);
      setTareas((items) => items.map((item) => Number(item.id_tarea) === Number(tarea.id_tarea) ? { ...item, estado } : item));
      const response = await api.patch(`/tareas/${tarea.id_tarea}/estado`, { estado });
      setTareas((items) => items.map((item) => Number(item.id_tarea) === Number(tarea.id_tarea) ? { ...item, ...response.data } : item));
    }
    catch (err) {
      setTareas((items) => items.map((item) => Number(item.id_tarea) === Number(tarea.id_tarea) ? { ...item, estado: anterior } : item));
      setError(err.message || "No se pudo cambiar el estado de la tarea.");
    }
    finally { setActualizandoEstado(null); setTareaArrastrada(null); setColumnaDestino(""); }
  }

  function iniciarArrastre(event, tarea) {
    setTareaArrastrada(tarea);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(tarea.id_tarea));
  }

  async function soltarTarea(event, nuevoEstado) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const id = Number(event.dataTransfer.getData("text/plain"));
    const tarea = tareas.find((item) => Number(item.id_tarea) === id);
    setColumnaDestino("");
    if (!tarea || tarea.estado === nuevoEstado) { setTareaArrastrada(null); return; }
    await cambiarEstado(tarea, nuevoEstado);
  }

  const grupos = ESTADOS.map((estado) => [estado, tareas.filter((item) => item.estado === estado)]);
  const hoy = new Date().toISOString().slice(0, 10);

  return <DashboardLayout><section className="space-y-5">
    <div className="flex items-center justify-between flex-wrap gap-3"><div><h1 className="font-display text-2xl font-bold text-nx-900">Tareas</h1><p className="text-sm text-slate-500">Actividades organizadas por estado y asociadas a proyectos.</p></div><button type="button" onClick={abrirNueva} disabled={!catalogos.proyectos.length} className="rounded-xl bg-nx-900 text-white text-sm font-semibold px-4 py-2 disabled:opacity-50">+ Tarea</button></div>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    <div className="bg-white rounded-2xl shadow-soft border border-nx-line p-3 flex flex-wrap gap-3"><input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar tarea, descripción o responsable…" className="flex-1 min-w-[220px] border border-nx-line rounded-lg px-3 py-2 text-sm"/><select value={proyectoFiltro} onChange={(e) => { const value = e.target.value; setProyectoFiltro(value); setSearchParams(value ? { proyecto: value } : {}); }} className="border border-nx-line rounded-lg px-3 py-2 bg-white text-sm"><option value="">Todos los proyectos</option>{catalogos.proyectos.map((item) => <option key={item.id_proyecto} value={item.id_proyecto}>{item.nombre}</option>)}</select><select value={prioridadFiltro} onChange={(e) => setPrioridadFiltro(e.target.value)} className="border border-nx-line rounded-lg px-3 py-2 bg-white text-sm"><option value="">Todas las prioridades</option>{PRIORIDADES.map((item) => <option key={item}>{item}</option>)}</select></div>
    {cargando ? <div className="p-10 bg-white rounded-2xl text-center text-slate-400">Cargando tareas…</div> : <div className="flex gap-4 overflow-x-auto pb-2">{grupos.map(([estado, items]) => <div key={estado} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setColumnaDestino(estado); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setColumnaDestino(""); }} onDrop={(event) => soltarTarea(event, estado)} className={`min-w-[270px] w-[290px] shrink-0 bg-white/70 rounded-2xl p-3 border transition ${columnaDestino === estado ? "border-dashed border-brand-violet bg-violet-50/50" : "border-nx-line"}`}><div className="flex items-center justify-between mb-2"><p className="text-xs font-bold text-slate-500">{estado.toLocaleUpperCase("es-PE")}</p><span className="text-xs text-slate-400">{items.length}</span></div><div className="min-h-[180px] space-y-2">{items.map((tarea) => { const vencida = tarea.fecha_limite && tarea.fecha_limite.slice(0, 10) < hoy && tarea.estado !== "Completada"; return <article key={tarea.id_tarea} draggable={actualizandoEstado !== tarea.id_tarea} onDragStart={(event) => iniciarArrastre(event, tarea)} onDragEnd={() => { setTareaArrastrada(null); setColumnaDestino(""); }} className={`bg-white rounded-xl p-3 shadow-soft border ${vencida ? "border-rose-300" : "border-nx-line"} cursor-grab active:cursor-grabbing transition ${tareaArrastrada?.id_tarea === tarea.id_tarea ? "opacity-50" : ""} ${actualizandoEstado === tarea.id_tarea ? "opacity-60" : ""}`}><button type="button" onClick={() => abrirEdicion(tarea)} className="w-full text-left"><p className="font-semibold text-sm">{tarea.titulo}</p><p className="text-xs text-slate-500 mt-1">{tarea.proyecto}</p>{tarea.descripcion && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tarea.descripcion}</p>}</button><div className="flex items-center justify-between mt-3 gap-2"><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${COLOR_PRIORIDAD[tarea.prioridad]}`}>{tarea.prioridad}</span><span className={`text-[11px] ${vencida ? "text-rose-600 font-semibold" : "text-slate-500"}`}>{vencida ? "Vencida · " : "Entrega · "}{fecha(tarea.fecha_limite)}</span></div><div className="mt-2 flex items-center justify-between"><span className="text-xs text-slate-500">{tarea.responsable || "Sin responsable"}</span><select aria-label={`Estado de ${tarea.titulo}`} value={tarea.estado} disabled={actualizandoEstado === tarea.id_tarea} onChange={(e) => cambiarEstado(tarea, e.target.value)} className="max-w-[135px] border border-nx-line rounded-md px-1.5 py-1 text-[11px] bg-white">{ESTADOS.map((item) => <option key={item}>{item}</option>)}</select></div></article>; })}{items.length === 0 && <p className="text-xs text-slate-400 text-center py-6">{tareaArrastrada ? "Soltar tarea aquí" : "Sin tareas"}</p>}</div></div>)}</div>}
  </section>

  {modal && <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"><form onSubmit={guardar} className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"><div className="px-6 py-4 border-b border-nx-line flex justify-between"><div><h2 className="font-display font-bold text-lg">{editarId ? "Editar tarea" : "Nueva tarea"}</h2><p className="text-xs text-slate-400">Asigna la actividad a un proyecto.</p></div><button type="button" onClick={() => setModal(false)} aria-label="Cerrar">×</button></div><div className="p-6 grid sm:grid-cols-2 gap-4 text-sm"><label className="sm:col-span-2 text-xs font-semibold text-slate-600">Título *<input required maxLength="150" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"/></label><label className="text-xs font-semibold text-slate-600">Proyecto *<select required value={form.id_proyecto} onChange={(e) => setForm({ ...form, id_proyecto: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"><option value="">Selecciona proyecto</option>{catalogos.proyectos.map((item) => <option key={item.id_proyecto} value={item.id_proyecto}>{item.nombre}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Responsable<select value={form.id_usuario} onChange={(e) => setForm({ ...form, id_usuario: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"><option value="">Sin asignar</option>{catalogos.usuarios.map((item) => <option key={item.id_usuario} value={item.id_usuario}>{item.nombre}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Prioridad *<select value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal">{PRIORIDADES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Fecha límite<input type="date" value={form.fecha_limite} onChange={(e) => setForm({ ...form, fecha_limite: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"/></label><label className="sm:col-span-2 text-xs font-semibold text-slate-600">Descripción<textarea maxLength="255" rows="3" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="mt-1 block w-full border border-nx-line rounded-lg px-3 py-2 text-sm font-normal"/></label></div><div className="px-6 py-4 bg-nx-bg border-t border-nx-line flex justify-end gap-2"><button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg border border-nx-line bg-white text-sm">Cancelar</button><button disabled={guardando || !catalogos.proyectos.length} className="px-5 py-2 rounded-lg bg-brand-violet text-white text-sm font-semibold disabled:opacity-50">{guardando ? "Guardando…" : "Guardar tarea"}</button></div></form></div>}
  </DashboardLayout>;
}

export default Tareas;
