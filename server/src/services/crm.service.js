
const crmModel = require("../models/crm.model");
const crmDTO = require("../dto/crm.dto");

// =====================================================
// CONSTANTES Y VALIDACIONES GENERALES
// =====================================================

const ETAPAS_OPORTUNIDAD = [
    "Nuevo lead",
    "Contactado",
    "Reunión",
    "Propuesta enviada",
    "Negociación",
    "Ganado",
    "Perdido"
];

const ESTADOS_CLIENTE = ["Activo", "Inactivo"];

const ESTADOS_LEAD = [
    "Activo",
    "Descartado"
];

function validarId(id, nombre = "ID") {
    const numero = Number(id);

    if (!Number.isInteger(numero) || numero <= 0) {
        throw new Error(`${nombre} no es válido.`);
    }

    return numero;
}

function validarCamposObligatorios(datos, campos) {
    for (const campo of campos) {
        const valor = datos[campo];

        if (
            valor === undefined ||
            valor === null ||
            String(valor).trim() === ""
        ) {
            throw new Error(`El campo "${campo}" es obligatorio.`);
        }
    }
}

function validarEtapaOportunidad(etapa) {
    if (!ETAPAS_OPORTUNIDAD.includes(etapa)) {
        throw new Error(
            `Etapa no válida. Valores permitidos: ${ETAPAS_OPORTUNIDAD.join(", ")}.`
        );
    }
}

function validarEstadoCliente(estado) {
    if (!ESTADOS_CLIENTE.includes(estado)) {
        throw new Error(
            `Estado de cliente no válido. Usa: ${ESTADOS_CLIENTE.join(" o ")}.`
        );
    }
}

function validarEstadoLead(estado) {
    if (!ESTADOS_LEAD.includes(estado)) {
        throw new Error(
            `Estado de lead no válido. Usa: ${ESTADOS_LEAD.join(", ")}.`
        );
    }
}

function validarValorEstimado(valor) {
    const numero = Number(valor);

    if (
        valor === undefined ||
        valor === null ||
        valor === "" ||
        !Number.isFinite(numero) ||
        numero < 0
    ) {
        throw new Error(
            "El valor estimado debe ser un número mayor o igual a cero."
        );
    }

    return numero;
}

function validarOrigenOportunidad(datos) {
    const tieneCliente =
        datos.id_cliente !== undefined &&
        datos.id_cliente !== null &&
        datos.id_cliente !== "";

    const tieneLead =
        datos.id_lead !== undefined &&
        datos.id_lead !== null &&
        datos.id_lead !== "";

    if (tieneCliente === tieneLead) {
        throw new Error(
            "La oportunidad debe pertenecer a un cliente o a un lead, pero no a ambos."
        );
    }

    if (tieneCliente) {
        validarId(datos.id_cliente, "ID del cliente");
    }

    if (tieneLead) {
        validarId(datos.id_lead, "ID del lead");
    }
}

function validarDatosOportunidad(datos) {
    validarOrigenOportunidad(datos);

    validarCamposObligatorios(datos, ["id_usuario"]);
    validarId(datos.id_usuario, "ID del responsable");

    if (
        datos.valor_estimado === undefined ||
        datos.valor_estimado === null ||
        datos.valor_estimado === ""
    ) {
        datos.valor_estimado = 0;
    }

    datos.valor_estimado = validarValorEstimado(
        datos.valor_estimado
    );

    if (datos.etapa === undefined || datos.etapa === null || datos.etapa === "") {
        datos.etapa = "Nuevo lead";
    }

    validarEtapaOportunidad(datos.etapa);

    if (
        datos.id_servicio !== undefined &&
        datos.id_servicio !== null &&
        datos.id_servicio !== ""
    ) {
        validarId(datos.id_servicio, "ID del servicio");
    }
}

// =====================================================
// CLIENTES
// =====================================================

async function obtenerClientes() {
    return crmDTO.lista(await crmModel.obtenerClientes(), crmDTO.clienteDTO);
}

async function obtenerClientePorId(id) {
    const idCliente = validarId(id, "ID del cliente");

    const cliente = await crmModel.obtenerClientePorId(idCliente);

    if (!cliente) {
        throw new Error("El cliente no existe.");
    }

    return crmDTO.clienteDTO(cliente);
}

async function crearCliente(cliente) {
    validarCamposObligatorios(cliente, [
        "tipo_cliente",
        "razon_social_nombres"
    ]);

    if (cliente.num_documento !== undefined && cliente.num_documento !== null) {
        cliente.num_documento = String(cliente.num_documento).trim();
    }

    if (cliente.email) {
        cliente.email = String(cliente.email).trim().toLowerCase();
    }

    if (
        cliente.id_usuario !== undefined &&
        cliente.id_usuario !== null &&
        cliente.id_usuario !== ""
    ) {
        validarId(cliente.id_usuario, "ID del responsable");
    }

    return crmDTO.clienteDTO(await crmModel.crearCliente(cliente));
}

