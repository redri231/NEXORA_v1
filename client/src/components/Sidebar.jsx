import {
  FileText,
  Factory,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Megaphone,
  Package,
  Settings,
  ShoppingCart,
  Target,
  UsersRound,
  Wallet,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAlertasGerenciales } from "../context/AlertasGerencialesContext";
import { puedeVerRuta } from "../utils/permisos";

const menuGroups = [
  {
    title: "General",
    items: [{ path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" }],
  },
  {
    title: "Comercial",
    items: [
      { path: "/crm", icon: UsersRound, label: "Marketing y ventas" },
      { path: "/cotizaciones", icon: FileText, label: "Cotizaciones" },
      { path: "/ventas", icon: ShoppingCart, label: "Ventas" },
      { path: "/campanas", icon: Megaphone, label: "Campañas" },
    ],
  },
  {
    title: "Ejecución",
    items: [
      { path: "/proyectos", icon: FolderKanban, label: "Proyectos" },
      { path: "/tareas", icon: ListTodo, label: "Tareas" },
      { path: "/produccion", icon: Factory, label: "Producción y operaciones" },
      { path: "/logistica", icon: Package, label: "Logística y almacén" },
    ],
  },
  {
    title: "Gestión",
    items: [
      { path: "/finanzas", icon: Wallet, label: "Finanzas" },
      { path: "/pagos", icon: Wallet, label: "Pagos" },
      { path: "/rrhh", icon: UsersRound, label: "Recursos humanos" },
      { path: "/direccion", icon: Target, label: "Dirección" },
      { path: "/reportes", icon: FileText, label: "Reportes" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { path: "/usuarios", icon: UsersRound, label: "Usuarios y roles" },
      { path: "/configuracion", icon: Settings, label: "Configuración" },
    ],
  },
];

function iniciales(usuario) {
  return `${usuario?.nombres?.[0] || "U"}${usuario?.apellidos?.[0] || ""}`.toUpperCase();
}

function Sidebar() {
  const { usuario, cerrarSesion } = useAuth();
  const { cantidadNoLeidas } = useAlertasGerenciales();
  const gruposVisibles = menuGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => puedeVerRuta(usuario, item.path)) }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-nx-950 text-white/80">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-violet to-brand-indigo font-display text-sm font-extrabold text-white shadow-pop">N</div>
        <div>
          <p className="font-display text-sm font-bold leading-none text-white">NEXORA</p>
          <p className="mt-1 text-[10px] tracking-wider text-white/40">CREATIVE S.A.C.</p>
        </div>
      </div>

      <nav aria-label="Navegación principal" className="flex-1 overflow-y-auto py-3 text-sm">
        {gruposVisibles.map((group) => (
          <div key={group.title}>
            <p className="px-5 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">{group.title}</p>
            {group.items.map(({ path, icon: Icon, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => `group/nav mx-2 flex items-center gap-3 rounded-xl border-l-2 px-3 py-2.5 transition-[background-color,color,transform] duration-150 ease-out hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nx-lilac/60 ${isActive ? "border-nx-lilac bg-gradient-to-r from-brand-violet/35 to-transparent text-white" : "border-transparent text-white/65 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0 opacity-85 transition-transform duration-150 group-hover/nav:scale-105" strokeWidth={1.8} />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {path === "/direccion" && cantidadNoLeidas > 0 && <span className="h-2 w-2 shrink-0 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,.55)]" title={`${cantidadNoLeidas} alertas nuevas`} aria-label={`${cantidadNoLeidas} alertas nuevas`} />}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-3 border-t border-white/10 p-4">
        <div aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-violet/90 to-brand-indigo/90 text-xs font-bold text-white ring-2 ring-brand-violet/30">
          {iniciales(usuario)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white">{usuario ? `${usuario.nombres} ${usuario.apellidos}` : "Usuario"}</p>
          <p className="truncate text-[11px] text-white/45">{usuario?.rol || ""}</p>
        </div>
        <button type="button" onClick={cerrarSesion} className="grid h-9 w-9 place-items-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lilac/60" title="Cerrar sesión" aria-label="Cerrar sesión">
          <LogOut aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
