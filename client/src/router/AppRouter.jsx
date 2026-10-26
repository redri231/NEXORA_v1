import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Login from "../pages/Login";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { puedeVerRuta } from "../utils/permisos";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const Usuarios = lazy(() => import("../pages/Usuarios"));
const CRM = lazy(() => import("../pages/CRM"));
const Cotizaciones = lazy(() => import("../pages/Cotizaciones"));
const Ventas = lazy(() => import("../pages/Ventas"));
const Campanias = lazy(() => import("../pages/Campanias"));
const Proyectos = lazy(() => import("../pages/Proyectos"));
const Tareas = lazy(() => import("../pages/Tareas"));
const Produccion = lazy(() => import("../pages/Produccion"));
const Logistica = lazy(() => import("../pages/Logistica"));
const Finanzas = lazy(() => import("../pages/Finanzas"));
const Pagos = lazy(() => import("../pages/Pagos"));
const RecursosHumanos = lazy(() => import("../pages/RecursosHumanos"));
const Direccion = lazy(() => import("../pages/Direccion"));
const Reportes = lazy(() => import("../pages/Reportes"));
const Configuracion = lazy(() => import("../pages/Configuracion"));

function rutaInicial(usuario) {
  const rol = String(usuario?.rol || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (rol === "marketing y ventas") return "/crm";
  if (rol === "operaciones") return "/proyectos";
  if (rol === "logistica") return "/logistica";
  if (rol === "finanzas") return "/finanzas";
  return "/dashboard";
}

function RutaProtegida({ children }) {
  const { usuario, cargandoSesion } = useAuth();
  const location = useLocation();

  if (cargandoSesion) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Verificando sesión…</div>;
  if (!usuario) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!puedeVerRuta(usuario, location.pathname)) return <Navigate to={rutaInicial(usuario)} replace />;
  return children;
}

function PaginaProtegida({ componente: Pagina }) {
  return (
    <Suspense fallback={<div className="grid min-h-48 place-items-center text-sm text-slate-500"><span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-violet/25 border-t-brand-violet motion-reduce:animate-none" />Cargando módulo…</span></div>}>
      <RutaProtegida><Pagina /></RutaProtegida>
    </Suspense>
  );
}

function RutasAplicacion() {
  const { usuario, cargandoSesion } = useAuth();
  if (cargandoSesion) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Verificando sesión…</div>;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={usuario ? "/dashboard" : "/login"} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<PaginaProtegida componente={Dashboard} />} />
      <Route path="/usuarios" element={<PaginaProtegida componente={Usuarios} />} />
      <Route path="/crm" element={<PaginaProtegida componente={CRM} />} />
      <Route path="/cotizaciones" element={<PaginaProtegida componente={Cotizaciones} />} />
      <Route path="/ventas" element={<PaginaProtegida componente={Ventas} />} />
      <Route path="/campanas" element={<PaginaProtegida componente={Campanias} />} />
      <Route path="/proyectos" element={<PaginaProtegida componente={Proyectos} />} />
      <Route path="/tareas" element={<PaginaProtegida componente={Tareas} />} />
      <Route path="/produccion" element={<PaginaProtegida componente={Produccion} />} />
      <Route path="/logistica" element={<PaginaProtegida componente={Logistica} />} />
      <Route path="/finanzas" element={<PaginaProtegida componente={Finanzas} />} />
      <Route path="/pagos" element={<PaginaProtegida componente={Pagos} />} />
      <Route path="/rrhh" element={<PaginaProtegida componente={RecursosHumanos} />} />
      <Route path="/direccion" element={<PaginaProtegida componente={Direccion} />} />
      <Route path="/reportes" element={<PaginaProtegida componente={Reportes} />} />
      <Route path="/configuracion" element={<PaginaProtegida componente={Configuracion} />} />
      <Route path="*" element={<Navigate to={usuario ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

function AppRouter() {
  return <BrowserRouter><AuthProvider><RutasAplicacion /></AuthProvider></BrowserRouter>;
}

export default AppRouter;