async function actualizarCliente(id, cliente) {
    const idCliente = validarId(id, "ID del cliente");

    validarCamposObligatorios(cliente, [
        "tipo_cliente",
        "razon_social_nombres"
    ]);

    const existente = await crmModel.obtenerClientePorId(idCliente);

    if (!existente) {
        throw new Error("No se puede actualizar: el cliente no existe.");
    }

    if (cliente.estado) {
        validarEstadoCliente(cliente.estado);
    }

    if (cliente.email) {
        cliente.email = String(cliente.email).trim().toLowerCase();
    }

    if (
        cliente.id_usuario !== undefined &&
        cliente.id_usuario !== null &&
        cliente.id_usuario !== ""
    ) {
        validarId(cliente.id_usuario, "ID del responsable");
    }

    return crmDTO.clienteDTO(await crmModel.actualizarCliente(idCliente, cliente));
}

async function cambiarEstadoCliente(id, estado) {
    const idCliente = validarId(id, "ID del cliente");

    validarEstadoCliente(estado);

    const existente = await crmModel.obtenerClientePorId(idCliente);

    if (!existente) {
        throw new Error("No se puede cambiar el estado: el cliente no existe.");
    }

    return crmDTO.clienteDTO(await crmModel.cambiarEstadoCliente(idCliente, estado));
}

// =====================================================
// RESPONSABLES
// =====================================================

async function obtenerResponsables() {
    return crmDTO.lista(await crmModel.obtenerResponsables(), crmDTO.responsableDTO);
}

// =====================================================
// LEADS / CLIENTES POTENCIALES
// =====================================================

async function obtenerLeads() {
    return crmDTO.lista(await crmModel.obtenerLeads(), crmDTO.leadDTO);
}

async function obtenerLeadPorId(id) {
    const idLead = validarId(id, "ID del lead");

    const lead = await crmModel.obtenerLeadPorId(idLead);

    if (!lead) {
        throw new Error("El lead no existe.");
    }

    return crmDTO.leadDTO(lead);
}

async function crearLead(lead) {
    validarCamposObligatorios(lead, ["nombre"]);

    if (lead.email) {
        lead.email = String(lead.email).trim().toLowerCase();
    }

    if (!lead.estado) {
        lead.estado = "Activo";
    }

    validarEstadoLead(lead.estado);

    if (
        lead.id_cliente !== undefined &&
        lead.id_cliente !== null &&
        lead.id_cliente !== ""
    ) {
        validarId(lead.id_cliente, "ID del cliente");
    }

    return crmDTO.leadDTO(await crmModel.crearLead(lead));
}

async function actualizarLead(id, lead) {
    const idLead = validarId(id, "ID del lead");

    validarCamposObligatorios(lead, ["nombre"]);

    const existente = await crmModel.obtenerLeadPorId(idLead);

    if (!existente) {
        throw new Error("No se puede actualizar: el lead no existe.");
    }

    if (existente.estado === "Convertido" || existente.id_cliente) {
        const error = new Error("Los leads convertidos se administran desde la ficha del cliente.");
        error.code = "LEAD_ALREADY_CONVERTED";
        throw error;
    }

    if (lead.estado) {
        validarEstadoLead(lead.estado);
    }

    if (lead.email) {
        lead.email = String(lead.email).trim().toLowerCase();
    }

    if (
        lead.id_cliente !== undefined &&
        lead.id_cliente !== null &&
        lead.id_cliente !== ""
    ) {
        validarId(lead.id_cliente, "ID del cliente");
    }

    return crmDTO.leadDTO(await crmModel.actualizarLead(idLead, lead));
}

async function cambiarEstadoLead(id, estado) {
    const idLead = validarId(id, "ID del lead");

    validarEstadoLead(estado);

    const existente = await crmModel.obtenerLeadPorId(idLead);

    if (!existente) {
        throw new Error("No se puede cambiar el estado: el lead no existe.");
    }

    return crmDTO.leadDTO(await crmModel.cambiarEstadoLead(idLead, estado));
}

async function convertirLeadACliente(id, conversion) {
    const idLead = validarId(id, "ID del lead");
    const resultado = await crmModel.convertirLeadACliente(idLead, conversion);

    return {
        lead: crmDTO.leadDTO(resultado.lead),
        cliente: crmDTO.clienteDTO(resultado.cliente),
        oportunidades_actualizadas: resultado.oportunidades_actualizadas
    };
}

