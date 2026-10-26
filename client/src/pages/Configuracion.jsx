import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../services/api";

const campo = "w-full rounded-xl border border-nx-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-violet";
const boton = "rounded-xl bg-brand-violet px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50";
const inicialServicio = { nombre: "", categoria: "", descripcion: "", precio_base: "", estado: "Activo" };
const inicialEmpresa = { razon_social: "", ruc: "", direccion: "", telefono: "", email: "", logo_url: "", igv_porcentaje: "18" };
const tarjetas = [
  { id: "usuarios", icono: "👥", titulo: "Usuarios", detalle: "Cuentas y datos del equipo" },
  { id: "roles", icono: "🔐", titulo: "Roles y permisos", detalle: "Acceso por módulo y acción" },
  { id: "areas", icono: "🏢", titulo: "Áreas", detalle: "Áreas ya usadas por el equipo" },
  { id: "servicios", icono: "✦", titulo: "Servicios", detalle: "Catálogo comercial de servicios" },
  { id: "notificaciones", icono: "🔔", titulo: "Notificaciones", detalle: "Canales de cada tipo de alerta" },
  { id: "empresa", icono: "▣", titulo: "Datos de la empresa", detalle: "Identidad y datos de contacto" },
];

function Configuracion() {
  const [panel, setPanel] = useState(null);
  const [seleccion, setSeleccion] = useState("");
  const [rolId, setRolId] = useState("");
  const [permisos, setPermisos] = useState([]);
  const [servicio, setServicio] = useState(inicialServicio);
  const [servicioId, setServicioId] = useState(null);
  const [empresa, setEmpresa] = useState(inicialEmpresa);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function cargar() {
    setCargando(true);
    try {
      const respuesta = await api.get("/configuracion/panel");
      setPanel(respuesta.data);
      setEmpresa({ ...inicialEmpresa, ...(respuesta.data.empresa || {}) });
      setError("");
    } catch (e) { setError(e.message || "No se pudo cargar la configuración."); }
    finally { setCargando(false); }
  }

  useEffect(() => { cargar(); }, []);
  useEffect(() => {
    if (!panel?.roles?.length) return;
    setRolId((actual) => actual || String(panel.roles[0].id_rol));
  }, [panel]);

  const permisosRol = useMemo(() => panel?.matriz?.filter((p) => String(p.id_rol) === rolId) || [], [panel, rolId]);
  const grupos = useMemo(() => Object.groupBy ? Object.groupBy(permisosRol, (p) => p.modulo) : permisosRol.reduce((acc, p) => ((acc[p.modulo] ||= []).push(p), acc), {}), [permisosRol]);
  const nombreRolSeleccionado = panel?.roles?.find((r) => String(r.id_rol) === rolId)?.nombre;
  const rolProtegido = ["administrador", "gerencia"].includes(String(nombreRolSeleccionado || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());

  useEffect(() => { setPermisos(permisosRol.filter((p) => p.habilitado).map((p) => p.id_permiso)); }, [permisosRol]);

  function cambiarPermiso(id, marcado) {
    setPermisos((actual) => marcado ? [...new Set([...actual, id])] : actual.filter((item) => item !== id));
  }

  async function guardarPermisos() {
    setGuardando(true); setMensaje(""); setError("");
    try { await api.put(`/configuracion/roles/${rolId}/permisos`, { permisos }); setMensaje("Permisos guardados. El backend los aplica de inmediato; el menú se actualiza cuando el usuario vuelva a iniciar sesión."); await cargar(); }
    catch (e) { setError(e.message); }
    finally { setGuardando(false); }
  }

  function nuevoServicio() { setServicio(inicialServicio); setServicioId(null); }
  function editarServicio(item) { setServicio({ ...item, precio_base: item.precio_base ?? "" }); setServicioId(item.id_servicio); }
  async function guardarServicio(event) {
    event.preventDefault(); setGuardando(true); setError(""); setMensaje("");
    const body = { ...servicio, precio_base: servicio.precio_base === "" ? null : Number(servicio.precio_base) };
    try {
      if (servicioId) await api.put(`/configuracion/servicios/${servicioId}`, body);
      else await api.post("/configuracion/servicios", body);
      setMensaje("Servicio guardado."); nuevoServicio(); await cargar();
    } catch (e) { setError(e.message); }
    finally { setGuardando(false); }
  }

  async function alternarNotificacion(item, campoNombre) {
    setError("");
    const body = { por_correo: campoNombre === "por_correo" ? !item.por_correo : item.por_correo, en_plataforma: campoNombre === "en_plataforma" ? !item.en_plataforma : item.en_plataforma };
    try {
      await api.patch(`/configuracion/notificaciones/${item.id_config}`, body);
      setPanel((actual) => ({ ...actual, notificaciones: actual.notificaciones.map((n) => n.id_config === item.id_config ? { ...n, ...body } : n) }));
    } catch (e) { setError(e.message); }
  }

  async function guardarEmpresa(event) {
    event.preventDefault(); setGuardando(true); setError(""); setMensaje("");
    try { const respuesta = await api.put("/configuracion/empresa", { ...empresa, igv_porcentaje: Number(empresa.igv_porcentaje) }); setEmpresa({ ...inicialEmpresa, ...respuesta.data }); setMensaje("Datos de la empresa guardados."); }
    catch (e) { setError(e.message); }
    finally { setGuardando(false); }
  }

  async function alternarEstadoServicio(item) {
    setError("");
    try { await api.patch(`/configuracion/servicios/${item.id_servicio}/estado`, { estado: item.estado === "Activo" ? "Inactivo" : "Activo" }); await cargar(); }
    catch (e) { setError(e.message); }
  }

  return <DashboardLayout>
    <div className="space-y-6">
      <header><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-violet">Sistema</p><h1 className="mt-1 font-display text-2xl font-extrabold text-nx-950">Configuración</h1><p className="mt-1 text-sm text-slate-500">Parámetros generales de la plataforma</p></header>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {mensaje && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{mensaje}</div>}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tarjetas.map((item) => {
          const clases = `block rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${seleccion === item.id ? "border-brand-violet ring-2 ring-violet-100" : "border-nx-line"}`;
          const contenido = <><span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-xl">{item.icono}</span><p className="mt-4 font-display font-bold text-nx-950">{item.titulo}</p><p className="mt-1 text-sm text-slate-500">{item.detalle}</p><span className="mt-4 inline-block text-sm font-semibold text-brand-violet">{item.id === "usuarios" ? "Abrir Usuarios y Roles →" : "Administrar →"}</span></>;
          return item.id === "usuarios"
            ? <Link key={item.id} to="/usuarios" className={clases}>{contenido}</Link>
            : <button key={item.id} onClick={() => { setSeleccion(item.id); setMensaje(""); }} className={clases}>{contenido}</button>;
        })}
      </section>
      {!seleccion && <div className="rounded-2xl border border-dashed border-nx-line bg-white px-6 py-10 text-center text-sm text-slate-500">Selecciona una tarjeta para administrar su configuración.</div>}
      {cargando && <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">Cargando datos de configuración…</div>}

      {!cargando && seleccion === "roles" && <section className="rounded-2xl border border-nx-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-lg font-bold">Roles y permisos</h2><p className="text-sm text-slate-500">Define qué módulos y acciones están habilitados para cada rol.</p></div><label className="text-sm font-semibold">Rol<select className={`${campo} mt-1 min-w-56`} value={rolId} onChange={(e) => setRolId(e.target.value)}>{panel.roles.map((r) => <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>)}</select></label></div>
        {rolProtegido && <div className="mt-4 rounded-xl bg-sky-50 p-3 text-sm text-sky-800">Este rol mantiene sus permisos por política: Administración tiene acceso total y Gerencia tiene consulta global.</div>}
        <div className="mt-5 space-y-4">{Object.entries(grupos).map(([modulo, items]) => <div key={modulo} className="rounded-xl border border-nx-line p-4"><h3 className="mb-3 font-semibold capitalize text-nx-900">{modulo.replaceAll("_", " ")}</h3><div className="flex flex-wrap gap-x-6 gap-y-3">{items.map((p) => <label key={p.id_permiso} className={`flex items-center gap-2 text-sm ${rolProtegido ? "text-slate-400" : "cursor-pointer"}`}><input type="checkbox" disabled={rolProtegido} className="accent-violet-600" checked={permisos.includes(p.id_permiso)} onChange={(e) => cambiarPermiso(p.id_permiso, e.target.checked)} />{p.accion}</label>)}</div></div>)}</div>
        <div className="mt-5 flex justify-end"><button className={boton} disabled={guardando || rolProtegido} onClick={guardarPermisos}>{guardando ? "Guardando…" : "Guardar permisos"}</button></div>
      </section>}

      {!cargando && seleccion === "areas" && <section className="rounded-2xl border border-nx-line bg-white p-5 shadow-sm"><h2 className="font-display text-lg font-bold">Áreas registradas</h2><p className="mt-1 text-sm text-slate-500">El modelo vigente guarda el área como texto en cada usuario; esta lista se obtiene de esos valores.</p><div className="mt-4 flex flex-wrap gap-2">{panel.areas.length ? panel.areas.map((area) => <span key={area.nombre} className="rounded-full bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-800">{area.nombre}</span>) : <span className="text-sm text-slate-500">Aún no hay áreas registradas.</span>}</div><div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Para crear, renombrar o desactivar áreas como catálogo independiente se necesitaría una tabla propia, que no existe en el SQL actual. Puedes actualizar el campo Área desde <Link className="font-bold underline" to="/usuarios">Usuarios y Roles</Link>.</div></section>}

      {!cargando && seleccion === "servicios" && <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-2xl border border-nx-line bg-white shadow-sm"><div className="flex items-center justify-between border-b border-nx-line p-5"><div><h2 className="font-display text-lg font-bold">Catálogo de servicios</h2><p className="text-sm text-slate-500">Los servicios activos se pueden seleccionar en cotizaciones.</p></div><button className={boton} onClick={nuevoServicio}>Nuevo servicio</button></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-violet-50 text-xs uppercase text-violet-900"><tr>{["Servicio", "Categoría", "Precio base", "Estado", "Acciones"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{panel.servicios.map((item) => <tr key={item.id_servicio} className="border-t border-nx-line"><td className="px-4 py-3 font-semibold">{item.nombre}</td><td className="px-4 py-3">{item.categoria || "—"}</td><td className="px-4 py-3">{item.precio_base == null ? "—" : `S/ ${Number(item.precio_base).toFixed(2)}`}</td><td className="px-4 py-3">{item.estado}</td><td className="space-x-3 px-4 py-3"><button className="font-semibold text-brand-violet" onClick={() => editarServicio(item)}>Editar</button><button className="font-semibold text-slate-600" onClick={() => alternarEstadoServicio(item)}>{item.estado === "Activo" ? "Desactivar" : "Activar"}</button></td></tr>)}</tbody></table></div></div>
        <form onSubmit={guardarServicio} className="h-fit space-y-3 rounded-2xl border border-nx-line bg-white p-5 shadow-sm"><h2 className="font-display text-lg font-bold">{servicioId ? "Editar servicio" : "Nuevo servicio"}</h2><label className="block text-sm font-medium">Nombre<input required maxLength="120" className={`${campo} mt-1`} value={servicio.nombre} onChange={(e) => setServicio({ ...servicio, nombre: e.target.value })} /></label><label className="block text-sm font-medium">Categoría<input maxLength="60" className={`${campo} mt-1`} value={servicio.categoria} onChange={(e) => setServicio({ ...servicio, categoria: e.target.value })} /></label><label className="block text-sm font-medium">Descripción<input maxLength="255" className={`${campo} mt-1`} value={servicio.descripcion} onChange={(e) => setServicio({ ...servicio, descripcion: e.target.value })} /></label><label className="block text-sm font-medium">Precio base (S/)<input type="number" min="0" step="0.01" className={`${campo} mt-1`} value={servicio.precio_base} onChange={(e) => setServicio({ ...servicio, precio_base: e.target.value })} /></label>{servicioId && <label className="block text-sm font-medium">Estado<select className={`${campo} mt-1`} value={servicio.estado} onChange={(e) => setServicio({ ...servicio, estado: e.target.value })}><option>Activo</option><option>Inactivo</option></select></label>}<button className={`${boton} w-full`} disabled={guardando}>{guardando ? "Guardando…" : "Guardar servicio"}</button></form>
      </section>}

      {!cargando && seleccion === "notificaciones" && <section className="rounded-2xl border border-nx-line bg-white p-5 shadow-sm"><h2 className="font-display text-lg font-bold">Canales de notificación</h2><p className="mt-1 text-sm text-slate-500">Activa los canales disponibles para cada tipo de alerta.</p><div className="mt-3 rounded-xl bg-sky-50 p-3 text-sm text-sky-800">Las alertas en plataforma respetan esta configuración. El sistema todavía no tiene integrado un servicio de envío de correos; esa preferencia queda registrada para una futura integración.</div><div className="mt-4 divide-y divide-nx-line">{panel.notificaciones.map((n) => <div key={n.id_config} className="flex flex-wrap items-center justify-between gap-4 py-4"><span className="font-medium">{n.tipo_alerta}</span><div className="flex gap-5">{[["por_correo", "Correo"], ["en_plataforma", "Plataforma"]].map(([key, texto]) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-violet-600" checked={n[key]} onChange={() => alternarNotificacion(n, key)} />{texto}</label>)}</div></div>)}</div></section>}

      {!cargando && seleccion === "empresa" && <form onSubmit={guardarEmpresa} className="rounded-2xl border border-nx-line bg-white p-5 shadow-sm"><div className="mb-5"><h2 className="font-display text-lg font-bold">Datos de la empresa</h2><p className="text-sm text-slate-500">Información institucional utilizada por el sistema.</p></div><div className="grid gap-4 sm:grid-cols-2">{[["razon_social", "Razón social", true], ["ruc", "RUC", false], ["direccion", "Dirección", false], ["telefono", "Teléfono", false], ["email", "Correo", false], ["logo_url", "URL del logo", false], ["igv_porcentaje", "IGV (%)", true]].map(([key, label, required]) => <label key={key} className="text-sm font-medium">{label}<input required={required} maxLength={key === "razon_social" ? 150 : key === "direccion" ? 200 : key === "ruc" ? 11 : undefined} type={key === "igv_porcentaje" ? "number" : key === "email" ? "email" : "text"} min={key === "igv_porcentaje" ? 0 : undefined} max={key === "igv_porcentaje" ? 100 : undefined} step={key === "igv_porcentaje" ? "0.01" : undefined} className={`${campo} mt-1`} value={empresa[key] ?? ""} onChange={(e) => setEmpresa({ ...empresa, [key]: e.target.value })} /></label>)}</div><div className="mt-5 flex justify-end"><button className={boton} disabled={guardando}>{guardando ? "Guardando…" : "Guardar datos"}</button></div></form>}
    </div>
  </DashboardLayout>;
}

export default Configuracion;
