import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../services/api";

const ROL_BADGE = {
  Administrador: "bg-violet-100 text-violet-700",
  Gerencia: "bg-indigo-100 text-indigo-700",
  "Marketing y Ventas": "bg-sky-100 text-sky-700",
  Operaciones: "bg-amber-100 text-amber-700",
  Logística: "bg-teal-100 text-teal-700",
  Finanzas: "bg-rose-100 text-rose-700",
};

const AREAS = [
  "Sistemas",
  "Gerencia",
  "Marketing y Ventas",
  "Operaciones",
  "Logística",
  "Finanzas",
];

const AREA_POR_ROL = {
  Administrador: "Sistemas",
  Gerencia: "Gerencia",
  "Marketing y Ventas": "Marketing y Ventas",
  Operaciones: "Operaciones",
  Logística: "Logística",
  Finanzas: "Finanzas",
};

const CARGOS_SUGERIDOS = [
  "Administrador",
  "Gerente",
  "Coordinador",
  "Analista",
  "Asistente",
  "Ejecutivo de ventas",
  "Operario",
  "Almacenero",
  "Contador",
];

const FORM_INICIAL = {
  nombres: "",
  apellidos: "",
  email: "",
  username: "",
  password: "",
  cargo: "",
  area: "",
  id_rol: "",
  estado: "Activo",
};

