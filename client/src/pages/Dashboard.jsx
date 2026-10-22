import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../services/api";

function Dashboard() {
  const [resumenCampanias, setResumenCampanias] = useState({ campanias_activas: 0, roi_promedio: 0, rendimiento: [] });
  const [resumenTrabajo, setResumenTrabajo] = useState({ proyectos_activos: 0, tareas_pendientes: 0, tareas_para_hoy: 0, proyectos_atrasados: 0 });

  useEffect(() => {
    api.get("/campanias/resumen")
      .then((response) => setResumenCampanias(response.data || { campanias_activas: 0, roi_promedio: 0, rendimiento: [] }))
      .catch((error) => console.error("No se pudo cargar el rendimiento de campañas:", error));
  }, []);
  useEffect(() => {
    api.get("/proyectos/resumen")
      .then((response) => setResumenTrabajo(response.data || { proyectos_activos: 0, tareas_pendientes: 0, tareas_para_hoy: 0, proyectos_atrasados: 0 }))
      .catch((error) => console.error("No se pudo cargar el resumen de proyectos y tareas:", error));
  }, []);

  return <DashboardLayout>
    <section className="fade-in space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="font-display text-2xl font-bold">Dashboard ejecutivo</h1><p className="text-sm text-slate-500">Resumen general de NEXORA CREATIVE</p></div><button type="button" className="rounded-xl bg-nx-900 text-white text-sm font-semibold px-4 py-2">+ Nuevo registro</button></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Clientes activos", "128"], ["Clientes potenciales", "42"], ["Cotizaciones pendientes", "15"], ["Proyectos activos", String(resumenTrabajo.proyectos_activos)],
          ["Campañas activas", String(resumenCampanias.campanias_activas)], ["Tareas pendientes", String(resumenTrabajo.tareas_pendientes)], ["Ingresos del mes", "S/ 186,400"], ["Gastos del mes", "S/ 74,120"],
        ].map(([label, value]) => <div key={label} className="bg-white rounded-2xl p-4 shadow-soft border border-nx-line transition hover:-translate-y-1 hover:shadow-pop"><p className="text-xs text-slate-500">{label}</p><p className="font-display text-2xl font-extrabold mt-1">{value}</p></div>)}
      </div>
      <section className="bg-white rounded-2xl p-5 shadow-soft border border-nx-line">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4"><div><h2 className="font-display font-bold text-sm">Rendimiento de campañas (ROI)</h2><p className="text-xs text-slate-500 mt-1">Medición más reciente registrada por campaña</p></div><div className="text-right"><p className="text-xs text-slate-500">ROI promedio</p><p className="font-display text-xl font-extrabold">{Number(resumenCampanias.roi_promedio || 0).toFixed(2)}x</p></div></div>
        {resumenCampanias.rendimiento.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">Aún no hay indicadores de campañas.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-nx-bg text-xs text-slate-500"><tr>{["Campaña", "Cliente", "Alcance", "Clics", "Leads", "Conversiones", "ROI"].map((label) => <th key={label} className="text-left px-3 py-2">{label}</th>)}</tr></thead><tbody className="divide-y divide-nx-line">{resumenCampanias.rendimiento.map((item) => <tr key={item.id_campania}><td className="px-3 py-2 font-medium">{item.nombre}</td><td className="px-3 py-2 text-slate-500">{item.cliente}</td><td className="px-3 py-2 text-right">{Number(item.alcance).toLocaleString("es-PE")}</td><td className="px-3 py-2 text-right">{Number(item.clics).toLocaleString("es-PE")}</td><td className="px-3 py-2 text-right">{item.leads}</td><td className="px-3 py-2 text-right">{item.conversiones}</td><td className="px-3 py-2 text-right font-semibold">{item.roi == null ? "—" : `${item.roi}x`}</td></tr>)}</tbody></table></div>}
      </section>
    </section>
  </DashboardLayout>;
}

export default Dashboard;
