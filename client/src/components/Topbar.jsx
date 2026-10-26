import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Bell, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAlertasGerenciales } from "../context/AlertasGerencialesContext";
import { puedeVerRuta } from "../utils/permisos";

const TITULOS = {
  "/dashboard": "Dashboard",
  "/usuarios": "Usuarios y roles",
  "/crm": "Marketing y ventas",
  "/cotizaciones": "Cotizaciones",
  "/ventas": "Ventas",
  "/campanas": "Campañas",
  "/proyectos": "Proyectos",
  "/tareas": "Tareas",
  "/produccion": "Producción y operaciones",
  "/logistica": "Logística y almacén",
  "/finanzas": "Finanzas",
  "/pagos": "Pagos",
  "/rrhh": "Recursos humanos",
  "/direccion": "Dirección",
  "/reportes": "Reportes",
  "/configuracion": "Configuración",
};

function Topbar() {
  const { usuario } = useAuth();
  const location = useLocation();
  const notificacionesRef = useRef(null);
  const puedeVerDireccion = puedeVerRuta(usuario, "/direccion");
  const { alertas, cantidadNoLeidas, cargando, marcarComoVistas } = useAlertasGerenciales();
  const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
  const titulo = TITULOS[location.pathname] || "NEXORA";

  useEffect(() => {
    if (!notificacionesAbiertas) return undefined;

    function cerrarAlHacerClickAfuera(event) {
      if (!notificacionesRef.current?.contains(event.target)) setNotificacionesAbiertas(false);
    }
    function cerrarConEscape(event) {
      if (event.key === "Escape") setNotificacionesAbiertas(false);
    }

    document.addEventListener("pointerdown", cerrarAlHacerClickAfuera);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("pointerdown", cerrarAlHacerClickAfuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [notificacionesAbiertas]);

  function alternarNotificaciones() {
    const abrir = !notificacionesAbiertas;
    setNotificacionesAbiertas(abrir);
    if (abrir) marcarComoVistas(alertas.slice(0, 12));
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-nx-line bg-white/90 px-5 backdrop-blur sm:px-7">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">NEXORA · Espacio de trabajo</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-nx-900">{titulo}</p>
      </div>

      <div className="relative" ref={notificacionesRef}>
        <button
          type="button"
          onClick={alternarNotificaciones}
          className="relative grid h-10 w-10 place-items-center rounded-xl border border-transparent text-slate-500 transition hover:border-nx-line hover:bg-nx-bg hover:text-nx-900 focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
          title="Notificaciones"
          aria-label={cantidadNoLeidas ? `Notificaciones, ${cantidadNoLeidas} sin leer` : "Notificaciones"}
          aria-expanded={notificacionesAbiertas}
          aria-controls="panel-notificaciones"
        >
          <Bell aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />
          {cantidadNoLeidas > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />}
        </button>

        {notificacionesAbiertas && (
          <section id="panel-notificaciones" aria-label="Notificaciones" className="animate-fade-up motion-reduce:animate-none absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-nx-line bg-white text-left text-nx-950 shadow-xl">
            <div className="flex items-center justify-between border-b border-nx-line px-4 py-3">
              <div>
                <h2 className="text-sm font-bold">Notificaciones</h2>
                <p className="mt-0.5 text-xs text-slate-500">{alertas.length} activas{cantidadNoLeidas ? ` · ${cantidadNoLeidas} sin leer` : ""}</p>
              </div>
              <button type="button" onClick={() => setNotificacionesAbiertas(false)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-nx-bg hover:text-nx-900" aria-label="Cerrar notificaciones">
                <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
            <div className="max-h-[min(60vh,28rem)] overflow-y-auto p-2">
              {cargando && alertas.length === 0 ? <p className="px-3 py-8 text-center text-sm text-slate-400">Cargando notificaciones…</p>
                : alertas.length === 0 ? <p className="px-3 py-8 text-center text-sm text-slate-400">No tienes notificaciones activas.</p>
                  : alertas.slice(0, 12).map((alerta) => (
                    <Link key={alerta.id} to={alerta.ruta || "/direccion"} onClick={() => { marcarComoVistas([alerta]); setNotificacionesAbiertas(false); }} className="flex gap-3 rounded-xl px-3 py-2.5 transition hover:bg-nx-bg">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${alerta.nivel === "critico" ? "bg-rose-500" : alerta.nivel === "advertencia" ? "bg-amber-400" : "bg-sky-400"}`} />
                      <span className="min-w-0">
                        <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">{alerta.tipo}</span>
                        <span className="mt-0.5 block text-sm leading-snug text-nx-900">{alerta.mensaje}</span>
                      </span>
                    </Link>
                  ))}
            </div>
            {puedeVerDireccion && <Link to="/direccion" onClick={() => setNotificacionesAbiertas(false)} className="flex items-center justify-center gap-1 border-t border-nx-line px-4 py-3 text-center text-xs font-semibold text-brand-violet transition hover:bg-violet-50">Ver panel de Dirección <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>}
          </section>
        )}
      </div>
    </header>
  );
}

export default Topbar;