function Usuarios() {

  // =========================================================
  // ESTADOS
  // =========================================================

  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);

  const [busqueda, setBusqueda] = useState("");
  const [rolFiltro, setRolFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoFormulario, setModoFormulario] = useState("crear");

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const [formulario, setFormulario] = useState(FORM_INICIAL);

  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");

  const [exportando, setExportando] = useState(false);


  // =========================================================
  // CARGAR DATOS
  // =========================================================

  useEffect(() => {
    cargarDatos();
  }, []);


  async function cargarDatos() {

    try {

      setLoading(true);
      setError("");

      const [
        usuariosResponse,
        rolesResponse
      ] = await Promise.all([
        api.get("/usuarios"),
        api.get("/usuarios/roles"),
      ]);

      setUsuarios(usuariosResponse.data || []);
      setRoles(rolesResponse.data || []);

    } catch (error) {

      console.error("Error cargando usuarios:", error);

      setError(
        error.message ||
        "No se pudieron cargar los usuarios."
      );

    } finally {

      setLoading(false);

    }

  }


  // =========================================================
  // FILTROS
  // =========================================================

  const usuariosFiltrados = useMemo(() => {

    const texto = busqueda.trim().toLowerCase();

    return usuarios.filter((usuario) => {

      const contenido = `
        ${usuario.nombres || ""}
        ${usuario.apellidos || ""}
        ${usuario.email || ""}
        ${usuario.username || ""}
        ${usuario.cargo || ""}
        ${usuario.area || ""}
      `.toLowerCase();

      const coincideBusqueda =
        !texto ||
        contenido.includes(texto);

      const coincideRol =
        !rolFiltro ||
        usuario.rol === rolFiltro;

      const coincideEstado =
        !estadoFiltro ||
        usuario.estado === estadoFiltro;

      return (
        coincideBusqueda &&
        coincideRol &&
        coincideEstado
      );

    });

  }, [
    usuarios,
    busqueda,
    rolFiltro,
    estadoFiltro
  ]);


  // =========================================================
  // ABRIR MODAL CREAR
  // =========================================================

  function abrirNuevoUsuario() {

    setModoFormulario("crear");

    setUsuarioSeleccionado(null);

    setFormulario({
      ...FORM_INICIAL,
      id_rol: roles.length > 0
        ? String(roles[0].id_rol)
        : "",
      area: roles.length > 0
        ? AREA_POR_ROL[roles[0].nombre] || ""
        : "",
    });

    setMensaje("");

    setModalAbierto(true);
  }


  // =========================================================
  // ABRIR MODAL EDITAR
  // =========================================================

  function abrirEditarUsuario(usuario) {

    setModoFormulario("editar");

    setUsuarioSeleccionado(usuario);

    setFormulario({
      nombres: usuario.nombres || "",
      apellidos: usuario.apellidos || "",
      email: usuario.email || "",
      username: usuario.username || "",
      password: "",
      cargo: usuario.cargo || "",
      area: usuario.area || "",
      id_rol: usuario.id_rol
        ? String(usuario.id_rol)
        : "",
      estado: usuario.estado || "Activo",
    });

    setMensaje("");

    setModalAbierto(true);
  }


  // =========================================================
  // CERRAR MODAL
  // =========================================================

  function cerrarModal() {

    if (guardando) {
      return;
    }

    setModalAbierto(false);

    setUsuarioSeleccionado(null);

    setFormulario(FORM_INICIAL);

    setMensaje("");
  }


  // =========================================================
  // CAMBIAR INPUT
  // =========================================================

  function cambiarCampo(event) {

    const {
      name,
      value
    } = event.target;

    setFormulario((actual) => {
      if (name === "id_rol") {
        const rolSeleccionado = roles.find((rol) => String(rol.id_rol) === value);
        return {
          ...actual,
          id_rol: value,
          area: AREA_POR_ROL[rolSeleccionado?.nombre] || actual.area,
        };
      }

      return { ...actual, [name]: value };
    });

  }


  // =========================================================
  // VALIDAR FORMULARIO
  // =========================================================

  function validarFormulario() {

    if (!formulario.nombres.trim()) {
      return "Los nombres son obligatorios.";
    }

    if (!formulario.apellidos.trim()) {
      return "Los apellidos son obligatorios.";
    }

    if (!formulario.email.trim()) {
      return "El email es obligatorio.";
    }

    if (!formulario.username.trim()) {
      return "El username es obligatorio.";
    }

    if (
      modoFormulario === "crear" &&
      !formulario.password.trim()
    ) {
      return "La contraseña es obligatoria para crear un usuario.";
    }

    if (!formulario.id_rol) {
      return "Debes seleccionar un rol.";
    }

    return null;
  }


  // =========================================================
  // GUARDAR USUARIO
  // =========================================================

  async function guardarUsuario(event) {

    event.preventDefault();

    const errorValidacion =
      validarFormulario();

    if (errorValidacion) {

      setMensaje(errorValidacion);

      return;
    }

    try {

      setGuardando(true);
      setMensaje("");

      const datos = {
        nombres: formulario.nombres.trim(),
        apellidos: formulario.apellidos.trim(),
        email: formulario.email.trim(),
        username: formulario.username.trim(),
        cargo: formulario.cargo.trim(),
        area: formulario.area.trim(),
        estado: formulario.estado,
        id_rol: Number(formulario.id_rol),
      };


      // Solo enviamos password cuando:
      // - estamos creando
      // - o estamos editando y el usuario escribió una nueva
      if (
        modoFormulario === "crear" ||
        formulario.password.trim()
      ) {
        datos.password =
          formulario.password.trim();
      }


      if (modoFormulario === "crear") {

        await api.post(
          "/usuarios",
          datos
        );

        setMensaje(
          "Usuario creado correctamente."
        );

      } else {

        await api.put(
          `/usuarios/${usuarioSeleccionado.id_usuario}`,
          datos
        );

        setMensaje(
          "Usuario actualizado correctamente."
        );

      }


      // Recargar desde PostgreSQL
      await cargarDatos();

      // cerrar después de guardar
      setTimeout(() => {

        setModalAbierto(false);

        setUsuarioSeleccionado(null);

        setFormulario(FORM_INICIAL);

        setMensaje("");

      }, 500);

    } catch (error) {

      console.error(
        "Error guardando usuario:",
        error
      );

      setMensaje(
        error.message ||
        "No se pudo guardar el usuario."
      );

    } finally {

      setGuardando(false);

    }

  }


  // =========================================================
  // DESACTIVAR USUARIO
  // =========================================================

  async function eliminarUsuario(usuario) {

    const nombre =
      `${usuario.nombres} ${usuario.apellidos}`;

    const confirmar = window.confirm(
      `¿Deseas desactivar al usuario "${nombre}"?\n\n` +
      `El usuario no será eliminado físicamente de la base de datos.`
    );

    if (!confirmar) {
      return;
    }

    try {

      setError("");

      await api.delete(
        `/usuarios/${usuario.id_usuario}`
      );

      await cargarDatos();

    } catch (error) {

      console.error(
        "Error desactivando usuario:",
        error
      );

      setError(
        error.message ||
        "No se pudo desactivar el usuario."
      );

    }

  }


  // =========================================================
  // EXPORTAR EXCEL
  // =========================================================

  async function exportarExcel() {

    try {

      setExportando(true);
      setError("");

      const fecha = new Date()
        .toISOString()
        .slice(0, 10);

      await api.download(
        "/reportes/usuarios/excel",
        `NEXORA_Reporte_Usuarios_${fecha}.xlsx`
      );

    } catch (error) {

      console.error(
        "Error exportando Excel:",
        error
      );

      setError(
        error.message ||
        "No se pudo exportar el reporte."
      );

    } finally {

      setExportando(false);

    }

  }

  async function exportarPDF() { try { const fecha = new Date().toISOString().slice(0, 10); await api.download("/reportes/usuarios/pdf", `NEXORA_Reporte_Usuarios_${fecha}.pdf`); } catch (error) { setError(error.message || "No se pudo exportar el PDF."); } }


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <DashboardLayout>

      <section className="space-y-5">

        {/* =================================================
            CABECERA
        ================================================= */}

        <div className="flex items-center justify-between flex-wrap gap-3">

          <div>

            <h1 className="font-display text-2xl font-bold text-nx-900">
              Usuarios y Roles
            </h1>

            <p className="text-sm text-slate-500">
              Módulo de Seguridad y Accesos — RF001, RF002, RF003
            </p>

          </div>


          <div className="flex items-center gap-2">

            {/* EXPORTAR */}

            <button
              type="button"
              onClick={exportarExcel}
              disabled={exportando}
              className="
                inline-flex
                items-center
                gap-2
                bg-white
                border
                border-nx-line
                hover:bg-nx-bg
                text-nx-800
                font-semibold
                text-sm
                px-4
                py-2.5
                rounded-xl
                transition
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >

              <span>
                {exportando ? "⏳" : "📊"}
              </span>

              {exportando
                ? "Exportando..."
                : "Exportar Excel"
              }

            </button>

            <button type="button" onClick={exportarPDF} className="rounded-xl border border-nx-line bg-white px-4 py-2.5 text-sm font-semibold">Descargar PDF</button>


            {/* NUEVO USUARIO */}

            <button
              type="button"
              onClick={abrirNuevoUsuario}
              className="
                inline-flex
                items-center
                gap-2
                bg-brand-violet
                hover:opacity-90
                text-white
                font-semibold
                text-sm
                px-4
                py-2.5
                rounded-xl
                shadow-pop
                transition
              "
            >
              + Nuevo usuario
            </button>

          </div>

        </div>


        {/* =================================================
            MENSAJE ERROR
        ================================================= */}

        {error && (

          <div className="
            rounded-xl
            border
            border-rose-200
            bg-rose-50
            px-4
            py-3
            text-sm
            text-rose-700
            flex
            items-center
            justify-between
          ">

            <span>
              <strong>Error:</strong> {error}
            </span>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-rose-500 hover:text-rose-800"
            >
              ✕
            </button>

          </div>

        )}


        {/* =================================================
            FILTROS
        ================================================= */}

        <div className="
          bg-white
          rounded-2xl
          shadow-soft
          border
          border-nx-line
          p-3
          flex
          flex-wrap
          gap-3
          items-center
        ">

          <div className="relative flex-1 min-w-[220px]">

            <span className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-slate-400
            ">
              🔎
            </span>

            <input
              type="text"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              placeholder="Buscar por nombre, email o usuario…"
              className="
                w-full
                border
                border-nx-line
                rounded-lg
                pl-9
                pr-3
                py-2
                text-sm
                outline-none
                focus:border-brand-violet
                focus:ring-2
                focus:ring-brand-violet/10
              "
            />

          </div>


          <select
            value={rolFiltro}
            onChange={(e) =>
              setRolFiltro(e.target.value)
            }
            className="
              border
              border-nx-line
              rounded-lg
              px-3
              py-2
              text-sm
              bg-white
              outline-none
              focus:border-brand-violet
            "
          >

            <option value="">
              Todos los roles
            </option>

            {roles.map((rol) => (

              <option
                key={rol.id_rol}
                value={rol.nombre}
              >
                {rol.nombre}
              </option>

            ))}

          </select>


          <select
            value={estadoFiltro}
            onChange={(e) =>
              setEstadoFiltro(e.target.value)
            }
            className="
              border
              border-nx-line
              rounded-lg
              px-3
              py-2
              text-sm
              bg-white
              outline-none
              focus:border-brand-violet
            "
          >

            <option value="">
              Todos los estados
            </option>

            <option value="Activo">
              Activo
            </option>

            <option value="Inactivo">
              Inactivo
            </option>

          </select>

        </div>


        {/* =================================================
            TABLA
        ================================================= */}

        <div className="
          bg-white
          rounded-2xl
          shadow-soft
          border
          border-nx-line
          overflow-hidden
          overflow-x-auto
        ">

          <table className="w-full text-sm">

            <thead className="
              bg-nx-bg
              text-slate-500
              text-xs
              uppercase
            ">

              <tr>

                <th className="text-left px-4 py-3">
                  Usuario
                </th>

                <th className="text-left px-4 py-3">
                  Cargo
                </th>

                <th className="text-left px-4 py-3">
                  Área
                </th>

                <th className="text-left px-4 py-3">
                  Rol
                </th>

                <th className="text-left px-4 py-3">
                  Estado
                </th>

                <th className="text-right px-4 py-3">
                  Acciones
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-nx-line">

              {loading ? (

                <tr>

                  <td
                    colSpan="6"
                    className="
                      text-center
                      py-12
                      text-slate-400
                    "
                  >
                    <div className="flex flex-col items-center gap-2">

                      <span className="text-2xl">
                        ⏳
                      </span>

                      <span>
                        Cargando usuarios...
                      </span>

                    </div>
                  </td>

                </tr>

              ) : usuariosFiltrados.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="
                      text-center
                      py-12
                      text-slate-400
                    "
                  >

                    <div className="flex flex-col items-center gap-2">

                      <span className="text-2xl">
                        👤
                      </span>

                      <span>
                        No se encontraron usuarios.
                      </span>

                    </div>

                  </td>

                </tr>

              ) : (

                usuariosFiltrados.map((usuario) => {

                  const iniciales =
                    `${usuario.nombres?.[0] || ""}${usuario.apellidos?.[0] || ""}`
                      .toUpperCase();

                  const estadoBadge =
                    usuario.estado === "Activo"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500";

                  return (

                    <tr
                      key={usuario.id_usuario}
                      className="
                        hover:bg-nx-bg/60
                        transition
                      "
                    >

                      {/* USUARIO */}

                      <td className="px-4 py-3">

                        <div className="flex items-center gap-3">

                          <div className="
                            w-9
                            h-9
                            rounded-full
                            bg-nx-lilac/40
                            text-nx-700
                            flex
                            items-center
                            justify-center
                            text-xs
                            font-bold
                          ">
                            {iniciales}
                          </div>

                          <div>

                            <p className="
                              font-medium
                              text-nx-900
                            ">
                              {usuario.nombres}{" "}
                              {usuario.apellidos}
                            </p>

                            <p className="
                              text-xs
                              text-slate-400
                            ">
                              {usuario.email} · @
                              {usuario.username}
                            </p>

                          </div>

                        </div>

                      </td>


                      {/* CARGO */}

                      <td className="px-4 py-3">
                        {usuario.cargo || "—"}
                      </td>


                      {/* AREA */}

                      <td className="px-4 py-3">
                        {usuario.area || "—"}
                      </td>


                      {/* ROL */}

                      <td className="px-4 py-3">

                        <span
                          className={`
                            inline-flex
                            items-center
                            px-2.5
                            py-1
                            rounded-full
                            text-xs
                            font-semibold
                            ${ROL_BADGE[usuario.rol] ||
                              "bg-slate-100 text-slate-600"}
                          `}
                        >
                          {usuario.rol || "Sin rol"}
                        </span>

                      </td>


                      {/* ESTADO */}

                      <td className="px-4 py-3">

                        <span
                          className={`
                            inline-flex
                            items-center
                            px-2.5
                            py-1
                            rounded-full
                            text-xs
                            font-semibold
                            ${estadoBadge}
                          `}
                        >
                          {usuario.estado}
                        </span>

                      </td>


                      {/* ACCIONES */}

                      <td className="
                        px-4
                        py-3
                        text-right
                        whitespace-nowrap
                      ">

                        <button
                          type="button"
                          onClick={() =>
                            abrirEditarUsuario(usuario)
                          }
                          className="
                            text-brand-violet
                            hover:underline
                            text-xs
                            font-semibold
                            mr-4
                          "
                        >
                          Editar
                        </button>


                        {usuario.estado === "Activo" && (

                          <button
                            type="button"
                            onClick={() =>
                              eliminarUsuario(usuario)
                            }
                            className="
                              text-rose-500
                              hover:underline
                              text-xs
                              font-semibold
                            "
                          >
                            Desactivar
                          </button>

                        )}

                      </td>

                    </tr>

                  );

                })

              )}

            </tbody>

          </table>

        </div>


        {/* =================================================
            CONTADOR
        ================================================= */}

        {!loading && (

          <div className="
            text-xs
            text-slate-400
            flex
            justify-between
          ">

            <span>
              Mostrando{" "}
              <strong className="text-slate-600">
                {usuariosFiltrados.length}
              </strong>{" "}
              de{" "}
              <strong className="text-slate-600">
                {usuarios.length}
              </strong>{" "}
              usuarios
            </span>

          </div>

        )}

      </section>


      {/* =====================================================
          MODAL CREAR / EDITAR
      ===================================================== */}

      {modalAbierto && (

        <div className="
          fixed
          inset-0
          z-50
          bg-black/40
          backdrop-blur-sm
          flex
          items-center
          justify-center
          p-4
        ">

          <div className="
            bg-white
            w-full
            max-w-2xl
            rounded-2xl
            shadow-2xl
            overflow-hidden
          ">

            {/* HEADER MODAL */}

            <div className="
              px-6
              py-4
              border-b
              border-nx-line
              flex
              items-center
              justify-between
            ">

              <div>

                <h2 className="
                  font-display
                  font-bold
                  text-lg
                  text-nx-900
                ">
                  {modoFormulario === "crear"
                    ? "Nuevo usuario"
                    : "Editar usuario"}
                </h2>

                <p className="
                  text-xs
                  text-slate-400
                  mt-0.5
                ">
                  {modoFormulario === "crear"
                    ? "Registra un nuevo usuario en NEXORA."
                    : "Actualiza los datos y permisos del usuario."}
                </p>

              </div>


              <button
                type="button"
                onClick={cerrarModal}
                className="
                  w-8
                  h-8
                  rounded-lg
                  hover:bg-nx-bg
                  text-slate-400
                  hover:text-slate-700
                "
              >
                ✕
              </button>

            </div>


            {/* FORMULARIO */}

            <form onSubmit={guardarUsuario}>

              <div className="
                p-6
                grid
                grid-cols-1
                md:grid-cols-2
                gap-4
                max-h-[65vh]
                overflow-y-auto
              ">

                {/* NOMBRES */}

                <div>

                  <label className="
                    block
                    text-xs
                    font-semibold
                    text-slate-600
                    mb-1.5
                  ">
                    Nombres *
                  </label>

                  <input
                    type="text"
                    name="nombres"
                    value={formulario.nombres}
                    onChange={cambiarCampo}
                    className="
                      w-full
                      border
                      border-nx-line
                      rounded-lg
                      px-3
                      py-2.5
                      text-sm
                      outline-none
                      focus:border-brand-violet
                      focus:ring-2
                      focus:ring-brand-violet/10
                    "
                  />

                </div>


                {/* APELLIDOS */}

                <div>

                  <label className="
                    block
                    text-xs
                    font-semibold
                    text-slate-600
                    mb-1.5
                  ">
                    Apellidos *
                  </label>

                  <input
                    type="text"
                    name="apellidos"
                    value={formulario.apellidos}
                    onChange={cambiarCampo}
                    className="
                      w-full
                      border
                      border-nx-line
                      rounded-lg
                      px-3
                      py-2.5
                      text-sm
                      outline-none
                      focus:border-brand-violet
                      focus:ring-2
                      focus:ring-brand-violet/10
                    "
                  />

                </div>


                {/* EMAIL */}

                <div>

                  <label className="
                    block
                    text-xs
                    font-semibold
                    text-slate-600
                    mb-1.5
                  ">
                    Email *
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formulario.email}
                    onChange={cambiarCampo}
                    className="
                      w-full
                      border
                      border-nx-line
                      rounded-lg
                      px-3
                      py-2.5
                      text-sm
                      outline-none
                      focus:border-brand-violet
                      focus:ring-2
                      focus:ring-brand-violet/10
                    "
                  />

                </div>


                {/* USERNAME */}

                <div>

                  <label className="
                    block
                    text-xs
                    font-semibold
                    text-slate-600
                    mb-1.5
                  ">
                    Username *
                  </label>

                  <input
                    type="text"
                    name="username"
                    value={formulario.username}
                    onChange={cambiarCampo}
                    className="
                      w-full
                      border
                      border-nx-line
                      rounded-lg
                      px-3
                      py-2.5
                      text-sm
                      outline-none
                      focus:border-brand-violet
                      focus:ring-2
                      focus:ring-brand-violet/10
                    "
                  />

                </div>


                {/* PASSWORD */}

                <div>

                  <label className="
                    block
                    text-xs
                    font-semibold
                    text-slate-600
                    mb-1.5
                  ">

                    Contraseña{" "}

                    {modoFormulario === "editar" && (

                      <span className="
                        font-normal
                        text-slate-400
                      ">
                        (opcional)
                      </span>

                    )}

                    {modoFormulario === "crear" && " *"}

                  </label>

                  <input
                    type="password"
                    name="password"
                    value={formulario.password}
                    onChange={cambiarCampo}
                    placeholder={
                      modoFormulario === "editar"
                        ? "Dejar vacío para conservar"
                        : "Contraseña"
                    }
                    className="
                      w-full
                      border
                      border-nx-line
                      rounded-lg
                      px-3
                      py-2.5
                      text-sm
                      outline-none
                      focus:border-brand-violet
                      focus:ring-2
                      focus:ring-brand-violet/10
                    "
                  />

                </div>


                {/* CARGO */}

                <div>

                  <label className="
                    block
                    text-xs
                    font-semibold
                    text-slate-600
                    mb-1.5
                  ">
                    Cargo
                  </label>

                  <input
                    type="text"
                    name="cargo"
                    value={formulario.cargo}
                    onChange={cambiarCampo}
                    list="cargos-sugeridos"
                    maxLength={60}
                    placeholder="Escribe o elige una sugerencia"
                    className="
                      w-full
                      border
                      border-nx-line
                      rounded-lg
                      px-3
                      py-2.5
                      text-sm
                      outline-none
                      focus:border-brand-violet
                      focus:ring-2
                      focus:ring-brand-violet/10
                    "
                  />

                  <datalist id="cargos-sugeridos">
                    {CARGOS_SUGERIDOS.map((cargo) => (
                      <option key={cargo} value={cargo} />
                    ))}
                  </datalist>

                </div>


                {/* AREA */}

                <div>

                  <label className="
                    block
                    text-xs
                    font-semibold
                    text-slate-600
                    mb-1.5
                  ">
                    Área
                  </label>

                  <select
                    name="area"
                    value={formulario.area}
                    onChange={cambiarCampo}
                    className="
                      w-full
                      border
                      border-nx-line
                      rounded-lg
                      px-3
                      py-2.5
                      text-sm
                      outline-none
                      focus:border-brand-violet
                      focus:ring-2
                      focus:ring-brand-violet/10
                    "
                  >
                    <option value="">Seleccionar área</option>
                    {formulario.area && !AREAS.includes(formulario.area) && (
                      <option value={formulario.area}>{formulario.area} (actual)</option>
                    )}
                    {AREAS.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>

                </div>


                {/* ROL */}

                <div>

                  <label className="
                    block
                    text-xs
                    font-semibold
                    text-slate-600
                    mb-1.5
                  ">
                    Rol *
                  </label>

                  <select
                    name="id_rol"
                    value={formulario.id_rol}
                    onChange={cambiarCampo}
                    className="
                      w-full
                      border
                      border-nx-line
                      rounded-lg
                      px-3
                      py-2.5
                      text-sm
                      bg-white
                      outline-none
                      focus:border-brand-violet
                      focus:ring-2
                      focus:ring-brand-violet/10
                    "
                  >

                    <option value="">
                      Seleccionar rol
                    </option>

                    {roles.map((rol) => (

                      <option
                        key={rol.id_rol}
                        value={rol.id_rol}
                      >
                        {rol.nombre}
                      </option>

                    ))}

                  </select>

                </div>


                {/* ESTADO */}

                <div>

                  <label className="
                    block
                    text-xs
                    font-semibold
                    text-slate-600
                    mb-1.5
                  ">
                    Estado
                  </label>

                  <select
                    name="estado"
                    value={formulario.estado}
                    onChange={cambiarCampo}
                    className="
                      w-full
                      border
                      border-nx-line
                      rounded-lg
                      px-3
                      py-2.5
                      text-sm
                      bg-white
                      outline-none
                      focus:border-brand-violet
                      focus:ring-2
                      focus:ring-brand-violet/10
                    "
                  >

                    <option value="Activo">
                      Activo
                    </option>

                    <option value="Inactivo">
                      Inactivo
                    </option>

                  </select>

                </div>

              </div>


              {/* MENSAJE FORM */}

              {mensaje && (

                <div className={`
                  mx-6
                  mb-4
                  rounded-lg
                  px-3
                  py-2.5
                  text-sm
                  ${
                    mensaje.includes("correctamente")
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }
                `}>
                  {mensaje}
                </div>

              )}


              {/* FOOTER */}

              <div className="
                px-6
                py-4
                bg-nx-bg
                border-t
                border-nx-line
                flex
                justify-end
                gap-2
              ">

                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="
                    px-4
                    py-2.5
                    rounded-lg
                    border
                    border-nx-line
                    bg-white
                    text-sm
                    font-semibold
                    text-slate-600
                    hover:bg-slate-50
                    disabled:opacity-50
                  "
                >
                  Cancelar
                </button>


                <button
                  type="submit"
                  disabled={guardando}
                  className="
                    px-5
                    py-2.5
                    rounded-lg
                    bg-brand-violet
                    text-white
                    text-sm
                    font-semibold
                    hover:opacity-90
                    shadow-pop
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >

                  {guardando
                    ? "Guardando..."
                    : modoFormulario === "crear"
                      ? "Crear usuario"
                      : "Guardar cambios"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </DashboardLayout>
  );
}

export default Usuarios;
