import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../services/api";


// ============================================================
// BADGES
// ============================================================

const ESTADO_BADGE = {
  Activo: "bg-emerald-100 text-emerald-700",
  Inactivo: "bg-slate-100 text-slate-500",
};


// ============================================================
// FORMULARIO INICIAL
// ============================================================

const FORM_INICIAL = {
  tipo_cliente: "Empresa",
  razon_social_nombres: "",
  num_documento: "",
  email: "",
  telefono: "",
  direccion: "",
  estado: "Activo",
  id_usuario: "",
};

const FORM_LEAD_INICIAL = {
  nombre: "",
  contacto: "",
  cargo_contacto: "",
  email: "",
  telefono: "",
  fuente: "",
  estado: "Activo",
};


// ============================================================
// PIPELINE
// ============================================================

const ETAPAS_PIPELINE = [
  "Nuevo lead",
  "Contactado",
  "Reunión",
  "Propuesta enviada",
  "Negociación",
  "Ganado",
  "Perdido",
];


// ============================================================
// COMPONENTE
// ============================================================

function CRM() {

  // ==========================================================
  // DATOS
  // ==========================================================

  const [clientes, setClientes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [busquedaLeads, setBusquedaLeads] = useState("");
  const [estadoFiltroLead, setEstadoFiltroLead] = useState("");
  const [cargandoLeads, setCargandoLeads] = useState(true);
  const [errorLeads, setErrorLeads] = useState("");
  const [mostrarModalLead, setMostrarModalLead] = useState(false);
  const [formLead, setFormLead] = useState(FORM_LEAD_INICIAL);
  const [leadSeleccionado, setLeadSeleccionado] = useState(null);
  const [guardandoLead, setGuardandoLead] = useState(false);
  const [mensajeLead, setMensajeLead] = useState("");
  const [exportandoLeads, setExportandoLeads] = useState(false);
  const [mostrarModalConversion, setMostrarModalConversion] = useState(false);
  const [leadAConvertir, setLeadAConvertir] = useState(null);
  const [formConversion, setFormConversion] = useState({
    tipo_cliente: "Empresa",
    num_documento: "",
    direccion: "",
    id_usuario: "",
  });
  const [guardandoConversion, setGuardandoConversion] = useState(false);


  // ==========================================================
  // OPORTUNIDADES
  // ==========================================================

  const [mostrarModalOportunidad, setMostrarModalOportunidad] =
    useState(false);

  const [origenOportunidad, setOrigenOportunidad] =
    useState("cliente");

  const [formOportunidad, setFormOportunidad] = useState({
    id_cliente: "",
    id_lead: "",
    valor_estimado: "",
    notas: "",
    id_usuario: "",
    id_servicio: "",
  });

  const [guardandoOportunidad, setGuardandoOportunidad] =
    useState(false);

  const [errorFormularioOportunidad, setErrorFormularioOportunidad] =
    useState("");

  const [cargandoOportunidades, setCargandoOportunidades] =
    useState(false);

  const [errorOportunidades, setErrorOportunidades] =
    useState("");

  const [oportunidadArrastrada, setOportunidadArrastrada] =
    useState(null);

  const [actualizandoEtapa, setActualizandoEtapa] =
    useState(null);


  // ==========================================================
  // UI
  // ==========================================================

  const [pestana, setPestana] =
    useState("clientes");

  const [busqueda, setBusqueda] =
    useState("");

  const [tipoFiltro, setTipoFiltro] =
    useState("");

  const [estadoFiltro, setEstadoFiltro] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================================
  // MODAL CLIENTE
  // ==========================================================

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [modoFormulario, setModoFormulario] =
    useState("crear");

  const [clienteSeleccionado, setClienteSeleccionado] =
    useState(null);

  const [formulario, setFormulario] =
    useState(FORM_INICIAL);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");


  // ==========================================================
  // DETALLE
  // ==========================================================

  const [detalleAbierto, setDetalleAbierto] =
    useState(false);

  const [clienteDetalle, setClienteDetalle] =
    useState(null);


  // ==========================================================
  // EXCEL
  // ==========================================================

  const [exportando, setExportando] =
    useState(false);


  // ==========================================================
  // CARGAR DATOS
  // ==========================================================

  useEffect(() => {
    cargarDatos();
    cargarOportunidades();
    cargarDatosOportunidad();
  }, []);


  async function cargarDatos() {

    try {

      setLoading(true);
      setError("");

      const [
        clientesResponse,
        responsablesResponse
      ] = await Promise.all([

        api.get("/crm/clientes"),

        api.get("/crm/responsables"),

      ]);

      setClientes(
        clientesResponse.data || []
      );

      setResponsables(
        responsablesResponse.data || []
      );

    } catch (error) {

      console.error(
        "Error cargando CRM:",
        error
      );

      setError(
        error.message ||
        "No se pudieron cargar los datos del CRM."
      );

    } finally {

      setLoading(false);

    }

  }


  async function cargarDatosOportunidad() {

    try {

      setCargandoLeads(true);
      setErrorLeads("");

      const [
        clientesResponse,
        leadsResponse,
        responsablesResponse,
      ] = await Promise.all([

        api.get("/crm/clientes"),

        api.get("/crm/leads"),

        api.get("/crm/responsables"),

      ]);

      setClientes(
        clientesResponse.data || []
      );

      setLeads(
        leadsResponse.data || []
      );

      setResponsables(
        responsablesResponse.data || []
      );

    } catch (error) {

      console.error(
        "Error cargando datos de oportunidad:",
        error
      );

      setErrorFormularioOportunidad(
        error.message ||
        "No se pudieron cargar los datos para crear la oportunidad."
      );

      setErrorLeads(error.message || "No se pudieron cargar los leads.");

    } finally {

      setCargandoLeads(false);

    }

  }


  async function cargarOportunidades() {

    try {

      setCargandoOportunidades(true);

      setErrorOportunidades("");

      const response =
        await api.get("/crm/oportunidades");

      setOportunidades(
        response.data || []
      );

    } catch (error) {

      console.error(
        "Error cargando oportunidades:",
        error
      );

      setErrorOportunidades(
        error.message ||
        "No se pudieron cargar las oportunidades."
      );

    } finally {

      setCargandoOportunidades(false);

    }

  }


  // ==========================================================
  // FILTROS
  // ==========================================================

  const clientesFiltrados = useMemo(() => {

    const texto =
      busqueda.trim().toLowerCase();

    return clientes.filter((cliente) => {

      const contenido = `
        ${cliente.razon_social_nombres || ""}
        ${cliente.num_documento || ""}
        ${cliente.email || ""}
        ${cliente.telefono || ""}
        ${cliente.direccion || ""}
        ${cliente.responsable || ""}
      `.toLowerCase();

      const coincideBusqueda =
        !texto ||
        contenido.includes(texto);

      const coincideTipo =
        !tipoFiltro ||
        cliente.tipo_cliente === tipoFiltro;

      const coincideEstado =
        !estadoFiltro ||
        cliente.estado === estadoFiltro;

      return (
        coincideBusqueda &&
        coincideTipo &&
        coincideEstado
      );

    });

  }, [
    clientes,
    busqueda,
    tipoFiltro,
    estadoFiltro
  ]);

  const leadsFiltrados = useMemo(() => {
    const texto = busquedaLeads.trim().toLowerCase();

    return leads.filter((lead) => {
      const contenido = `${lead.nombre || ""} ${lead.contacto || ""} ${lead.cargo_contacto || ""} ${lead.email || ""} ${lead.telefono || ""} ${lead.fuente || ""}`.toLowerCase();
      return (!texto || contenido.includes(texto)) &&
        (!estadoFiltroLead || lead.estado === estadoFiltroLead);
    });
  }, [leads, busquedaLeads, estadoFiltroLead]);


  // ==========================================================
  // NUEVO CLIENTE
  // ==========================================================

  function abrirNuevoCliente() {

    setModoFormulario("crear");

    setClienteSeleccionado(null);

    setFormulario({
      ...FORM_INICIAL,
      id_usuario:
        responsables.length > 0
          ? String(responsables[0].id_usuario)
          : "",
    });

    setMensaje("");

    setModalAbierto(true);
  }


  // ==========================================================
  // EDITAR CLIENTE
  // ==========================================================

  function abrirEditarCliente(cliente) {

    setModoFormulario("editar");

    setClienteSeleccionado(cliente);

    setFormulario({

      tipo_cliente:
        cliente.tipo_cliente || "Empresa",

      razon_social_nombres:
        cliente.razon_social_nombres || "",

      num_documento:
        cliente.num_documento || "",

      email:
        cliente.email || "",

      telefono:
        cliente.telefono || "",

      direccion:
        cliente.direccion || "",

      estado:
        cliente.estado || "Activo",

      id_usuario:
        cliente.id_usuario
          ? String(cliente.id_usuario)
          : "",

    });

    setMensaje("");

    setModalAbierto(true);
  }


  // ==========================================================
  // CREAR OPORTUNIDAD
  // ==========================================================

  async function crearNuevaOportunidad(event) {

    event.preventDefault();

    try {

      setGuardandoOportunidad(true);

      setErrorFormularioOportunidad("");

      if (
        origenOportunidad === "cliente" &&
        !formOportunidad.id_cliente
      ) {

        setErrorFormularioOportunidad(
          "Debes seleccionar un cliente."
        );

        return;
      }

      if (
        origenOportunidad === "lead" &&
        !formOportunidad.id_lead
      ) {

        setErrorFormularioOportunidad(
          "Debes seleccionar un lead."
        );

        return;
      }

      if (!formOportunidad.id_usuario) {

        setErrorFormularioOportunidad(
          "Debes seleccionar un responsable."
        );

        return;
      }

      const datos = {

        valor_estimado:
          Number(formOportunidad.valor_estimado) || 0,

        etapa:
          "Nuevo lead",

        notas:
          formOportunidad.notas.trim() || null,

        id_cliente:
          origenOportunidad === "cliente"
            ? Number(formOportunidad.id_cliente)
            : null,

        id_lead:
          origenOportunidad === "lead"
            ? Number(formOportunidad.id_lead)
            : null,

        id_usuario:
          Number(formOportunidad.id_usuario),

        id_servicio:
          formOportunidad.id_servicio
            ? Number(formOportunidad.id_servicio)
            : null,

      };

      await api.post(
        "/crm/oportunidades",
        datos
      );

      await cargarOportunidades();

      setMostrarModalOportunidad(false);

      setFormOportunidad({
        id_cliente: "",
        id_lead: "",
        valor_estimado: "",
        notas: "",
        id_usuario: "",
        id_servicio: "",
      });

    } catch (error) {

      console.error(
        "Error creando oportunidad:",
        error
      );

      setErrorFormularioOportunidad(
        error.message ||
        "No se pudo crear la oportunidad."
      );

    } finally {

      setGuardandoOportunidad(false);

    }

  }


  // ==========================================================
  // MODAL OPORTUNIDAD
  // ==========================================================

  function abrirModalNuevaOportunidad() {

    setOrigenOportunidad("cliente");

    setFormOportunidad({
      id_cliente: "",
      id_lead: "",
      valor_estimado: "",
      notas: "",
      id_usuario: "",
      id_servicio: "",
    });

    setErrorFormularioOportunidad("");

    setMostrarModalOportunidad(true);
  }


  // ==========================================================
  // CERRAR MODAL
  // ==========================================================

  function cerrarModal() {

    if (guardando) {
      return;
    }

    setModalAbierto(false);

    setClienteSeleccionado(null);

    setFormulario(FORM_INICIAL);

    setMensaje("");
  }


  function cerrarModalOportunidad() {

    if (guardandoOportunidad) {
      return;
    }

    setMostrarModalOportunidad(false);

    setErrorFormularioOportunidad("");
  }


  // ==========================================================
  // CAMBIAR CAMPO
  // ==========================================================

  function cambiarCampo(event) {

    const {
      name,
      value
    } = event.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));

  }


  function handleOportunidadChange(event) {

    const {
      name,
      value
    } = event.target;

    setFormOportunidad((actual) => ({
      ...actual,
      [name]: value,
    }));

  }


  // ==========================================================
  // CAMBIO DE ESTADO DE LEAD / CLIENTE
  // ==========================================================

  function cambiarOrigenOportunidad(origen) {

    setOrigenOportunidad(origen);

    setFormOportunidad((actual) => ({
      ...actual,
      id_cliente:
        origen === "cliente"
          ? actual.id_cliente
          : "",
      id_lead:
        origen === "lead"
          ? actual.id_lead
          : "",
    }));

  }


  // ==========================================================
  // VALIDACIÓN
  // ==========================================================

  function validarFormulario() {

    if (
      !formulario.razon_social_nombres.trim()
    ) {

      return "El nombre o razón social es obligatorio.";

    }

    if (
      !formulario.num_documento.trim()
    ) {

      return "El número de documento es obligatorio.";

    }

    if (
      !formulario.email.trim()
    ) {

      return "El email es obligatorio.";

    }

    if (
      !formulario.telefono.trim()
    ) {

      return "El teléfono es obligatorio.";

    }

    if (!formulario.id_usuario) {

      return "Debes seleccionar un responsable.";

    }

    return null;
  }


  // ==========================================================
  // DRAG Y DROP
  // ==========================================================

  function handleDragStart(event, oportunidad) {

    setOportunidadArrastrada(oportunidad);

    event.dataTransfer.effectAllowed = "move";

    event.dataTransfer.setData(
      "text/plain",
      String(oportunidad.id_oportunidad)
    );

  }


  function handleDragEnd() {

    setOportunidadArrastrada(null);

  }


  async function handleDrop(event, nuevaEtapa) {

    event.preventDefault();

    const idOportunidad = Number(
      event.dataTransfer.getData("text/plain")
    );

    if (!idOportunidad) {

      setOportunidadArrastrada(null);

      return;
    }

    const oportunidad = oportunidades.find(
      (item) =>
        Number(item.id_oportunidad) ===
        idOportunidad
    );

    if (!oportunidad) {

      setOportunidadArrastrada(null);

      return;
    }

    if (
      oportunidad.etapa === nuevaEtapa
    ) {

      setOportunidadArrastrada(null);

      return;
    }

    const etapaAnterior =
      oportunidad.etapa;

    try {

      setActualizandoEtapa(
        idOportunidad
      );

      setErrorOportunidades("");

      setOportunidades((actuales) =>
        actuales.map((item) =>
          Number(item.id_oportunidad) ===
          idOportunidad
            ? {
                ...item,
                etapa: nuevaEtapa
              }
            : item
        )
      );

      await api.patch(
        `/crm/oportunidades/${idOportunidad}/etapa`,
        {
          etapa: nuevaEtapa,
        }
      );

    } catch (error) {

      console.error(
        "Error cambiando etapa:",
        error
      );

      setOportunidades((actuales) =>
        actuales.map((item) =>
          Number(item.id_oportunidad) ===
          idOportunidad
            ? {
                ...item,
                etapa: etapaAnterior
              }
            : item
        )
      );

      setErrorOportunidades(
        error.message ||
        "No se pudo cambiar la etapa."
      );

    } finally {

      setActualizandoEtapa(null);

      setOportunidadArrastrada(null);

    }

  }


  // ==========================================================
  // GUARDAR CLIENTE
  // ==========================================================

  async function guardarCliente(event) {

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

        tipo_cliente:
          formulario.tipo_cliente,

        razon_social_nombres:
          formulario.razon_social_nombres.trim(),

        num_documento:
          formulario.num_documento.trim(),

        email:
          formulario.email.trim(),

        telefono:
          formulario.telefono.trim(),

        direccion:
          formulario.direccion.trim(),

        estado:
          formulario.estado,

        id_usuario:
          Number(formulario.id_usuario),

      };

      if (
        modoFormulario === "crear"
      ) {

        await api.post(
          "/crm/clientes",
          datos
        );

        setMensaje(
          "Cliente creado correctamente."
        );

      } else {

        await api.put(
          `/crm/clientes/${clienteSeleccionado.id_cliente}`,
          datos
        );

        setMensaje(
          "Cliente actualizado correctamente."
        );

      }

      await cargarDatos();

      setTimeout(() => {

        setModalAbierto(false);

        setClienteSeleccionado(null);

        setFormulario(FORM_INICIAL);

        setMensaje("");

      }, 500);

    } catch (error) {

      console.error(
        "Error guardando cliente:",
        error
      );

      setMensaje(
        error.message ||
        "No se pudo guardar el cliente."
      );

    } finally {

      setGuardando(false);

    }

  }


  // ==========================================================
  // DESACTIVAR CLIENTE
  // ==========================================================

  async function desactivarCliente(cliente) {

    const confirmar = window.confirm(
      `¿Deseas desactivar a "${cliente.razon_social_nombres}"?`
    );

    if (!confirmar) {
      return;
    }

    try {

      setError("");

      await api.delete(
        `/crm/clientes/${cliente.id_cliente}`
      );

      await cargarDatos();

    } catch (error) {

      console.error(
        "Error desactivando cliente:",
        error
      );

      setError(
        error.message ||
        "No se pudo desactivar el cliente."
      );

    }

  }


  // ==========================================================
  // VER DETALLE
  // ==========================================================

  async function verDetalle(cliente) {

    try {

      setError("");

      const response =
        await api.get(
          `/crm/clientes/${cliente.id_cliente}`
        );

      setClienteDetalle(
        response.data
      );

      setDetalleAbierto(true);

    } catch (error) {

      console.error(
        "Error obteniendo detalle:",
        error
      );

      setError(
        error.message ||
        "No se pudo obtener el detalle."
      );

    }

  }


  // ==========================================================
  // EXPORTAR EXCEL
  // ==========================================================

  async function exportarExcel() {

    try {

      setExportando(true);

      setError("");

      const fecha =
        new Date()
          .toISOString()
          .slice(0, 10);

      await api.download(

        "/reportes/clientes/excel",

        `NEXORA_Reporte_Clientes_${fecha}.xlsx`

      );

    } catch (error) {

      console.error(
        "Error exportando clientes:",
        error
      );

      setError(
        error.message ||
        "No se pudo exportar el reporte de clientes."
      );

    } finally {

      setExportando(false);

    }

  }


  function abrirNuevoLead() {
    setLeadSeleccionado(null);
    setFormLead(FORM_LEAD_INICIAL);
    setMensajeLead("");
    setMostrarModalLead(true);
  }

  function abrirEditarLead(lead) {
    setLeadSeleccionado(lead);
    setFormLead({
      nombre: lead.nombre || "",
      contacto: lead.contacto || "",
      cargo_contacto: lead.cargo_contacto || "",
      email: lead.email || "",
      telefono: lead.telefono || "",
      fuente: lead.fuente || "",
      estado: lead.estado === "Descartado" ? "Descartado" : "Activo",
    });
    setMensajeLead("");
    setMostrarModalLead(true);
  }


  function cambiarCampoLead(event) {
    const { name, value } = event.target;
    setFormLead((actual) => ({ ...actual, [name]: value }));
  }


  async function guardarLead(event) {
    event.preventDefault();
    setGuardandoLead(true);
    setMensajeLead("");

    try {
      const datos = {
        nombre: formLead.nombre.trim(),
        contacto: formLead.contacto.trim(),
        cargo_contacto: formLead.cargo_contacto.trim(),
        email: formLead.email.trim(),
        telefono: formLead.telefono.trim(),
        fuente: formLead.fuente.trim(),
        ...(leadSeleccionado ? { estado: formLead.estado } : {}),
      };

      if (leadSeleccionado) {
        await api.put(`/crm/leads/${leadSeleccionado.id_lead}`, datos);
      } else {
        await api.post("/crm/leads", datos);
      }

      await cargarDatosOportunidad();
      setMostrarModalLead(false);
      setFormLead(FORM_LEAD_INICIAL);
      setLeadSeleccionado(null);
    } catch (error) {
      setMensajeLead(error.message || "No se pudo guardar el lead.");
    } finally {
      setGuardandoLead(false);
    }
  }

  async function descartarLead(lead) {
    if (!window.confirm(`¿Descartar el lead “${lead.nombre}”?`)) return;
    try {
      await api.patch(`/crm/leads/${lead.id_lead}/etapa`, { estado_pipeline: "Descartado" });
      await cargarDatosOportunidad();
    } catch (error) {
      setErrorLeads(error.message || "No se pudo descartar el lead.");
    }
  }

  function abrirConversionLead(lead) {
    setLeadAConvertir(lead);
    setFormConversion({
      tipo_cliente: "Empresa",
      num_documento: "",
      direccion: "",
      id_usuario: responsables[0]?.id_usuario ? String(responsables[0].id_usuario) : "",
    });
    setErrorLeads("");
    setMostrarModalConversion(true);
  }

  async function convertirLead(event) {
    event.preventDefault();
    if (!leadAConvertir) return;
    setGuardandoConversion(true);
    setErrorLeads("");
    try {
      await api.post(`/crm/leads/${leadAConvertir.id_lead}/convertir`, {
        tipo_cliente: formConversion.tipo_cliente,
        num_documento: formConversion.num_documento.trim() || null,
        direccion: formConversion.direccion.trim() || null,
        id_usuario: formConversion.id_usuario || null,
      });
      await Promise.all([cargarDatosOportunidad(), cargarOportunidades()]);
      setMostrarModalConversion(false);
      setLeadAConvertir(null);
    } catch (error) {
      setErrorLeads(error.message || "No se pudo convertir el lead.");
    } finally {
      setGuardandoConversion(false);
    }
  }


  async function exportarLeadsExcel() {
    setExportandoLeads(true);
    setErrorLeads("");

    try {
      const fecha = new Date().toISOString().slice(0, 10);
      await api.download(
        "/reportes/leads/excel",
        `NEXORA_Reporte_Leads_${fecha}.xlsx`
      );
    } catch (error) {
      setErrorLeads(error.message || "No se pudo exportar el reporte de leads.");
    } finally {
      setExportandoLeads(false);
    }
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <DashboardLayout>

      <section className="space-y-5">


        {/* ==================================================
            CABECERA
        ================================================== */}

        <div className="
          flex
          items-center
          justify-between
          flex-wrap
          gap-3
        ">

          <div>

            <h1 className="
              font-display
              text-2xl
              font-bold
              text-nx-900
            ">
              Marketing y Ventas — CRM
            </h1>

            <p className="
              text-sm
              text-slate-500
            ">
              Clientes, leads y pipeline comercial
            </p>

          </div>


          <button
            type="button"
            onClick={pestana === "leads" ? abrirNuevoLead : abrirNuevoCliente}
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
            {pestana === "leads" ? "+ Nuevo lead" : "+ Nuevo cliente"}
          </button>

        </div>


        {/* ==================================================
            PESTAÑAS
        ================================================== */}

        <div className="
          border-b
          border-nx-line
          flex
          items-center
          gap-6
        ">

          <button
            type="button"
            onClick={() => setPestana("pipeline")}
            className={`
              pb-3
              text-sm
              font-semibold
              border-b-2
              transition
              ${
                pestana === "pipeline"
                  ? "text-brand-violet border-brand-violet"
                  : "text-slate-400 border-transparent hover:text-slate-700"
              }
            `}
          >
            Pipeline de ventas
          </button>


          <button
            type="button"
            onClick={() => setPestana("clientes")}
            className={`
              pb-3
              text-sm
              font-semibold
              border-b-2
              transition
              ${
                pestana === "clientes"
                  ? "text-brand-violet border-brand-violet"
                  : "text-slate-400 border-transparent hover:text-slate-700"
              }
            `}
          >
            Clientes
          </button>

          <button
            type="button"
            onClick={() => setPestana("leads")}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              pestana === "leads"
                ? "text-brand-violet border-brand-violet"
                : "text-slate-400 border-transparent hover:text-slate-700"
            }`}
          >
            Leads
          </button>

        </div>


        {/* ==================================================
            ERROR
        ================================================== */}

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
            justify-between
          ">

            <span>
              <strong>Error:</strong> {error}
            </span>

            <button
              type="button"
              onClick={() => setError("")}
            >
              ✕
            </button>

          </div>

        )}


        {/* ==================================================
            PIPELINE
        ================================================== */}

        {pestana === "pipeline" && (

          <div className="
            bg-white
            rounded-2xl
            border
            border-nx-line
            shadow-soft
            p-8
          ">

            <div className="space-y-4">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-lg font-display font-bold text-ink">
                    Pipeline de ventas
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Arrastra las oportunidades para actualizar su etapa comercial.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={abrirModalNuevaOportunidad}
                  className="inline-flex items-center gap-2 rounded-xl bg-nx-violet px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:opacity-90 transition"
                >
                  <span className="text-lg leading-none">
                    +
                  </span>

                  Nueva oportunidad
                </button>

                <div className="text-sm text-slate-500">
                  {oportunidades.length} oportunidades
                </div>

              </div>


              {/* ERROR */}

              {errorOportunidades && (

                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorOportunidades}
                </div>

              )}


              {/* LOADING */}

              {cargandoOportunidades ? (

                <div className="rounded-2xl bg-white border border-nx-line shadow-soft p-10 text-center">

                  <div className="text-sm text-slate-500">
                    Cargando oportunidades...
                  </div>

                </div>

              ) : (

                <div className="overflow-x-auto pb-4">

                  <div className="flex gap-4 min-w-max">

                    {ETAPAS_PIPELINE.map((etapa) => {

                      const oportunidadesEtapa =
                        oportunidades.filter(
                          (oportunidad) =>
                            oportunidad.etapa === etapa
                        );

                      const totalEtapa =
                        oportunidadesEtapa.reduce(
                          (total, oportunidad) =>
                            total +
                            Number(
                              oportunidad.valor_estimado || 0
                            ),
                          0
                        );

                      return (

                        <div
                          key={etapa}
                          className="w-[280px] flex-shrink-0"
                          onDragOver={(event) => {
                            event.preventDefault();

                            event.dataTransfer.dropEffect =
                              "move";
                          }}
                          onDrop={(event) =>
                            handleDrop(
                              event,
                              etapa
                            )
                          }
                        >

                          {/* ENCABEZADO COLUMNA */}

                          <div className="mb-3">

                            <div className="flex items-center justify-between">

                              <div className="flex items-center gap-2">

                                <h3 className="text-sm font-semibold text-ink">
                                  {etapa}
                                </h3>

                                <span className="min-w-[24px] h-6 px-2 rounded-full bg-nx-bg text-xs font-semibold text-slate-600 flex items-center justify-center">
                                  {oportunidadesEtapa.length}
                                </span>

                              </div>

                            </div>

                            <div className="mt-1 text-xs text-slate-400">

                              S/{" "}

                              {totalEtapa.toLocaleString(
                                "es-PE",
                                {
                                  minimumFractionDigits: 2,
                                }
                              )}

                            </div>

                          </div>


                          {/* ÁREA DROP */}

                          <div
                            className={`
                              min-h-[420px]
                              rounded-2xl
                              bg-nx-bg
                              border border-nx-line
                              p-3
                              space-y-3
                              transition
                              ${
                                oportunidadArrastrada
                                  ? "border-dashed border-nx-violet bg-violet-50/30"
                                  : ""
                              }
                            `}
                          >

                            {oportunidadesEtapa.length === 0 ? (

                              <div className="min-h-[120px] flex items-center justify-center text-center">

                                <div>

                                  <div className="text-2xl mb-2">
                                    ○
                                  </div>

                                  <p className="text-xs text-slate-400">
                                    Sin oportunidades
                                  </p>

                                </div>

                              </div>

                            ) : (

                              oportunidadesEtapa.map(
                                (oportunidad) => (

                                  <div
                                    key={
                                      oportunidad.id_oportunidad
                                    }
                                    draggable
                                    onDragStart={(event) =>
                                      handleDragStart(
                                        event,
                                        oportunidad
                                      )
                                    }
                                    onDragEnd={
                                      handleDragEnd
                                    }
                                    className={`
                                      bg-white
                                      rounded-xl
                                      border
                                      border-nx-line
                                      shadow-soft
                                      p-4
                                      cursor-grab
                                      active:cursor-grabbing
                                      transition
                                      hover:shadow-md
                                      ${
                                        actualizandoEtapa ===
                                        oportunidad.id_oportunidad
                                          ? "opacity-60"
                                          : ""
                                      }
                                    `}
                                  >

                                    {/* NOMBRE */}

                                    <div className="flex items-start justify-between gap-2">

                                      <div className="min-w-0">

                                        <h4 className="text-sm font-semibold text-ink truncate">
                                          {oportunidad.cliente ||
                                            oportunidad.lead ||
                                            (oportunidad.id_lead
                                              ? "Lead sin nombre"
                                              : "Cliente sin nombre")}
                                        </h4>

                                        <span className={`inline-flex mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                          oportunidad.id_lead
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-violet-100 text-violet-800"
                                        }`}>
                                          {oportunidad.id_lead ? "Lead" : "Cliente"}
                                        </span>

                                        {oportunidad.contacto_lead && (

                                          <p className="text-xs text-slate-500 mt-1 truncate">
                                            {
                                              oportunidad.contacto_lead
                                            }
                                          </p>

                                        )}

                                      </div>

                                      <span className="text-xs text-slate-400">
                                        #{oportunidad.id_oportunidad}
                                      </span>

                                    </div>


                                    {/* SERVICIO */}

                                    {oportunidad.servicio && (

                                      <div className="mt-3">

                                        <span className="inline-flex items-center rounded-lg bg-nx-bg px-2.5 py-1 text-xs font-medium text-nx-700">
                                          {
                                            oportunidad.servicio
                                          }
                                        </span>

                                      </div>

                                    )}


                                    {/* VALOR */}

                                    <div className="mt-4">

                                      <p className="text-xs text-slate-400">
                                        Valor estimado
                                      </p>

                                      <p className="text-base font-bold text-ink">

                                        S/{" "}

                                        {Number(
                                          oportunidad.valor_estimado ||
                                          0
                                        ).toLocaleString(
                                          "es-PE",
                                          {
                                            minimumFractionDigits: 2,
                                          }
                                        )}

                                      </p>

                                    </div>


                                    {/* INFORMACIÓN */}

                                    <div className="mt-4 space-y-2">

                                      {oportunidad.fuente && (

                                        <div className="flex items-center justify-between gap-3 text-xs">

                                          <span className="text-slate-400">
                                            Fuente
                                          </span>

                                          <span className="text-slate-600 font-medium truncate">
                                            {
                                              oportunidad.fuente
                                            }
                                          </span>

                                        </div>

                                      )}


                                      {oportunidad.responsable && (

                                        <div className="flex items-center justify-between gap-3 text-xs">

                                          <span className="text-slate-400">
                                            Responsable
                                          </span>

                                          <span className="text-slate-600 font-medium truncate">
                                            {
                                              oportunidad.responsable
                                            }
                                          </span>

                                        </div>

                                      )}

                                    </div>


                                    {/* FOOTER */}

                                    <div className="mt-4 pt-3 border-t border-nx-line flex items-center justify-between">

                                      <span className="text-[11px] text-slate-400">

                                        {oportunidad.fecha_registro
                                          ? new Date(
                                              oportunidad.fecha_registro
                                            ).toLocaleDateString(
                                              "es-PE"
                                            )
                                          : ""}

                                      </span>


                                      {actualizandoEtapa ===
                                        oportunidad.id_oportunidad && (

                                        <span className="text-[11px] text-nx-violet font-medium">
                                          Actualizando...
                                        </span>

                                      )}

                                    </div>

                                  </div>

                                )
                              )

                            )}

                          </div>

                        </div>

                      );

                    })}

                  </div>

                </div>

              )}

            </div>

          </div>

        )}


        {/* ==================================================
            CLIENTES
        ================================================== */}

        {pestana === "clientes" && (

          <>

            {/* FILTROS */}

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

              <div className="
                relative
                flex-1
                min-w-[220px]
              ">

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
                  placeholder="
                    Buscar cliente, documento,
                    email o responsable…
                  "
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
                value={tipoFiltro}
                onChange={(e) =>
                  setTipoFiltro(e.target.value)
                }
                className="
                  border
                  border-nx-line
                  rounded-lg
                  px-3
                  py-2
                  text-sm
                  bg-white
                "
              >

                <option value="">
                  Todos los tipos
                </option>

                <option value="Empresa">
                  Empresa
                </option>

                <option value="Persona">
                  Persona
                </option>

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


              {/* EXPORTAR EXCEL */}

              <button
                type="button"
                onClick={exportarExcel}
                disabled={exportando}
                className="
                  inline-flex
                  items-center
                  gap-2
                  border
                  border-nx-line
                  bg-white
                  hover:bg-nx-bg
                  text-nx-800
                  font-semibold
                  text-sm
                  px-4
                  py-2
                  rounded-lg
                  transition
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >

                <span>
                  {exportando
                    ? "⏳"
                    : "📊"}
                </span>

                {exportando
                  ? "Exportando..."
                  : "Exportar Excel"}

              </button>

            </div>


            {/* TABLA */}

            <div className="
              bg-white
              rounded-2xl
              shadow-soft
              border
              border-nx-line
              overflow-hidden
              overflow-x-auto
            ">

              <table className="
                w-full
                text-sm
              ">

                <thead className="
                  bg-nx-bg
                  text-slate-500
                  text-xs
                  uppercase
                ">

                  <tr>

                    <th className="
                      text-left
                      px-4
                      py-3
                    ">
                      Cliente
                    </th>

                    <th className="
                      text-left
                      px-4
                      py-3
                    ">
                      Documento
                    </th>

                    <th className="
                      text-left
                      px-4
                      py-3
                    ">
                      Contacto
                    </th>

                    <th className="
                      text-left
                      px-4
                      py-3
                    ">
                      Responsable
                    </th>

                    <th className="
                      text-left
                      px-4
                      py-3
                    ">
                      Estado
                    </th>

                    <th className="
                      text-right
                      px-4
                      py-3
                    ">
                      Acciones
                    </th>

                  </tr>

                </thead>


                <tbody className="
                  divide-y
                  divide-nx-line
                ">

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

                        <div className="
                          flex
                          flex-col
                          items-center
                          gap-2
                        ">

                          <span className="text-2xl">
                            ⏳
                          </span>

                          <span>
                            Cargando clientes...
                          </span>

                        </div>

                      </td>

                    </tr>

                  ) : clientesFiltrados.length === 0 ? (

                    <tr>

                      <td
                        colSpan="6"
                        className="
                          text-center
                          py-12
                          text-slate-400
                        "
                      >

                        <div className="
                          flex
                          flex-col
                          items-center
                          gap-2
                        ">

                          <span className="text-3xl">
                            👥
                          </span>

                          <span>
                            No se encontraron clientes.
                          </span>

                          <button
                            type="button"
                            onClick={abrirNuevoCliente}
                            className="
                              mt-2
                              text-brand-violet
                              font-semibold
                              text-sm
                              hover:underline
                            "
                          >
                            Registrar primer cliente
                          </button>

                        </div>

                      </td>

                    </tr>

                  ) : (

                    clientesFiltrados.map(
                      (cliente) => {

                        const inicial =
                          cliente
                            .razon_social_nombres
                            ?.charAt(0)
                            ?.toUpperCase() || "?";


                        const estadoBadge =
                          ESTADO_BADGE[
                            cliente.estado
                          ] ||
                          "bg-slate-100 text-slate-500";


                        return (

                          <tr
                            key={
                              cliente.id_cliente
                            }
                            className="
                              hover:bg-nx-bg/60
                              transition
                            "
                          >

                            {/* CLIENTE */}

                            <td className="
                              px-4
                              py-3
                            ">

                              <div className="
                                flex
                                items-center
                                gap-3
                              ">

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
                                  {inicial}
                                </div>

                                <div>

                                  <p className="
                                    font-medium
                                    text-nx-900
                                  ">
                                    {
                                      cliente
                                        .razon_social_nombres
                                    }
                                  </p>

                                  <p className="
                                    text-xs
                                    text-slate-400
                                  ">
                                    {
                                      cliente
                                        .tipo_cliente
                                    }
                                  </p>

                                </div>

                              </div>

                            </td>


                            {/* DOCUMENTO */}

                            <td className="
                              px-4
                              py-3
                            ">
                              {
                                cliente
                                  .num_documento ||
                                "—"
                              }
                            </td>


                            {/* CONTACTO */}

                            <td className="
                              px-4
                              py-3
                            ">

                              <p>
                                {
                                  cliente.email ||
                                  "—"
                                }
                              </p>

                              <p className="
                                text-xs
                                text-slate-400
                                mt-0.5
                              ">
                                {
                                  cliente.telefono ||
                                  "—"
                                }
                              </p>

                            </td>


                            {/* RESPONSABLE */}

                            <td className="
                              px-4
                              py-3
                            ">
                              {
                                cliente.responsable ||
                                "Sin asignar"
                              }
                            </td>


                            {/* ESTADO */}

                            <td className="
                              px-4
                              py-3
                            ">

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
                                {
                                  cliente.estado
                                }
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
                                  verDetalle(cliente)
                                }
                                className="
                                  text-slate-500
                                  hover:text-nx-900
                                  text-xs
                                  font-semibold
                                  mr-3
                                "
                              >
                                Ver
                              </button>


                              <button
                                type="button"
                                onClick={() =>
                                  abrirEditarCliente(
                                    cliente
                                  )
                                }
                                className="
                                  text-brand-violet
                                  hover:underline
                                  text-xs
                                  font-semibold
                                  mr-3
                                "
                              >
                                Editar
                              </button>


                              {cliente.estado ===
                                "Activo" && (

                                <button
                                  type="button"
                                  onClick={() =>
                                    desactivarCliente(
                                      cliente
                                    )
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

                      }
                    )

                  )}

                </tbody>

              </table>

            </div>


            {/* CONTADOR */}

            {!loading && (

              <div className="
                text-xs
                text-slate-400
                flex
                justify-between
              ">

                <span>

                  Mostrando{" "}

                  <strong className="
                    text-slate-600
                  ">
                    {
                      clientesFiltrados.length
                    }
                  </strong>

                  {" "}de{" "}

                  <strong className="
                    text-slate-600
                  ">
                    {clientes.length}
                  </strong>

                  {" "}clientes

                </span>

              </div>

            )}

          </>

        )}


        {pestana === "leads" && (
          <div className="space-y-4">
            {errorLeads && (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorLeads}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-soft border border-nx-line p-3 flex flex-wrap gap-3 items-center">
              <input
                type="search"
                value={busquedaLeads}
                onChange={(event) => setBusquedaLeads(event.target.value)}
                placeholder="Buscar lead, contacto, email o fuente…"
                className="flex-1 min-w-[220px] border border-nx-line rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-violet"
              />
              <select
                value={estadoFiltroLead}
                onChange={(event) => setEstadoFiltroLead(event.target.value)}
                className="border border-nx-line rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="">Todos los estados</option>
                <option value="Activo">Activo</option>
                <option value="Convertido">Convertido</option>
                <option value="Descartado">Descartado</option>
              </select>
              <button
                type="button"
                onClick={exportarLeadsExcel}
                disabled={exportandoLeads}
                className="inline-flex items-center gap-2 border border-nx-line bg-white hover:bg-nx-bg text-nx-800 font-semibold text-sm px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {exportandoLeads ? "Exportando…" : "Exportar Excel"}
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-nx-line overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-nx-bg text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">Lead</th>
                    <th className="text-left px-4 py-3">Contacto</th>
                    <th className="text-left px-4 py-3">Email / Teléfono</th>
                    <th className="text-left px-4 py-3">Fuente</th>
                    <th className="text-left px-4 py-3">Estado</th>
                    <th className="text-right px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nx-line">
                  {cargandoLeads ? (
                    <tr><td colSpan="6" className="text-center py-12 text-slate-400">Cargando leads…</td></tr>
                  ) : leadsFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400">
                        <p>{leads.length ? "No hay leads que coincidan con los filtros." : "Todavía no hay leads registrados."}</p>
                        {!leads.length && (
                          <button type="button" onClick={abrirNuevoLead} className="mt-2 text-brand-violet font-semibold text-sm hover:underline">
                            Registrar primer lead
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : leadsFiltrados.map((lead) => (
                    <tr key={lead.id_lead} className="hover:bg-nx-bg/60 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-nx-900">{lead.nombre}</p>
                        <p className="text-xs text-slate-400">#{lead.id_lead}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p>{lead.contacto || "—"}</p>
                        {lead.cargo_contacto && <p className="text-xs text-slate-400 mt-0.5">{lead.cargo_contacto}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p>{lead.email || "—"}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{lead.telefono || "—"}</p>
                      </td>
                      <td className="px-4 py-3">{lead.fuente || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          lead.estado === "Activo" ? "bg-emerald-100 text-emerald-700" :
                            lead.estado === "Convertido" ? "bg-violet-100 text-violet-700" :
                              "bg-slate-100 text-slate-600"
                        }`}>
                          {lead.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2 whitespace-nowrap">
                          {lead.estado !== "Convertido" && (
                            <>
                              <button type="button" onClick={() => abrirEditarLead(lead)} className="text-xs font-semibold text-brand-violet hover:underline">Editar</button>
                              {lead.estado === "Activo" && <>
                                <button type="button" onClick={() => abrirConversionLead(lead)} className="text-xs font-semibold text-emerald-700 hover:underline">Convertir</button>
                                <button type="button" onClick={() => descartarLead(lead)} className="text-xs font-semibold text-rose-600 hover:underline">Descartar</button>
                              </>}
                            </>
                          )}
                          {lead.estado === "Convertido" && <span className="text-xs text-slate-400">Ver en clientes</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!cargandoLeads && (
              <p className="text-xs text-slate-400">
                Mostrando <strong className="text-slate-600">{leadsFiltrados.length}</strong> de <strong className="text-slate-600">{leads.length}</strong> leads
              </p>
            )}
          </div>
        )}

      </section>


      {/* ====================================================
          MODAL CREAR / EDITAR
      ==================================================== */}

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

            {/* HEADER */}

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
                  {
                    modoFormulario === "crear"
                      ? "Nuevo cliente"
                      : "Editar cliente"
                  }
                </h2>

                <p className="
                  text-xs
                  text-slate-400
                  mt-0.5
                ">
                  {
                    modoFormulario === "crear"
                      ? "Registra un nuevo cliente en el CRM."
                      : "Actualiza la información del cliente."
                  }
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
                "
              >
                ✕
              </button>

            </div>


            {/* FORM */}

            <form onSubmit={guardarCliente}>

              <div className="
                p-6
                grid
                grid-cols-1
                md:grid-cols-2
                gap-4
              ">

                {/* TIPO */}

                <div>

                  <label className="
                    block
                    text-xs
                    font-semibold
                    text-slate-600
                    mb-1.5
                  ">
                    Tipo de cliente *
                  </label>

                  <select
                    name="tipo_cliente"
                    value={
                      formulario.tipo_cliente
                    }
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
                    "
                  >

                    <option value="Empresa">
                      Empresa
                    </option>

                    <option value="Persona">
                      Persona
                    </option>

                  </select>

                </div>


                {/* NOMBRE */}

                <div>

                  <label className="
                    block
                    text-xs
                    font-semibold
                    text-slate-600
                    mb-1.5
                  ">
                    Razón social / Nombres *
                  </label>

                  <input
                    type="text"
                    name="razon_social_nombres"
                    value={
                      formulario.razon_social_nombres
                    }
                    onChange={cambiarCampo}
                    className="
                      w-full
                      border
                      border-nx-line
                      rounded-lg
                      px-3
                      py-2.5
                      text-sm
                    "
                  />

                </div>


                {/* DOCUMENTO */}

                <div>

                  <label className="
                    block
                    text-xs
                    font-semibold
                    text-slate-600
                    mb-1.5
                  ">
                    RUC / DNI *
                  </label>

                  <input
                    type="text"
                    name="num_documento"
                    value={
                      formulario.num_documento
                    }
                    onChange={cambiarCampo}
                    className="
                      w-full
                      border
                      border-nx-line
                      rounded-lg
                      px-3
                      py-2.5
                      text-sm
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
                    "
                  />

                </div>


                {/* TELEFONO */}

                <div>

                  <label className="
                    block
                    text-xs
                    font-semibold
                    text-slate-600
                    mb-1.5
                  ">
                    Teléfono *
                  </label>

                  <input
                    type="text"
                    name="telefono"
                    value={formulario.telefono}
                    onChange={cambiarCampo}
                    className="
                      w-full
                      border
                      border-nx-line
                      rounded-lg
                      px-3
                      py-2.5
                      text-sm
                    "
                  />

                </div>


                {/* RESPONSABLE */}

                <div>

                  <label className="
                    block
                    text-xs
                    font-semibold
                    text-slate-600
                    mb-1.5
                  ">
                    Responsable *
                  </label>

                  <select
                    name="id_usuario"
                    value={
                      formulario.id_usuario
                    }
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
                    "
                  >

                    <option value="">
                      Seleccionar responsable
                    </option>

                    {responsables.map(
                      (responsable) => (

                        <option
                          key={
                            responsable.id_usuario
                          }
                          value={
                            responsable.id_usuario
                          }
                        >
                          {
                            responsable.nombres
                          }{" "}
                          {
                            responsable.apellidos
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* DIRECCION */}

                <div className="md:col-span-2">

                  <label className="
                    block
                    text-xs
                    font-semibold
                    text-slate-600
                    mb-1.5
                  ">
                    Dirección
                  </label>

                  <input
                    type="text"
                    name="direccion"
                    value={
                      formulario.direccion
                    }
                    onChange={cambiarCampo}
                    className="
                      w-full
                      border
                      border-nx-line
                      rounded-lg
                      px-3
                      py-2.5
                      text-sm
                    "
                  />

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
                    value={
                      formulario.estado
                    }
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


              {/* MENSAJE */}

              {mensaje && (

                <div className="
                  mx-6
                  mb-4
                  rounded-lg
                  px-3
                  py-2.5
                  text-sm
                  bg-rose-50
                  text-rose-700
                  border
                  border-rose-200
                ">
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
                    shadow-pop
                    disabled:opacity-50
                  "
                >

                  {guardando
                    ? "Guardando..."
                    : modoFormulario === "crear"
                      ? "Crear cliente"
                      : "Guardar cambios"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {mostrarModalLead && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-nx-line flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-lg text-nx-900">{leadSeleccionado ? "Editar lead" : "Nuevo lead"}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Registra y administra clientes potenciales del pipeline.</p>
              </div>
              <button type="button" onClick={() => setMostrarModalLead(false)} className="w-8 h-8 rounded-lg hover:bg-nx-bg text-slate-400" aria-label="Cerrar">
                ×
              </button>
            </div>

            <form onSubmit={guardarLead}>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-xs font-semibold text-slate-600">
                  Nombre del lead *
                  <input name="nombre" value={formLead.nombre} onChange={cambiarCampoLead} required maxLength={150}
                    className="mt-1.5 w-full border border-nx-line rounded-lg px-3 py-2.5 text-sm font-normal outline-none focus:border-brand-violet" />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Persona de contacto
                  <input name="contacto" value={formLead.contacto} onChange={cambiarCampoLead} maxLength={120}
                    className="mt-1.5 w-full border border-nx-line rounded-lg px-3 py-2.5 text-sm font-normal outline-none focus:border-brand-violet" />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Cargo del contacto
                  <input name="cargo_contacto" value={formLead.cargo_contacto} onChange={cambiarCampoLead} maxLength={80}
                    className="mt-1.5 w-full border border-nx-line rounded-lg px-3 py-2.5 text-sm font-normal outline-none focus:border-brand-violet" />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Email
                  <input name="email" type="email" value={formLead.email} onChange={cambiarCampoLead} maxLength={120}
                    className="mt-1.5 w-full border border-nx-line rounded-lg px-3 py-2.5 text-sm font-normal outline-none focus:border-brand-violet" />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Teléfono
                  <input name="telefono" type="tel" value={formLead.telefono} onChange={cambiarCampoLead} maxLength={20}
                    className="mt-1.5 w-full border border-nx-line rounded-lg px-3 py-2.5 text-sm font-normal outline-none focus:border-brand-violet" />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Fuente
                  <input name="fuente" value={formLead.fuente} onChange={cambiarCampoLead} maxLength={60} placeholder="Web, referido, campaña..."
                    className="mt-1.5 w-full border border-nx-line rounded-lg px-3 py-2.5 text-sm font-normal outline-none focus:border-brand-violet" />
                </label>
                {leadSeleccionado && <label className="text-xs font-semibold text-slate-600">
                  Estado
                  <select name="estado" value={formLead.estado} onChange={cambiarCampoLead} className="mt-1.5 w-full border border-nx-line rounded-lg px-3 py-2.5 text-sm font-normal bg-white">
                    <option value="Activo">Activo</option>
                    <option value="Descartado">Descartado</option>
                  </select>
                </label>}
              </div>

              {mensajeLead && <p role="alert" className="mx-6 mb-4 rounded-lg px-3 py-2.5 text-sm bg-rose-50 text-rose-700 border border-rose-200">{mensajeLead}</p>}

              <div className="px-6 py-4 bg-nx-bg border-t border-nx-line flex justify-end gap-2">
                <button type="button" onClick={() => setMostrarModalLead(false)} disabled={guardandoLead}
                  className="px-4 py-2.5 rounded-lg border border-nx-line bg-white text-sm font-semibold text-slate-600">Cancelar</button>
                <button type="submit" disabled={guardandoLead}
                  className="px-5 py-2.5 rounded-lg bg-brand-violet text-white text-sm font-semibold shadow-pop disabled:opacity-50">
                  {guardandoLead ? "Guardando..." : leadSeleccionado ? "Guardar cambios" : "Crear lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalConversion && leadAConvertir && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-nx-line flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-lg text-nx-900">Convertir lead en cliente</h2>
                <p className="text-xs text-slate-400 mt-0.5">{leadAConvertir.nombre} y sus oportunidades pasarán al cliente.</p>
              </div>
              <button type="button" onClick={() => setMostrarModalConversion(false)} className="w-8 h-8 rounded-lg hover:bg-nx-bg text-slate-400" aria-label="Cerrar">×</button>
            </div>
            <form onSubmit={convertirLead}>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-xs font-semibold text-slate-600">
                  Tipo de cliente *
                  <select required value={formConversion.tipo_cliente} onChange={(event) => setFormConversion((actual) => ({ ...actual, tipo_cliente: event.target.value }))} className="mt-1.5 w-full border border-nx-line rounded-lg px-3 py-2.5 text-sm font-normal bg-white">
                    <option value="Empresa">Empresa</option><option value="Persona">Persona</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  N.º de documento
                  <input value={formConversion.num_documento} onChange={(event) => setFormConversion((actual) => ({ ...actual, num_documento: event.target.value }))} maxLength={20} className="mt-1.5 w-full border border-nx-line rounded-lg px-3 py-2.5 text-sm font-normal" />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Dirección
                  <input value={formConversion.direccion} onChange={(event) => setFormConversion((actual) => ({ ...actual, direccion: event.target.value }))} maxLength={200} className="mt-1.5 w-full border border-nx-line rounded-lg px-3 py-2.5 text-sm font-normal" />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Responsable
                  <select value={formConversion.id_usuario} onChange={(event) => setFormConversion((actual) => ({ ...actual, id_usuario: event.target.value }))} className="mt-1.5 w-full border border-nx-line rounded-lg px-3 py-2.5 text-sm font-normal bg-white">
                    <option value="">Sin asignar</option>
                    {responsables.map((responsable) => <option key={responsable.id_usuario} value={responsable.id_usuario}>{responsable.nombre_completo || `${responsable.nombres} ${responsable.apellidos}`}</option>)}
                  </select>
                </label>
              </div>
              {errorLeads && <p role="alert" className="mx-6 mb-4 rounded-lg px-3 py-2.5 text-sm bg-rose-50 text-rose-700 border border-rose-200">{errorLeads}</p>}
              <div className="px-6 py-4 bg-nx-bg border-t border-nx-line flex justify-end gap-2">
                <button type="button" onClick={() => setMostrarModalConversion(false)} disabled={guardandoConversion} className="px-4 py-2.5 rounded-lg border border-nx-line bg-white text-sm font-semibold text-slate-600">Cancelar</button>
                <button type="submit" disabled={guardandoConversion} className="px-5 py-2.5 rounded-lg bg-brand-violet text-white text-sm font-semibold disabled:opacity-50">{guardandoConversion ? "Convirtiendo…" : "Crear cliente y trasladar oportunidades"}</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ====================================================
          MODAL DETALLE
      ==================================================== */}

      {detalleAbierto &&
        clienteDetalle && (

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
            max-w-lg
            rounded-2xl
            shadow-2xl
            overflow-hidden
          ">

            <div className="
              px-6
              py-4
              border-b
              border-nx-line
              flex
              justify-between
            ">

              <div>

                <h2 className="
                  font-display
                  font-bold
                  text-lg
                ">
                  {
                    clienteDetalle
                      .razon_social_nombres
                  }
                </h2>

                <p className="
                  text-xs
                  text-slate-400
                ">
                  Detalle del cliente
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setDetalleAbierto(false)
                }
                className="
                  text-slate-400
                  hover:text-slate-700
                "
              >
                ✕
              </button>

            </div>


            <div className="
              p-6
              space-y-4
            ">

              <div className="
                grid
                grid-cols-2
                gap-4
              ">

                <div>

                  <p className="
                    text-xs
                    text-slate-400
                  ">
                    Tipo
                  </p>

                  <p className="
                    text-sm
                    font-semibold
                  ">
                    {
                      clienteDetalle.tipo_cliente
                    }
                  </p>

                </div>


                <div>

                  <p className="
                    text-xs
                    text-slate-400
                  ">
                    Documento
                  </p>

                  <p className="
                    text-sm
                    font-semibold
                  ">
                    {
                      clienteDetalle.num_documento
                    }
                  </p>

                </div>


                <div>

                  <p className="
                    text-xs
                    text-slate-400
                  ">
                    Email
                  </p>

                  <p className="
                    text-sm
                    font-semibold
                    break-all
                  ">
                    {
                      clienteDetalle.email
                    }
                  </p>

                </div>


                <div>

                  <p className="
                    text-xs
                    text-slate-400
                  ">
                    Teléfono
                  </p>

                  <p className="
                    text-sm
                    font-semibold
                  ">
                    {
                      clienteDetalle.telefono
                    }
                  </p>

                </div>


                <div>

                  <p className="
                    text-xs
                    text-slate-400
                  ">
                    Responsable
                  </p>

                  <p className="
                    text-sm
                    font-semibold
                  ">
                    {
                      clienteDetalle.responsable ||
                      "Sin asignar"
                    }
                  </p>

                </div>


                <div>

                  <p className="
                    text-xs
                    text-slate-400
                  ">
                    Estado
                  </p>

                  <span className="
                    inline-flex
                    mt-1
                    px-2.5
                    py-1
                    rounded-full
                    text-xs
                    font-semibold
                    bg-emerald-100
                    text-emerald-700
                  ">
                    {
                      clienteDetalle.estado
                    }
                  </span>

                </div>

              </div>


              <div>

                <p className="
                  text-xs
                  text-slate-400
                  mb-1
                ">
                  Dirección
                </p>

                <p className="
                  text-sm
                  text-slate-700
                ">
                  {
                    clienteDetalle.direccion ||
                    "Sin dirección registrada"
                  }
                </p>

              </div>

            </div>


            <div className="
              px-6
              py-4
              bg-nx-bg
              border-t
              border-nx-line
              text-right
            ">

              <button
                type="button"
                onClick={() =>
                  setDetalleAbierto(false)
                }
                className="
                  px-4
                  py-2
                  rounded-lg
                  bg-white
                  border
                  border-nx-line
                  text-sm
                  font-semibold
                "
              >
                Cerrar
              </button>

            </div>

          </div>

        </div>

      )}


      {/* ====================================================
          MODAL NUEVA OPORTUNIDAD
      ==================================================== */}

      {mostrarModalOportunidad && (

        <div className="
          fixed
          inset-0
          z-50
          flex
          items-center
          justify-center
          bg-black/40
          p-4
        ">

          <div className="
            w-full
            max-w-xl
            rounded-2xl
            bg-white
            shadow-pop
          ">

            {/* HEADER */}

            <div className="
              flex
              items-center
              justify-between
              border-b
              border-nx-line
              px-6
              py-4
            ">

              <div>

                <h3 className="
                  text-lg
                  font-display
                  font-bold
                  text-ink
                ">
                  Nueva oportunidad
                </h3>

                <p className="
                  mt-1
                  text-sm
                  text-gray-500
                ">
                  Registra una oportunidad para el pipeline comercial.
                </p>

              </div>


              <button
                type="button"
                onClick={cerrarModalOportunidad}
                className="
                  text-xl
                  text-gray-400
                  hover:text-gray-700
                "
              >
                ×
              </button>

            </div>


            {/* FORMULARIO */}

            <form
              onSubmit={crearNuevaOportunidad}
              className="
                p-6
                space-y-5
              "
            >

              {/* ORIGEN */}

              <div>

                <label className="
                  block
                  text-sm
                  font-semibold
                  text-ink
                  mb-2
                ">
                  Origen
                </label>

                <div className="
                  flex
                  gap-3
                ">

                  <button
                    type="button"
                    onClick={() =>
                      cambiarOrigenOportunidad(
                        "cliente"
                      )
                    }
                    className={`
                      flex-1
                      rounded-xl
                      border
                      px-4
                      py-3
                      text-sm
                      font-semibold
                      transition
                      ${
                        origenOportunidad ===
                        "cliente"
                          ? "border-nx-violet bg-nx-violet/10 text-nx-violet"
                          : "border-nx-line text-gray-600 hover:bg-nx-bg"
                      }
                    `}
                  >
                    Cliente
                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      cambiarOrigenOportunidad(
                        "lead"
                      )
                    }
                    className={`
                      flex-1
                      rounded-xl
                      border
                      px-4
                      py-3
                      text-sm
                      font-semibold
                      transition
                      ${
                        origenOportunidad ===
                        "lead"
                          ? "border-nx-violet bg-nx-violet/10 text-nx-violet"
                          : "border-nx-line text-gray-600 hover:bg-nx-bg"
                      }
                    `}
                  >
                    Lead
                  </button>

                </div>

              </div>


              {/* CLIENTE */}

              {origenOportunidad === "cliente" && (

                <div>

                  <label
                    htmlFor="oportunidad-cliente"
                    className="
                      block
                      text-sm
                      font-semibold
                      text-ink
                      mb-2
                    "
                  >
                    Cliente
                  </label>

                  <select
                    id="oportunidad-cliente"
                    name="id_cliente"
                    value={
                      formOportunidad.id_cliente
                    }
                    onChange={
                      handleOportunidadChange
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-nx-line
                      bg-white
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-nx-violet
                    "
                  >

                    <option value="">
                      Seleccionar cliente...
                    </option>

                    {clientes.map(
                      (cliente) => (

                        <option
                          key={
                            cliente.id_cliente
                          }
                          value={
                            cliente.id_cliente
                          }
                        >
                          {
                            cliente.razon_social_nombres
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>

              )}


              {/* LEAD */}

              {origenOportunidad === "lead" && (

                <div>

                  <label
                    htmlFor="oportunidad-lead"
                    className="
                      block
                      text-sm
                      font-semibold
                      text-ink
                      mb-2
                    "
                  >
                    Lead
                  </label>

                  <select
                    id="oportunidad-lead"
                    name="id_lead"
                    value={
                      formOportunidad.id_lead
                    }
                    onChange={
                      handleOportunidadChange
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      border-nx-line
                      bg-white
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-nx-violet
                    "
                  >

                    <option value="">
                      Seleccionar lead...
                    </option>

                    {leads
                      .filter(
                        (lead) =>
                          lead.estado ===
                          "Activo"
                      )
                      .map(
                        (lead) => (

                          <option
                            key={
                              lead.id_lead
                            }
                            value={
                              lead.id_lead
                            }
                          >
                            {lead.nombre}

                            {lead.contacto
                              ? ` — ${lead.contacto}`
                              : ""}

                          </option>

                        )
                      )}

                  </select>

                </div>

              )}


              {/* VALOR */}

              <div>

                <label
                  htmlFor="oportunidad-valor"
                  className="
                    block
                    text-sm
                    font-semibold
                    text-ink
                    mb-2
                  "
                >
                  Valor estimado
                </label>

                <input
                  id="oportunidad-valor"
                  type="number"
                  min="0"
                  step="0.01"
                  name="valor_estimado"
                  value={
                    formOportunidad.valor_estimado
                  }
                  onChange={
                    handleOportunidadChange
                  }
                  placeholder="3500.00"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-nx-line
                    px-4
                    py-3
                    text-sm
                    outline-none
                    focus:border-nx-violet
                  "
                />

              </div>


              {/* RESPONSABLE */}

              <div>

                <label
                  htmlFor="oportunidad-responsable"
                  className="
                    block
                    text-sm
                    font-semibold
                    text-ink
                    mb-2
                  "
                >
                  Responsable
                </label>

                <select
                  id="oportunidad-responsable"
                  name="id_usuario"
                  value={
                    formOportunidad.id_usuario
                  }
                  onChange={
                    handleOportunidadChange
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-nx-line
                    bg-white
                    px-4
                    py-3
                    text-sm
                    outline-none
                    focus:border-nx-violet
                  "
                >

                  <option value="">
                    Seleccionar responsable...
                  </option>

                  {responsables.map(
                    (responsable) => (

                      <option
                        key={
                          responsable.id_usuario
                        }
                        value={
                          responsable.id_usuario
                        }
                      >
                        {
                          responsable.nombres
                        }{" "}
                        {
                          responsable.apellidos
                        }
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* NOTAS */}

              <div>

                <label
                  htmlFor="oportunidad-notas"
                  className="
                    block
                    text-sm
                    font-semibold
                    text-ink
                    mb-2
                  "
                >
                  Notas
                </label>

                <textarea
                  id="oportunidad-notas"
                  name="notas"
                  value={
                    formOportunidad.notas
                  }
                  onChange={
                    handleOportunidadChange
                  }
                  rows="3"
                  maxLength="255"
                  placeholder="Información adicional de la oportunidad..."
                  className="
                    w-full
                    resize-none
                    rounded-xl
                    border
                    border-nx-line
                    px-4
                    py-3
                    text-sm
                    outline-none
                    focus:border-nx-violet
                  "
                />

              </div>


              {/* ERROR */}

              {errorFormularioOportunidad && (

                <div className="
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  px-4
                  py-3
                  text-sm
                  text-red-700
                ">
                  {
                    errorFormularioOportunidad
                  }
                </div>

              )}


              {/* BOTONES */}

              <div className="
                flex
                justify-end
                gap-3
                pt-2
              ">

                <button
                  type="button"
                  onClick={
                    cerrarModalOportunidad
                  }
                  disabled={
                    guardandoOportunidad
                  }
                  className="
                    rounded-xl
                    border
                    border-nx-line
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-gray-600
                    hover:bg-nx-bg
                  "
                >
                  Cancelar
                </button>


                <button
                  type="submit"
                  disabled={
                    guardandoOportunidad
                  }
                  className="
                    rounded-xl
                    bg-nx-violet
                    px-5
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    shadow-soft
                    hover:opacity-90
                    disabled:opacity-60
                  "
                >

                  {guardandoOportunidad
                    ? "Creando..."
                    : "Crear oportunidad"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </DashboardLayout>

  );
}

export default CRM;
