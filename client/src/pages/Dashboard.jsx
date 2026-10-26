import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChartNoAxesCombined, CircleDollarSign, FileText, FolderKanban, ListTodo, Megaphone, Package, TrendingDown, UserRoundPlus, UsersRound } from "lucide-react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { puedeVerModulo } from "../utils/permisos";

ChartJS.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip);

const VACIO = { modulos: [], indicadores: {}, graficos: {}, actividad: [] };
const NOMBRE_MODULO = { crm: "CRM", cotizaciones: "Cotizaciones", proyectos: "Proyectos", campanias: "Campañas", tareas: "Tareas", finanzas: "Finanzas", logistica: "Logística", usuarios: "Usuarios" };
const RUTA_MODULO = { crm: "/crm", cotizaciones: "/cotizaciones", proyectos: "/proyectos", campanias: "/campanas", tareas: "/tareas", finanzas: "/finanzas", logistica: "/logistica", usuarios: "/usuarios" };
const moneda = (v) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 }).format(Number(v || 0));
const numero = (v) => Number(v || 0).toLocaleString("es-PE");
const fechaCorta = (value) => value ? new Date(value).toLocaleDateString("es-PE", { day: "2-digit", month: "short" }) : "";
const fechaMes = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("es-PE", { month: "short" }) : "";

const opcionesGrafico = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8, padding: 16 } } } };
const coloresProyectos = ["#7C4DE0", "#4F46E5", "#0EA5E9", "#F59E0B", "#EF4444", "#94A3B8"];

function TarjetaIndicador({ titulo, valor, detalle, ruta, tono = "violet" }) {
  const Icon = titulo.includes("Clientes activos") ? UsersRound
    : titulo.includes("potenciales") ? UserRoundPlus
      : titulo.includes("Cotizaciones") ? FileText
        : titulo.includes("Proyectos") ? FolderKanban
          : titulo.includes("Camp") ? Megaphone
            : titulo.includes("Tareas") ? ListTodo
              : titulo.includes("Ingresos") ? CircleDollarSign
                : titulo.includes("Gastos") ? TrendingDown
                  : titulo.includes("Productos") ? Package : ChartNoAxesCombined;
  const contenido = <><div className="flex items-start justify-between gap-2"><p className="text-xs font-medium text-slate-500">{titulo}</p><span className={`grid h-9 w-9 place-items-center rounded-xl ${tono === "rose" ? "bg-rose-50 text-rose-600" : tono === "amber" ? "bg-amber-50 text-amber-600" : tono === "emerald" ? "bg-emerald-50 text-emerald-600" : "bg-violet-50 text-violet-600"}`}><Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} /></span></div><p className="mt-2 font-display text-2xl font-extrabold text-nx-950">{valor}</p><p className="mt-1 min-h-4 text-xs text-slate-400">{detalle || " "}</p></>;
  return ruta ? <Link to={ruta} className="block rounded-2xl border border-nx-line bg-white p-4 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-pop">{contenido}</Link> : <div className="rounded-2xl border border-nx-line bg-white p-4 shadow-soft">{contenido}</div>;
}

function PanelGrafico({ titulo, subtitulo, children, clase = "" }) {
  return <section className={`animate-fade-up motion-reduce:animate-none rounded-2xl border border-nx-line bg-white p-5 shadow-soft ${clase}`}><div className="mb-4"><h2 className="font-display text-sm font-bold text-nx-950">{titulo}</h2>{subtitulo && <p className="mt-1 text-xs text-slate-400">{subtitulo}</p>}</div><div className="h-64">{children}</div></section>;
}

