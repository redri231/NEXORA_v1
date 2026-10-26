import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { puedeVerRuta } from "../utils/permisos";

const campo = "rounded-lg border border-nx-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-violet";

function iniciales(personal) {
  return `${personal.nombres?.trim()?.[0] || ""}${personal.apellidos?.trim()?.[0] || ""}`.toUpperCase() || "?";
}

export default function RecursosHumanos() {
  const { usuario } = useAuth();
  const [personal, setPersonal] = useState([]);
  const [cargas, setCargas] = useState({});
  const [capacidadPuntos, setCapacidadPuntos] = useState(8);
  const [cargandoCargas, setCargandoCargas] = useState(true);
  const [errorCargas, setErrorCargas] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [areaFiltro, setAreaFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    let vigente = true;
    api.get("/usuarios")
      .then((response) => { if (vigente) setPersonal(response.data || []); })
      .catch((err) => { if (vigente) setError(err.message || "No se pudo cargar el directorio."); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, []);

  useEffect(() => {
    let vigente = true;
    api.get("/direccion/resumen")
      .then((response) => {
        if (!vigente) return;
        const resumen = response.data || {};
        setCargas(Object.fromEntries((resumen.equipo || []).map((persona) => [String(persona.id_usuario), persona])));
        setCapacidadPuntos(Number(resumen.resumen?.capacidad_puntos || 8));
      })
      .catch((err) => { if (vigente) { setErrorCargas(true); console.warn("No se pudo cargar la carga laboral del directorio:", err); } })
      .finally(() => { if (vigente) setCargandoCargas(false); });
    return () => { vigente = false; };
  }, []);

  const areas = useMemo(() => [...new Set(personal.map((x) => x.area?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")), [personal]);
  const filtrado = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es");
    return personal.filter((x) => {
      const contenido = [x.nombres, x.apellidos, x.email, x.username, x.cargo, x.area, x.rol].filter(Boolean).join(" ").toLocaleLowerCase("es");
      return (!texto || contenido.includes(texto)) && (!areaFiltro || x.area === areaFiltro) && (!estadoFiltro || x.estado === estadoFiltro);
    });
  }, [personal, busqueda, areaFiltro, estadoFiltro]);

  const activos = personal.filter((x) => x.estado === "Activo").length;
  const roles = new Set(personal.map((x) => x.rol).filter(Boolean)).size;

  async function exportar() {
    setError("");
    setExportando(true);
    try {
      const hoy = new Date().toISOString().slice(0, 10);
      await api.download("/reportes/usuarios/excel", `NEXORA_Directorio_Personal_${hoy}.xlsx`);
    } catch (err) {
      setError(err.message || "No se pudo exportar el directorio.");
    } finally {
      setExportando(false);
    }
  }

  async function exportarPDF() { try { const hoy = new Date().toISOString().slice(0, 10); await api.download("/reportes/usuarios/pdf", `NEXORA_Directorio_Personal_${hoy}.pdf`); } catch (err) { setError(err.message || "No se pudo exportar el directorio en PDF."); } }

  return <DashboardLayout>
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-violet">Gesti&#243;n del equipo</p>
          <h1 className="mt-1 text-2xl font-bold text-nx-950">Recursos Humanos</h1>
          <p className="mt-1 text-sm text-slate-500">Directorio de personal y datos organizacionales registrados.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportar} disabled={exportando || cargando} className="rounded-xl border border-nx-line bg-white px-4 py-2.5 text-sm font-semibold text-nx-800 disabled:opacity-50">
            {exportando ? "Exportando..." : "Exportar directorio completo"}
          </button>
          <button type="button" onClick={exportarPDF} disabled={cargando} className="rounded-xl border border-nx-line bg-white px-4 py-2.5 text-sm font-semibold text-nx-800 disabled:opacity-50">Descargar PDF</button>
          {puedeVerRuta(usuario, "/usuarios") && <Link to="/usuarios" className="rounded-xl bg-gradient-to-r from-brand-violet to-brand-indigo px-4 py-2.5 text-sm font-semibold text-white">
            {usuario?.rol === "Administrador" ? "Administrar usuarios y roles" : "Consultar usuarios y roles"}
          </Link>}
        </div>
      </header>

      {error && <div role="alert" className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        <span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Cerrar mensaje">&#215;</button>
      </div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Personal registrado", personal.length], ["Personal activo", activos], ["Areas", areas.length], ["Roles asignados", roles]].map(([titulo, valor]) =>
          <article key={titulo} className="rounded-2xl border border-nx-line bg-white p-4 shadow-soft">
            <p className="text-xs text-slate-500">{titulo}</p><p className="mt-1 font-display text-2xl font-extrabold text-nx-950">{cargando ? "..." : valor}</p>
          </article>)}
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-nx-line bg-white p-3">
        <label className="min-w-[230px] flex-1 text-xs font-semibold text-slate-600">Buscar personal
          <input type="search" className={`${campo} mt-1 w-full`} placeholder="Nombre, correo, cargo o usuario" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </label>
        <label className="text-xs font-semibold text-slate-600">&#193;rea
          <select className={`${campo} mt-1 block min-w-44`} value={areaFiltro} onChange={(e) => setAreaFiltro(e.target.value)}>
            <option value="">Todas las &#225;reas</option>{areas.map((area) => <option key={area}>{area}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">Estado
          <select className={`${campo} mt-1 block min-w-36`} value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
            <option value="">Todos</option><option>Activo</option><option>Inactivo</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-nx-line bg-white shadow-soft">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-nx-bg text-xs uppercase text-slate-500"><tr>
            {["Personal", "Cargo y area", "Rol", "Correo", "Carga", "Estado"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-nx-line">
            {cargando ? <tr><td colSpan="6" className="py-12 text-center text-slate-400">Cargando directorio...</td></tr>
              : filtrado.length === 0 ? <tr><td colSpan="6" className="py-12 text-center text-slate-400">No hay personal que coincida con los filtros.</td></tr>
                : filtrado.map((x) => {
                  const carga = cargas[String(x.id_usuario)];
                  const porcentaje = Number(carga?.carga_pct || 0);
                  const colorCarga = porcentaje > 100 ? "bg-rose-500" : porcentaje >= 88 ? "bg-amber-400" : "bg-brand-violet";
                  return <tr key={x.id_usuario} className="hover:bg-nx-bg/60">
                  <td className="px-4 py-3"><div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{iniciales(x)}</span>
                    <span><span className="block font-semibold text-nx-950">{x.nombres} {x.apellidos}</span><span className="text-xs text-slate-400">@{x.username}</span></span>
                  </div></td>
                  <td className="px-4 py-3"><span className="block font-medium">{x.cargo || "Sin cargo"}</span><span className="text-xs text-slate-500">{x.area || "Sin area"}</span></td>
                  <td className="px-4 py-3"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{x.rol || "Sin rol"}</span></td>
                  <td className="px-4 py-3">{x.email ? <a href={`mailto:${x.email}`} className="text-brand-violet hover:underline">{x.email}</a> : <span className="text-slate-400">Sin correo</span>}</td>
                  <td className="px-4 py-3">{x.estado !== "Activo" ? <span className="text-xs text-slate-400">No aplica</span> : cargandoCargas ? <span className="text-xs text-slate-400">Calculando...</span> : carga ? <div className="w-40">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs"><span className={`font-bold ${porcentaje > 100 ? "text-rose-600" : porcentaje >= 88 ? "text-amber-600" : "text-slate-600"}`}>{porcentaje}%</span><span className="text-slate-400">{carga.carga_puntos}/{capacidadPuntos} pts · {carga.tareas_urgentes_activas} urgentes</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${colorCarga}`} style={{ width: `${Math.min(porcentaje, 100)}%` }} /></div>
                  </div> : <span className="text-xs text-slate-400">{errorCargas ? "No disponible" : "Sin carga asignada"}</span>}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${x.estado === "Activo" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{x.estado}</span></td>
                </tr>;
                })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">Mostrando {filtrado.length} de {personal.length} personas. La exportaci&#243;n genera el directorio completo.</p>
    </section>
  </DashboardLayout>;
}
