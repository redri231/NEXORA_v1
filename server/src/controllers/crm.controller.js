const crmService = require("../services/crm.service");


// ============================================================
// CLIENTES
// ============================================================

async function listarClientes(req, res) {

    try {

        const clientes =
            await crmService.obtenerClientes();

        res.json({
            success: true,
            data: clientes
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            mensaje: "Error al obtener clientes"
        });

    }

}


async function obtenerCliente(req, res) {

    try {

        const cliente =
            await crmService.obtenerClientePorId(
                req.validatedParams.id
            );

        if (!cliente) {

            return res.status(404).json({
                success: false,
                mensaje: "Cliente no encontrado"
            });

        }

        res.json({
            success: true,
            data: cliente
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            mensaje: "Error al obtener cliente"
        });

    }

}


async function crearCliente(req, res) {

    try {

        const cliente =
            await crmService.crearCliente(
                req.body
            );

        res.status(201).json({
            success: true,
            mensaje: "Cliente creado correctamente",
            data: cliente
        });

    } catch (error) {

        console.error(error);

        if (error.code === "23505") {

            return res.status(409).json({
                success: false,
                mensaje: "El número de documento ya está registrado"
            });

        }

        res.status(500).json({
            success: false,
            mensaje: "Error al crear cliente"
        });

    }

}


async function actualizarCliente(req, res) {

    try {

        const cliente =
            await crmService.actualizarCliente(
                req.validatedParams.id,
                req.body
            );

        if (!cliente) {

            return res.status(404).json({
                success: false,
                mensaje: "Cliente no encontrado"
            });

        }

        res.json({
            success: true,
            mensaje: "Cliente actualizado correctamente",
            data: cliente
        });

    } catch (error) {

        console.error(error);

        if (error.code === "23505") {

            return res.status(409).json({
                success: false,
                mensaje: "El número de documento ya está registrado"
            });

        }

        res.status(500).json({
            success: false,
            mensaje: "Error al actualizar cliente"
        });

    }

}


async function desactivarCliente(req, res) {

    try {

        const cliente =
            await crmService.cambiarEstadoCliente(
                req.validatedParams.id,
                "Inactivo"
            );

        if (!cliente) {

            return res.status(404).json({
                success: false,
                mensaje: "Cliente no encontrado"
            });

        }

        res.json({
            success: true,
            mensaje: "Cliente desactivado correctamente",
            data: cliente
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            mensaje: "Error al desactivar cliente"
        });

    }

}


// ============================================================
// RESPONSABLES
// ============================================================

async function listarResponsables(req, res) {

    try {

        const responsables =
            await crmService.obtenerResponsables();

        res.json({
            success: true,
            data: responsables
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            mensaje: "Error al obtener responsables"
        });

    }

}

// ============================================================
// Leads kanba
// ============================================================

async function listarLeads(req, res) {
    try {
        const leads = await crmService.obtenerLeads();

        res.json({
            success: true,
            data: leads
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            mensaje: "Error al obtener leads"
        });
    }
}


async function obtenerLead(req, res) {
    try {
        const lead = await crmService.obtenerLeadPorId(
            req.validatedParams.id
        );

        if (!lead) {
            return res.status(404).json({
                success: false,
                mensaje: "Lead no encontrado"
            });
        }

        res.json({
            success: true,
            data: lead
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            mensaje: "Error al obtener lead"
        });
    }
}


async function crearLead(req, res) {
    try {
        const lead = await crmService.crearLead(req.body);

        res.status(201).json({
            success: true,
            mensaje: "Lead creado correctamente",
            data: lead
        });

    } catch (error) {
        console.error(error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                mensaje: "El número de documento ya está registrado"
            });
        }

        res.status(500).json({
            success: false,
            mensaje: "Error al crear lead"
        });
    }
}


async function actualizarLead(req, res) {
    try {
        const lead = await crmService.actualizarLead(
            req.validatedParams.id,
            req.body
        );

        if (!lead) {
            return res.status(404).json({
                success: false,
                mensaje: "Lead no encontrado"
            });
        }

        res.json({
            success: true,
            mensaje: "Lead actualizado correctamente",
            data: lead
        });

    } catch (error) {
        console.error(error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                mensaje: "El número de documento ya está registrado"
            });
        }

        if (error.code === "LEAD_ALREADY_CONVERTED") {
            return res.status(409).json({ success: false, mensaje: error.message });
        }

        res.status(500).json({
            success: false,
            mensaje: "Error al actualizar lead"
        });
    }
}


