import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { iniciarSesion, usuario, cargandoSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (cargandoSesion) {
    return (
      <div className="min-h-screen grid place-items-center bg-nx-950 text-slate-400">
        Verificando sesión...
      </div>
    );
  }

  if (usuario) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setEnviando(true);

    try {
      await iniciarSesion(username, password);
      navigate(location.state?.from || "/dashboard", {
        replace: true,
      });
    } catch (loginError) {
      setError(loginError.message || "No se pudo iniciar sesión.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      id="view-login"
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-nx-950 p-4 sm:p-6"
    >
      {/* Fondo con efectos de luz */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background:
            "radial-gradient(600px 300px at 15% 20%, #7C4DE0, transparent), radial-gradient(500px 260px at 85% 80%, #3E8FF2, transparent)",
        }}
      />

      {/* Contenedor principal */}
      <div className="relative z-10 w-full max-w-4xl mx-auto grid md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl">
        {/* Panel izquierdo: presentación */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-nx-800 via-nx-700 to-brand-indigo text-white">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center font-display font-extrabold text-lg">
                N
              </div>

              <span className="font-display font-bold tracking-wide">
                NEXORA CREATIVE
              </span>
            </div>

            {/* Texto principal */}
            <h1 className="font-display text-3xl font-extrabold mt-10 leading-tight">
              Una sola plataforma
              <br />
              para toda la agencia.
            </h1>

            <p className="text-white/70 mt-4 text-sm leading-relaxed">
              Ventas, campañas, proyectos, almacén y finanzas — coordinados en
              tiempo real, sin hojas sueltas ni WhatsApp perdido.
            </p>
          </div>

          {/* Indicadores visuales */}
          <div className="space-y-4 text-sm text-white/80 mt-10">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-brand-mint shrink-0" />
              <span>128 clientes activos este trimestre</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-nx-lilac shrink-0" />
              <span>24 campañas en ejecución</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-brand-sky shrink-0" />
              <span>S/ 186,400 en ingresos del mes</span>
            </div>
          </div>
        </div>

        {/* Panel derecho: formulario de inicio de sesión */}
        <div className="bg-white p-6 sm:p-10 flex flex-col justify-center">
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-6 md:hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-brand-violet to-brand-indigo text-white flex items-center justify-center font-display font-extrabold">
                N
              </div>

              <span className="font-display font-bold tracking-wide text-ink">
                NEXORA CREATIVE
              </span>
            </div>

            <h2 className="font-display text-2xl font-bold text-ink">
              Inicia sesión
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Ingresa con tu cuenta corporativa NEXORA.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {/* Usuario */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-600 mb-1"
              >
                Usuario
              </label>

              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Ingresa tu usuario"
                className="mt-1 w-full rounded-xl border border-nx-line px-4 py-3 text-sm bg-nx-bg/60 text-ink outline-none transition focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-600 mb-1"
              >
                Contraseña
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Ingresa tu contraseña"
                className="mt-1 w-full rounded-xl border border-nx-line px-4 py-3 text-sm bg-nx-bg/60 text-ink outline-none transition focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
              />
            </div>

            {/* Recordarme y recuperación de contraseña */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-nx-line accent-violet-600"
                />
                Recordarme
              </label>

              <a
                href="#"
                onClick={(event) => event.preventDefault()}
                className="text-brand-violet font-semibold hover:opacity-80 transition"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Mensaje de error */}
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700"
              >
                {error}
              </p>
            )}

            {/* Botón de inicio de sesión */}
            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-xl bg-gradient-to-r from-brand-violet to-brand-indigo text-white font-semibold py-3 text-sm shadow-pop hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {enviando ? "Ingresando..." : "Ingresar"}
            </button>

            {/* Pie del formulario */}
            <p className="text-center text-xs text-slate-400 pt-2">
              NEXORA · Plataforma de gestión
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;