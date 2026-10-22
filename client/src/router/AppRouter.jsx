import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Usuarios from "../pages/Usuarios";
import CRM from "../pages/CRM";
import Cotizaciones from "../pages/Cotizaciones";
import Ventas from "../pages/Ventas";
import Campanias from "../pages/Campanias";
import Proyectos from "../pages/Proyectos";
import Tareas from "../pages/Tareas";
import Produccion from "../pages/Produccion";
import Logistica from "../pages/Logistica";
import { AuthProvider, useAuth } from "../context/AuthContext";

function RutaProtegida({ children }) {
  const { usuario, cargandoSesion } = useAuth();
  const location = useLocation();

  if (cargandoSesion) {
    return <div className="min-h-screen grid place-items-center text-slate-500">Verificando sesión...</div>;
  }
  if (!usuario) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function RutasAplicacion() {
  const { usuario, cargandoSesion } = useAuth();
  if (cargandoSesion) {
    return <div className="min-h-screen grid place-items-center text-slate-500">Verificando sesión...</div>;
  }

  return (
    <>
      <Routes>

        <Route
          path="/"
          element={<Navigate to={usuario ? "/dashboard" : "/login"} replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={<RutaProtegida><Dashboard /></RutaProtegida>}
        />

        <Route
          path="/usuarios"
          element={<RutaProtegida><Usuarios /></RutaProtegida>}
        />

        <Route
          path="/crm"
          element={<RutaProtegida><CRM /></RutaProtegida>}
        />

        <Route
          path="/cotizaciones"
          element={<RutaProtegida><Cotizaciones /></RutaProtegida>}
        />

        <Route
          path="/ventas"
          element={<RutaProtegida><Ventas /></RutaProtegida>}
        />

        <Route
          path="/campanas"
          element={<RutaProtegida><Campanias /></RutaProtegida>}
        />

        <Route
          path="/proyectos"
          element={<RutaProtegida><Proyectos /></RutaProtegida>}
        />

        <Route
          path="/tareas"
          element={<RutaProtegida><Tareas /></RutaProtegida>}
        />

        <Route
          path="/produccion"
          element={<RutaProtegida><Produccion /></RutaProtegida>}
        />

        <Route
          path="/logistica"
          element={<RutaProtegida><Logistica /></RutaProtegida>}
        />

        <Route
          path="*"
          element={<Navigate to={usuario ? "/dashboard" : "/login"} replace />}
        />

      </Routes>

    </>
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RutasAplicacion />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRouter;