async function cambiarEstadoLead(req, res) {
    try {
        const lead = await crmService.cambiarEstadoLead(
            req.validatedParams.id,
            req.body.estado_pipeline
        );

        if (!lead) {
            return res.status(404).json({
                success: false,
                mensaje: "Lead no encontrado"
            });
        }

        res.json({
            success: true,
            mensaje: "Etapa del lead actualizada correctamente",
            data: lead
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            mensaje: "Error al cambiar etapa del lead"
        });
    }
}

async function convertirLead(req, res) {
    try {
        const data = await crmService.convertirLeadACliente(
            req.validatedParams.id,
            req.body
        );

        return res.status(201).json({
            success: true,
            mensaje: `Lead convertido. Se actualizaron ${data.oportunidades_actualizadas} oportunidades.`,
            data
        });
    } catch (error) {
        console.error("Error al convertir lead:", error);

        if (error.code === "LEAD_NOT_FOUND") {
            return res.status(404).json({ success: false, mensaje: error.message });
        }
        if (["LEAD_ALREADY_CONVERTED", "LEAD_CANNOT_CONVERT"].includes(error.code)) {
            return res.status(409).json({ success: false, mensaje: error.message });
        }
        if (error.code === "23505") {
            return res.status(409).json({ success: false, mensaje: "El número de documento ya está registrado." });
        }
        if (error.code === "23503") {
            return res.status(400).json({ success: false, mensaje: "El responsable seleccionado no existe." });
        }

        return res.status(500).json({ success: false, mensaje: "No se pudo convertir el lead." });
    }
}

// ============================================================
// OPORTUNIDADES
// ============================================================

async function listarOportunidades(req, res) {
    try {
        const data = await crmService.obtenerOportunidades();

        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error("Error al obtener oportunidades:", error);

        res.status(500).json({
            success: false,
            mensaje: "Error al obtener oportunidades"
        });
    }
}


async function obtenerOportunidad(req, res) {
    try {
        const data = await crmService.obtenerOportunidadPorId(
            req.validatedParams.id
        );

        if (!data) {
            return res.status(404).json({
                success: false,
                mensaje: "Oportunidad no encontrada"
            });
        }

        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error("Error al obtener oportunidad:", error);

        res.status(500).json({
            success: false,
            mensaje: "Error al obtener oportunidad"
        });
    }
}


async function registrarOportunidad(req, res) {
    try {
        const data = await crmService.crearOportunidad(
            req.body
        );

        res.status(201).json({
            success: true,
            data
        });

    } catch (error) {
        console.error("Error al crear oportunidad:", error);

        res.status(400).json({
            success: false,
            mensaje: error.message
        });
    }
}


async function editarOportunidad(req, res) {
    try {
        const data = await crmService.actualizarOportunidad(
            req.validatedParams.id,
            req.body
        );

        if (!data) {
            return res.status(404).json({
                success: false,
                mensaje: "Oportunidad no encontrada"
            });
        }

        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error("Error al actualizar oportunidad:", error);

        res.status(400).json({
            success: false,
            mensaje: error.message
        });
    }
}


async function actualizarEtapaOportunidad(req, res) {
    try {
        const { etapa } = req.body;

        if (!etapa) {
            return res.status(400).json({
                success: false,
                mensaje: "La etapa es obligatoria"
            });
        }

        const data = await crmService.cambiarEtapaOportunidad(
            req.validatedParams.id,
            etapa
        );

        if (!data) {
            return res.status(404).json({
                success: false,
                mensaje: "Oportunidad no encontrada"
            });
        }

        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error("Error al cambiar etapa:", error);

        res.status(400).json({
            success: false,
            mensaje: error.message
        });
    }
}


// ============================================================
// SEGUIMIENTOS
// ============================================================

async function listarSeguimientos(req, res) {
    try {
        const data = await crmService.obtenerSeguimientos(
            req.validatedParams.id
        );

        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error("Error al obtener seguimientos:", error);

        res.status(500).json({
            success: false,
            mensaje: "Error al obtener seguimientos"
        });
    }
}


async function registrarSeguimiento(req, res) {
    try {
        const data = await crmService.crearSeguimiento(
            req.validatedParams.id,
            req.body
        );

        res.status(201).json({
            success: true,
            data
        });

    } catch (error) {
        console.error("Error al crear seguimiento:", error);

        res.status(400).json({
            success: false,
            mensaje: error.message
        });
    }
}


module.exports = {

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

};
