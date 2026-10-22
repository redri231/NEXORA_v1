import { useAuth } from "../context/AuthContext";

function Topbar() {
  const { usuario } = useAuth();

  return (
    <header className="h-16 sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-nx-line flex items-center gap-4 px-6">

      {/* BUSCADOR */}
      <div className="relative flex-1 max-w-md">

        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
          🔎
        </span>

        <input
          type="text"
          placeholder="Buscar clientes, proyectos, cotizaciones…"
          className="
            w-full
            bg-nx-bg
            rounded-xl
            pl-9
            pr-3
            py-2
            text-sm
            border
            border-transparent
            focus:bg-white
            focus:border-nx-line
          "
        />

      </div>

      {/* EMPRESA */}
      <select className="text-sm border border-nx-line rounded-lg px-3 py-2 bg-white">
        <option>NEXORA CREATIVE S.A.C.</option>
        <option>Sede Arequipa</option>
      </select>

      {/* ACCIONES */}
      <div className="flex items-center gap-4 ml-auto text-slate-500">

        <button
          type="button"
          className="relative hover:text-nx-900"
          title="Notificaciones"
        >
          🔔

          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
        </button>

        <button
          type="button"
          className="hover:text-nx-900"
          title="Mensajes"
        >
          ✉️
        </button>

        <div className="w-px h-6 bg-nx-line" />

        <div className="flex items-center gap-2">

          <img
            src="https://i.pravatar.cc/64?img=13"
            alt={usuario ? `${usuario.nombres} ${usuario.apellidos}` : "Usuario"}
            className="w-8 h-8 rounded-full"
          />

          <span className="text-sm font-medium text-nx-900 hidden sm:block">
            {usuario ? `${usuario.nombres} ${usuario.apellidos}` : "Usuario"}
          </span>

        </div>

      </div>

    </header>
  );
}

export default Topbar;
