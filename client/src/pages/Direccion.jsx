import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../services/api";

const monedaPct = (value) => `${Number(value || 0)}%`;
const estadoAlerta = {
  critico: "border-rose-200 bg-rose-50 text-rose-800",
  advertencia: "border-amber-200 bg-amber-50 text-amber-800",
  informacion: "border-sky-200 bg-sky-50 text-sky-800",
};

export default function Direccion() {
  const [datos, setDatos] = useState({ resumen: {}, equipo: [], alertas: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;
    api.get("/direccion/resumen")
      .then((response) => { if (vigente) setDatos(response.data || { resumen: {}, equipo: [], alertas: [] }); })
      .catch((err) => { if (vigente) setError(err.message || "No se pudo cargar el panel de Dirección."); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, []);

  const { resumen, equipo, alertas } = datos;
  const progresoEquipo = Math.min(Number(resumen.productividad_equipo || 0), 100);

  return <DashboardLayout>
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-violet">Gesti&#243;n ejecutiva</p>
          <h1 className="mt-1 text-2xl font-bold text-nx-950">Direcci&#243;n / Gerencia</h1>
          <p className="mt-1 text-sm text-slate-500">Seguimiento de la carga de trabajo y el avance del equipo.</p>
        </div>
        <Link to="/tareas" className="rounded-xl bg-gradient-to-r from-brand-violet to-brand-indigo px-4 py-2.5 text-sm font-semibold text-white">Ver tablero de tareas</Link>
      </header>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["Personal activo", resumen.personal_activo || 0],
          ["Tareas activas", resumen.tareas_activas || 0],
          ["Productividad equipo", monedaPct(resumen.productividad_equipo)],
          ["Tareas vencidas", resumen.tareas_vencidas || 0],
        ].map(([titulo, valor], index) => <article key={titulo} className={`rounded-2xl border bg-white p-4 shadow-soft ${index === 3 && Number(valor) > 0 ? "border-rose-200" : "border-nx-line"}`}>
          <p className="text-xs text-slate-500">{titulo}</p>
          <p className={`mt-1 font-display text-2xl font-extrabold ${index === 3 && Number(valor) > 0 ? "text-rose-600" : "text-nx-950"}`}>{cargando ? "..." : valor}</p>
        </article>)}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <section className="rounded-2xl border border-nx-line bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="font-display text-base font-bold text-nx-950">Productividad equipo</h2><p className="mt-1 text-xs text-slate-500">Tareas completadas frente al total de tareas asignadas.</p></div>
            <span className="font-display text-2xl font-extrabold text-brand-violet">{cargando ? "..." : monedaPct(resumen.productividad_equipo)}</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-brand-violet to-brand-indigo transition-all" style={{ width: `${progresoEquipo}%` }} /></div>
          <p className="mt-2 text-xs text-slate-500">{Number(resumen.tareas_completadas || 0)} completadas de {Number(resumen.tareas_asignadas || 0)} asignadas al personal activo.</p>
          <div className="mt-5 border-t border-nx-line pt-4">
            <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-nx-900">Carga por persona</h3><span className="text-xs text-slate-400">Capacidad de referencia: {resumen.capacidad_puntos || 8} puntos</span></div>
            <p className="mb-4 text-xs text-slate-500">Cada tarea activa suma 1 punto; una urgente suma 0,5 adicional hasta completarse. Si vence, genera una alerta crítica y conserva su carga sin sumar otro peso.</p>
            {cargando ? <p className="py-8 text-center text-sm text-slate-400">Cargando carga de trabajo...</p> : equipo.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">No hay personal activo para mostrar.</p> : <div className="space-y-4">
              {equipo.map((persona) => <article key={persona.id_usuario}>
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2"><div><span className="text-sm font-semibold text-nx-950">{persona.nombres} {persona.apellidos}</span><span className="ml-2 text-xs text-slate-500">{persona.cargo || persona.area || "Personal"}</span></div>
                  <span className={`text-xs font-bold ${persona.carga_pct >= 100 ? "text-rose-600" : persona.carga_pct >= 88 ? "text-amber-600" : "text-slate-600"}`}>{persona.carga_pct}% · {persona.carga_puntos}/{resumen.capacidad_puntos || 8} puntos · {persona.tareas_urgentes_activas} urgentes</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${persona.carga_pct > 100 ? "bg-rose-500" : persona.carga_pct >= 88 ? "bg-amber-400" : "bg-brand-violet"}`} style={{ width: `${Math.min(persona.carga_pct, 100)}%` }} /></div>
              </article>)}
            </div>}
          </div>
        </section>

        <section className="rounded-2xl border border-nx-line bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-start justify-between gap-2"><div><h2 className="font-display text-base font-bold text-nx-950">Alertas de dirección</h2><p className="mt-1 text-xs text-slate-500">Carga elevada, vencimientos y tareas próximas.</p></div><span className="rounded-full bg-nx-bg px-2.5 py-1 text-xs font-semibold text-slate-600">{alertas.length}</span></div>
          {cargando ? <p className="py-8 text-center text-sm text-slate-400">Revisando alertas...</p> : alertas.length === 0 ? <div className="rounded-xl bg-emerald-50 px-4 py-6 text-center text-sm text-emerald-700">No hay alertas de carga ni vencimientos para el equipo.</div> : <div className="space-y-2.5">
            {alertas.map((alerta, index) => <Link to={alerta.ruta || "/direccion"} key={alerta.id || `${alerta.tipo}-${alerta.id_usuario}-${index}`} className={`block rounded-xl border px-3 py-3 transition hover:shadow-soft ${estadoAlerta[alerta.nivel] || estadoAlerta.informacion}`}>
              <p className="text-[11px] font-bold uppercase tracking-wide opacity-75">{alerta.tipo}</p><p className="mt-1 text-sm font-semibold">{alerta.mensaje}</p>
            </Link>)}
          </div>}
        </section>
      </div>

      <section className="overflow-x-auto rounded-2xl border border-nx-line bg-white shadow-soft">
        <div className="border-b border-nx-line px-4 py-3"><h2 className="font-display text-base font-bold text-nx-950">Resumen del equipo</h2><p className="mt-1 text-xs text-slate-500">La carga incluye el peso de urgencia hasta completar la tarea; el vencimiento genera alerta sin modificar puntos. Productividad = completadas sobre asignadas.</p></div>
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-nx-bg text-xs uppercase text-slate-500"><tr>{["Persona", "Área", "Activas", "Completadas", "Vencidas", "Carga", "Productividad"].map((col) => <th key={col} className="px-4 py-3">{col}</th>)}</tr></thead>
          <tbody className="divide-y divide-nx-line">
            {cargando ? <tr><td colSpan="7" className="py-10 text-center text-slate-400">Cargando equipo...</td></tr> : equipo.length === 0 ? <tr><td colSpan="7" className="py-10 text-center text-slate-400">No hay personal activo.</td></tr> : equipo.map((persona) => <tr key={persona.id_usuario} className="hover:bg-nx-bg/60">
              <td className="px-4 py-3"><span className="block font-semibold">{persona.nombres} {persona.apellidos}</span><span className="text-xs text-slate-500">{persona.cargo || "Sin cargo"}</span></td>
              <td className="px-4 py-3">{persona.area || "Sin area"}</td><td className="px-4 py-3">{persona.tareas_activas}</td><td className="px-4 py-3">{persona.tareas_completadas}</td>
              <td className={`px-4 py-3 font-semibold ${persona.tareas_vencidas ? "text-rose-600" : "text-slate-500"}`}>{persona.tareas_vencidas}</td>
              <td className="px-4 py-3 font-semibold">{persona.carga_pct}% ({persona.carga_puntos}/{resumen.capacidad_puntos || 8})</td><td className="px-4 py-3">{persona.productividad_pct}%</td>
            </tr>)}
          </tbody>
        </table>
      </section>
    </section>
  </DashboardLayout>;
}