function Dashboard() {
  const { usuario } = useAuth();
  const [data, setData] = useState(VACIO);
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    api.get("/dashboard/resumen")
      .then((response) => { if (vigente) setData(response.data || VACIO); })
      .catch((e) => { if (vigente) setError(e.message || "No se pudo cargar el Dashboard."); })
      .finally(() => { if (vigente) setCargando(false); });
    api.get("/notificaciones")
      .then((response) => { if (vigente) setAlertas((response.data || []).filter((item) => item.activa)); })
      .catch(() => {});
    return () => { vigente = false; };
  }, [usuario?.id_usuario]);

  const { indicadores, graficos } = data;
  const esGerencia = ["administrador", "gerencia"].includes(String(usuario?.rol || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
  const metricas = useMemo(() => {
    const items = [];
    if (indicadores.clientes) items.push({ titulo: "Clientes activos", valor: numero(indicadores.clientes.clientes_activos), detalle: "Cartera vigente", ruta: "/crm", icono: "♙" });
    if (indicadores.leads) items.push({ titulo: "Clientes potenciales", valor: numero(indicadores.leads.leads_activos), detalle: "Leads activos", ruta: "/crm", icono: "◎", tono: "amber" });
    if (indicadores.cotizaciones) items.push({ titulo: "Cotizaciones pendientes", valor: numero(indicadores.cotizaciones.cotizaciones_pendientes), detalle: `${numero(indicadores.cotizaciones.cotizaciones_por_vencer)} por vencer en 7 días`, ruta: "/cotizaciones", icono: "▤", tono: "amber" });
    if (indicadores.proyectos) items.push({ titulo: "Proyectos activos", valor: numero(indicadores.proyectos.proyectos_activos), detalle: `${numero(indicadores.proyectos.proyectos_atrasados)} atrasados`, ruta: "/proyectos", icono: "▣", tono: indicadores.proyectos.proyectos_atrasados ? "rose" : "violet" });
    if (indicadores.campanias) items.push({ titulo: "Campañas activas", valor: numero(indicadores.campanias.campanias_activas), detalle: `ROI promedio ${Number(indicadores.campanias.roi_promedio || 0).toFixed(2)}x`, ruta: "/campanas", icono: "↗" });
    if (indicadores.tareas) items.push({ titulo: "Tareas pendientes", valor: numero(indicadores.tareas.tareas_pendientes), detalle: `${numero(indicadores.tareas.tareas_para_hoy)} para hoy · ${numero(indicadores.tareas.tareas_vencidas)} vencidas`, ruta: "/tareas", icono: "☷", tono: indicadores.tareas.tareas_vencidas ? "rose" : "violet" });
    if (indicadores.finanzas) {
      items.push({ titulo: "Ingresos del mes", valor: moneda(indicadores.finanzas.ingresos_mes), detalle: "Ingresos cobrados", ruta: "/finanzas", icono: "S/", tono: "emerald" });
      items.push({ titulo: "Gastos del mes", valor: moneda(indicadores.finanzas.gastos_mes), detalle: `Utilidad ${moneda(indicadores.finanzas.utilidad_mes)}`, ruta: "/finanzas", icono: "−", tono: "rose" });
    }
    if (indicadores.inventario && !esGerencia) items.push({ titulo: "Productos activos", valor: numero(indicadores.inventario.productos_activos), detalle: `${numero(indicadores.inventario.stock_bajo)} con stock bajo`, ruta: "/logistica", icono: "▦", tono: indicadores.inventario.stock_bajo ? "amber" : "violet" });
    return items;
  }, [indicadores, esGerencia]);

  const modulosVisibles = Object.keys(RUTA_MODULO).filter((modulo) => puedeVerModulo(usuario, modulo));
  const moduloPrincipal = modulosVisibles.find((modulo) => modulo !== "usuarios") || (esGerencia ? "crm" : null);
  const rutaPrincipal = moduloPrincipal ? RUTA_MODULO[moduloPrincipal] : null;
  const fechaHoy = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

  const chartFinanzas = useMemo(() => ({
    labels: (graficos.ingresos_gastos || []).map((x) => fechaMes(x.mes)),
    datasets: [
      { label: "Ingresos", data: (graficos.ingresos_gastos || []).map((x) => Number(x.ingresos)), borderColor: "#10B981", backgroundColor: "rgba(16,185,129,.12)", fill: true, tension: .35 },
      { label: "Gastos", data: (graficos.ingresos_gastos || []).map((x) => Number(x.gastos)), borderColor: "#F43F5E", backgroundColor: "rgba(244,63,94,.08)", fill: true, tension: .35 },
    ],
  }), [graficos.ingresos_gastos]);
  const chartProyectos = useMemo(() => ({ labels: (graficos.proyectos_estado || []).map((x) => x.estado), datasets: [{ data: (graficos.proyectos_estado || []).map((x) => Number(x.cantidad)), backgroundColor: coloresProyectos, borderWidth: 0 }] }), [graficos.proyectos_estado]);
  const chartClientes = useMemo(() => ({ labels: (graficos.clientes_mes || []).map((x) => fechaMes(x.mes)), datasets: [{ label: "Clientes", data: (graficos.clientes_mes || []).map((x) => Number(x.clientes)), backgroundColor: "#7C4DE0", borderRadius: 6 }] }), [graficos.clientes_mes]);
  const chartCampanias = useMemo(() => ({ labels: (graficos.campanias_roi || []).map((x) => x.nombre), datasets: [{ label: "ROI", data: (graficos.campanias_roi || []).map((x) => Number(x.roi || 0)), backgroundColor: "#6366F1", borderRadius: 6 }] }), [graficos.campanias_roi]);
  const chartTareas = useMemo(() => ({ labels: (graficos.tareas_colaborador || []).map((x) => x.responsable), datasets: [{ label: "Completadas", data: (graficos.tareas_colaborador || []).map((x) => Number(x.completadas)), backgroundColor: "#10B981", borderRadius: 5 }, { label: "Pendientes", data: (graficos.tareas_colaborador || []).map((x) => Number(x.pendientes)), backgroundColor: "#F59E0B", borderRadius: 5 }] }), [graficos.tareas_colaborador]);
  const alertasVisibles = alertas.slice(0, 6);

  return <DashboardLayout>
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-brand-violet">NEXORA CREATIVE</p><h1 className="mt-1 font-display text-2xl font-extrabold text-nx-950">Dashboard ejecutivo</h1><p className="mt-1 text-sm capitalize text-slate-500">Resumen general · {fechaHoy}</p></div>
        {rutaPrincipal && <Link to={rutaPrincipal} className="rounded-xl bg-nx-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-nx-800">Abrir {NOMBRE_MODULO[moduloPrincipal] || "módulo"} →</Link>}
      </header>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {cargando && <div className="rounded-2xl border border-nx-line bg-white p-8 text-center text-sm text-slate-500">Cargando indicadores del sistema…</div>}
      {!cargando && metricas.length > 0 && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{metricas.map((item, index) => <div key={item.titulo} className="animate-fade-up motion-reduce:animate-none" style={{ animationDelay: `${index * 45}ms` }}><TarjetaIndicador {...item} /></div>)}</div>}
      {!cargando && metricas.length === 0 && <div className="rounded-2xl border border-nx-line bg-white p-6 text-sm text-slate-500">No hay indicadores disponibles para los permisos de tu rol.</div>}

      <div className="grid gap-5 lg:grid-cols-3">
        {graficos.ingresos_gastos && <PanelGrafico titulo="Ingresos vs. gastos" subtitulo="Últimos 6 meses" clase="lg:col-span-2"><Line data={chartFinanzas} options={{ ...opcionesGrafico, scales: { y: { beginAtZero: true, ticks: { callback: (v) => `S/ ${Number(v).toLocaleString("es-PE")}` } }, x: { grid: { display: false } } }, plugins: { ...opcionesGrafico.plugins, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${moneda(ctx.raw)}` } } } }} /></PanelGrafico>}
        {graficos.proyectos_estado && <PanelGrafico titulo="Estado de proyectos"><Doughnut data={chartProyectos} options={{ ...opcionesGrafico, maintainAspectRatio: false, cutout: "62%" }} /></PanelGrafico>}
        {graficos.clientes_mes && <PanelGrafico titulo="Clientes captados por mes" subtitulo="Últimos 6 meses"><Bar data={chartClientes} options={{ ...opcionesGrafico, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } }, plugins: { ...opcionesGrafico.plugins, legend: { display: false } } }} /></PanelGrafico>}
        {graficos.campanias_roi && <PanelGrafico titulo="Rendimiento de campañas (ROI)" subtitulo="Último indicador de cada campaña"><Bar data={chartCampanias} options={{ ...opcionesGrafico, indexAxis: "y", scales: { x: { beginAtZero: true, ticks: { callback: (v) => `${v}x` } }, y: { grid: { display: false } } }, plugins: { ...opcionesGrafico.plugins, legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `ROI ${Number(ctx.raw).toFixed(2)}x` } } } }} /></PanelGrafico>}
        {graficos.tareas_colaborador && <PanelGrafico titulo="Tareas por colaborador" subtitulo="Tareas completadas y pendientes"><Bar data={chartTareas} options={{ ...opcionesGrafico, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } } }} /></PanelGrafico>}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-nx-line bg-white p-5 shadow-soft"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-sm font-bold">Actividad reciente</h2><p className="mt-1 text-xs text-slate-400">Registro de actividad del sistema</p></div><span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">{data.actividad.length}</span></div>
          {data.actividad.length ? <ul className="space-y-3">{data.actividad.map((item) => <li key={item.id} className="flex gap-3 text-sm"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-violet" /><div className="min-w-0 flex-1"><p className="text-nx-900">{item.descripcion}</p><p className="mt-1 text-xs text-slate-400">{item.usuario}{item.entidad ? ` · ${item.entidad}` : ""} · {fechaCorta(item.fecha)}</p></div></li>)}</ul> : <p className="py-8 text-center text-sm text-slate-400">La bitácora no registra actividad reciente.</p>}
        </section>
        <section className="rounded-2xl border border-nx-line bg-white p-5 shadow-soft"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-sm font-bold">Alertas</h2><p className="mt-1 text-xs text-slate-400">Notificaciones asignadas según tu rol</p></div><span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">{alertas.length}</span></div>
          {alertasVisibles.length ? <ul className="space-y-2">{alertasVisibles.map((alerta) => <li key={alerta.id}><Link to={alerta.ruta || "/direccion"} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm ${alerta.nivel === "critico" ? "bg-rose-50 text-rose-800" : alerta.nivel === "advertencia" ? "bg-amber-50 text-amber-800" : "bg-slate-50 text-slate-700"}`}><span>{alerta.mensaje || alerta.titulo}</span><span className="shrink-0 text-[10px] font-bold uppercase">{alerta.leida ? "Vista" : "Nueva"}</span></Link></li>)}</ul> : <p className="py-8 text-center text-sm text-slate-400">No tienes alertas activas.</p>}
        </section>
      </div>
    </section>
  </DashboardLayout>;
}

export default Dashboard;
