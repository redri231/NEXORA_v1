const express = require("express");

const router = express.Router();
const validarSolicitud = require("../middleware/validarSolicitud");
const {
    clienteSchema,
    leadSchema,
    actualizarLeadSchema,
    oportunidadSchema,
    etapaOportunidadSchema,
    etapaLeadSchema,
    conversionLeadSchema,
    seguimientoSchema,
    idParamsSchema
} = require("../validators/crm.schemas");

const {
    // CLIENTES
    listarClientes,
    obtenerCliente,
    crearCliente,
    actualizarCliente,
    desactivarCliente,

    // RESPONSABLES
    listarResponsables,

    // LEADS
    listarLeads,
    obtenerLead,
    crearLead,
    actualizarLead,
    cambiarEstadoLead,
    convertirLead,

    // OPORTUNIDADES
    listarOportunidades,
    obtenerOportunidad,
    registrarOportunidad,
    editarOportunidad,
    actualizarEtapaOportunidad,

    // SEGUIMIENTOS
    listarSeguimientos,
    registrarSeguimiento

} = require("../controllers/crm.controller");


// ============================================================
// CLIENTES
// ============================================================

router.get(
    "/clientes",
    listarClientes
);

router.get(
    "/clientes/:id",
    validarSolicitud({ params: idParamsSchema }),
    obtenerCliente
);

router.post(
    "/clientes",
    validarSolicitud({ body: clienteSchema }),
    crearCliente
);

router.put(
    "/clientes/:id",
    validarSolicitud({ params: idParamsSchema, body: clienteSchema }),
    actualizarCliente
);

router.delete(
    "/clientes/:id",
    validarSolicitud({ params: idParamsSchema }),
    desactivarCliente
);


// ============================================================
// RESPONSABLES
// ============================================================

router.get(
    "/responsables",
    listarResponsables
);


// ============================================================
// LEADS
// ============================================================

router.get(
    "/leads",
    listarLeads
);

router.get(
    "/leads/:id",
    validarSolicitud({ params: idParamsSchema }),
    obtenerLead
);

router.post(
    "/leads",
    validarSolicitud({ body: leadSchema }),
    crearLead
);

router.put(
    "/leads/:id",
    validarSolicitud({ params: idParamsSchema, body: actualizarLeadSchema }),
    actualizarLead
);

router.patch(
    "/leads/:id/etapa",
    validarSolicitud({ params: idParamsSchema, body: etapaLeadSchema }),
    cambiarEstadoLead
);

router.post(
    "/leads/:id/convertir",
    validarSolicitud({ params: idParamsSchema, body: conversionLeadSchema }),
    convertirLead
);


// ============================================================
// OPORTUNIDADES
// ============================================================

router.get(
    "/oportunidades",
    listarOportunidades
);

router.get(
    "/oportunidades/:id",
    validarSolicitud({ params: idParamsSchema }),
    obtenerOportunidad
);

router.post(
    "/oportunidades",
    validarSolicitud({ body: oportunidadSchema }),
    registrarOportunidad
);

router.put(
    "/oportunidades/:id",
    validarSolicitud({ params: idParamsSchema, body: oportunidadSchema }),
    editarOportunidad
);

router.patch(
    "/oportunidades/:id/etapa",
    validarSolicitud({ params: idParamsSchema, body: etapaOportunidadSchema }),
    actualizarEtapaOportunidad
);


// ============================================================
// SEGUIMIENTOS DE OPORTUNIDADES
// ============================================================

router.get(
    "/oportunidades/:id/seguimientos",
    validarSolicitud({ params: idParamsSchema }),
    listarSeguimientos
);

router.post(
    "/oportunidades/:id/seguimientos",
    validarSolicitud({ params: idParamsSchema, body: seguimientoSchema }),
    registrarSeguimiento
);


module.exports = router;
