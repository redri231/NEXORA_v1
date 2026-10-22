import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const menuGroups = [
  {
    title: "General",
    items: [
      {
        path: "/dashboard",
        icon: "📊",
        label: "Dashboard",
      },
    ],
  },

  {
    title: "Comercial",
    items: [
      {
        path: "/crm",
        icon: "🧑‍🤝‍🧑",
        label: "Marketing y Ventas",
      },
      {
        path: "/cotizaciones",
        icon: "🧾",
        label: "Cotizaciones",
      },
      {
        path: "/ventas",
        icon: "🛒",
        label: "Ventas",
      },
      {
        path: "/campanas",
        icon: "📣",
        label: "Campañas",
      },
    ],
  },

  {
    title: "Atención al Cliente",
    items: [
      {
        path: "/reclamos",
        icon: "📮",
        label: "Reclamos",
      },
    ],
  },

  {
    title: "Ejecución",
    items: [
      {
        path: "/proyectos",
        icon: "📁",
        label: "Proyectos",
      },
      {
        path: "/tareas",
        icon: "✅",
        label: "Tareas",
      },
      {
        path: "/produccion",
        icon: "🏭",
        label: "Producción y Operaciones",
      },
      {
        path: "/logistica",
        icon: "📦",
        label: "Logística y Almacén",
      },
    ],
  },

  {
    title: "Gestión",
    items: [
      {
        path: "/finanzas",
        icon: "💰",
        label: "Finanzas",
      },
      {
        path: "/pagos",
        icon: "💳",
        label: "Pagos",
      },
      {
        path: "/rrhh",
        icon: "👥",
        label: "Recursos Humanos",
      },
      {
        path: "/direccion",
        icon: "🎯",
        label: "Dirección / Gerencia",
      },
      {
        path: "/reportes",
        icon: "📈",
        label: "Reportes",
      },
    ],
  },

  {
    title: "Sistema",
    items: [
      {
        path: "/usuarios",
        icon: "🔐",
        label: "Usuarios y Roles",
      },
      {
        path: "/configuracion",
        icon: "⚙️",
        label: "Configuración",
      },
    ],
  },
];

function Sidebar() {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-nx-950 text-white/80 flex flex-col">

      {/* LOGO */}
      <div className="h-16 flex items-center gap-2 px-5 border-b border-white/10">

        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-violet to-brand-indigo flex items-center justify-center font-display font-extrabold text-sm">
          N
        </div>

        <div>
          <p className="font-display font-bold text-white text-sm leading-none">
            NEXORA
          </p>

          <p className="text-[10px] text-white/40 tracking-wider">
            CREATIVE S.A.C.
          </p>
        </div>

      </div>

      {/* MENÚ */}
      <nav className="flex-1 overflow-y-auto py-3 text-sm">

        {menuGroups.map((group) => (
          <div key={group.title}>

            <p className="px-5 pt-4 pb-1 text-[10px] uppercase tracking-wider text-white/30">
              {group.title}
            </p>

            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `
                  flex items-center gap-3 px-5 py-2.5
                  border-l-[3px]
                  transition
                  ${
                    isActive
                      ? "bg-gradient-to-r from-brand-violet/35 to-transparent border-nx-lilac text-white"
                      : "border-transparent hover:bg-white/5"
                  }
                  `
                }
              >
                <span>{item.icon}</span>

                <span>{item.label}</span>
              </NavLink>
            ))}

          </div>
        ))}

      </nav>

      {/* USUARIO */}
      <div className="p-4 border-t border-white/10 flex items-center gap-3">

        <img
          src="https://i.pravatar.cc/64?img=13"
          alt={usuario ? `${usuario.nombres} ${usuario.apellidos}` : "Usuario"}
          className="w-9 h-9 rounded-full ring-2 ring-brand-violet/50"
        />

        <div className="flex-1 min-w-0">

          <p className="text-white text-xs font-semibold truncate">
            {usuario ? `${usuario.nombres} ${usuario.apellidos}` : "Usuario"}
          </p>

          <p className="text-[11px] text-white/40 truncate">
            {usuario?.rol || ""}
          </p>

        </div>

        <button
          type="button"
          onClick={cerrarSesion}
          className="text-white/40 hover:text-white text-sm"
          title="Cerrar sesión"
        >
          ⏻
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;