// =====================================================
// OPORTUNIDADES COMERCIALES
// =====================================================

async function obtenerOportunidades() {
    return crmDTO.lista(await crmModel.obtenerOportunidades(), crmDTO.oportunidadDTO);
}

async function obtenerOportunidadPorId(id) {
    const idOportunidad = validarId(id, "ID de la oportunidad");

    const oportunidad =
        await crmModel.obtenerOportunidadPorId(idOportunidad);

    if (!oportunidad) {
        throw new Error("La oportunidad no existe.");
    }

    return crmDTO.oportunidadDTO(oportunidad);
}

async function crearOportunidad(oportunidad) {
    // Se usa un objeto nuevo para evitar modificar directamente
    // el objeto recibido desde el controlador.
    const datos = { ...oportunidad };

    validarDatosOportunidad(datos);

    // Comprueba que el registro de origen exista.
    if (datos.id_cliente) {
        await obtenerClientePorId(datos.id_cliente);
    } else {
        await obtenerLeadPorId(datos.id_lead);
    }

    return crmDTO.oportunidadDTO(await crmModel.crearOportunidad(datos));
}

async function actualizarOportunidad(id, oportunidad) {
    const idOportunidad = validarId(id, "ID de la oportunidad");

    const existente =
        await crmModel.obtenerOportunidadPorId(idOportunidad);

    if (!existente) {
        throw new Error("No se puede actualizar: la oportunidad no existe.");
    }

    const datos = { ...oportunidad };

    validarDatosOportunidad(datos);

    if (datos.id_cliente) {
        await obtenerClientePorId(datos.id_cliente);
    } else {
        await obtenerLeadPorId(datos.id_lead);
    }

    return crmDTO.oportunidadDTO(await crmModel.actualizarOportunidad(
        idOportunidad,
        datos
    ));
}

async function cambiarEtapaOportunidad(id, etapa) {
    const idOportunidad = validarId(id, "ID de la oportunidad");

    validarEtapaOportunidad(etapa);

    const existente =
        await crmModel.obtenerOportunidadPorId(idOportunidad);

    if (!existente) {
        throw new Error(
            "No se puede cambiar la etapa: la oportunidad no existe."
        );
    }

    return crmDTO.oportunidadDTO(await crmModel.cambiarEtapaOportunidad(
        idOportunidad,
        etapa
    ));
}

// =====================================================
// SEGUIMIENTOS
// =====================================================

async function obtenerSeguimientos(idOportunidad) {
    const idValido = validarId(
        idOportunidad,
        "ID de la oportunidad"
    );

    // Evita consultar seguimientos de una oportunidad inexistente.
    await obtenerOportunidadPorId(idValido);

    return crmDTO.lista(await crmModel.obtenerSeguimientos(idValido), crmDTO.seguimientoDTO);
}

async function crearSeguimiento(idOportunidad, seguimiento) {
    const idValido = validarId(
        idOportunidad,
        "ID de la oportunidad"
    );

    validarCamposObligatorios(seguimiento, [
        "tipo",
        "descripcion"
    ]);

    await obtenerOportunidadPorId(idValido);

    if (seguimiento.fecha) {
        const fecha = new Date(seguimiento.fecha);

        if (Number.isNaN(fecha.getTime())) {
            throw new Error("La fecha del seguimiento no es válida.");
        }
    }

    if (seguimiento.proxima_fecha_contacto) {
        const fecha = new Date(seguimiento.proxima_fecha_contacto);

        if (Number.isNaN(fecha.getTime())) {
            throw new Error("La próxima fecha de contacto no es válida.");
        }
    }

    return crmDTO.seguimientoDTO(await crmModel.crearSeguimiento(
        idValido,
        seguimiento
    ));
}

// =====================================================
// EXPORTACIONES
// Se mantienen los nombres que usa crm.controller.js
// =====================================================

module.exports = {
    // Clientes
    obtenerClientes,
    obtenerClientePorId,
    crearCliente,
    actualizarCliente,
    cambiarEstadoCliente,

    // Responsables
    obtenerResponsables,

    // Leads
    obtenerLeads,
    obtenerLeadPorId,
    crearLead,
    actualizarLead,
    cambiarEstadoLead,
    convertirLeadACliente,

    // Oportunidades
    obtenerOportunidades,
    obtenerOportunidadPorId,
    crearOportunidad,
    actualizarOportunidad,
    cambiarEtapaOportunidad,

    // Seguimientos
    obtenerSeguimientos,
    crearSeguimiento
};
