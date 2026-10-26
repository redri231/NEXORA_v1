const logger = require("../config/logger");
const service = require("../services/cotizaciones.service");

async function listar(req, res) {
    try {
        res.json({ success: true, data: await service.listar(req.validatedQuery) });
    } catch (error) {
        logger.error({ err: error }, "Error listando cotizaciones:");
        res.status(500).json({ success: false, mensaje: "No se pudieron obtener las cotizaciones." });
    }
}

async function obtener(req, res) {
    try {
        const data = await service.obtenerPorId(req.validatedParams.id);
        if (!data) return res.status(404).json({ success: false, mensaje: "Cotización no encontrada." });
        res.json({ success: true, data });
    } catch (error) {
        logger.error({ err: error }, "Error obteniendo cotización:");
        res.status(500).json({ success: false, mensaje: "No se pudo obtener la cotización." });
    }
}

async function crear(req, res) {
    try {
        res.status(201).json({ success: true, mensaje: "Cotización creada correctamente.", data: await service.crear(req.body) });
    } catch (error) {
        logger.error({ err: error }, "Error creando cotización:");
        const status = ["CLIENTE_NOT_FOUND", "RESPONSABLE_NOT_FOUND", "OPORTUNIDAD_INVALIDA", "SERVICIO_INVALIDO"].includes(error.code) ? 400 : 500;
        res.status(status).json({ success: false, mensaje: error.message || "No se pudo crear la cotización." });
    }
}

async function actualizar(req, res) {
    try {
        const data = await service.actualizar(req.validatedParams.id, req.body);
        if (!data) return res.status(404).json({ success: false, mensaje: "Cotización no encontrada." });
        res.json({ success: true, mensaje: "Cotización actualizada correctamente.", data });
    } catch (error) {
        logger.error({ err: error }, "Error actualizando cotización:");
        if (error.code === "COTIZACION_VINCULADA_VENTA") return res.status(409).json({ success: false, mensaje: error.message });
        const status = ["CLIENTE_NOT_FOUND", "RESPONSABLE_NOT_FOUND", "OPORTUNIDAD_INVALIDA", "SERVICIO_INVALIDO"].includes(error.code) ? 400 : 500;
        res.status(status).json({ success: false, mensaje: error.message || "No se pudo actualizar la cotización." });
    }
}

async function cambiarEstado(req, res) {
    try {
        const data = await service.cambiarEstado(req.validatedParams.id, req.body.estado);
        if (!data) return res.status(404).json({ success: false, mensaje: "Cotización no encontrada." });
        res.json({ success: true, mensaje: "Estado de la cotización actualizado.", data });
    } catch (error) {
        logger.error({ err: error }, "Error cambiando estado de cotización:");
        if (["COTIZACION_VINCULADA_VENTA", "TRANSICION_INVALIDA", "COTIZACION_VENCIDA", "TRANSICION_CONFLICTO"].includes(error.code)) {
            return res.status(409).json({ success: false, mensaje: error.message });
        }
        res.status(500).json({ success: false, mensaje: "No se pudo cambiar el estado." });
    }
}

async function listarServicios(req, res) {
    try { res.json({ success: true, data: await service.listarServicios() }); }
    catch (error) {
        logger.error({ err: error }, "Error listando servicios de cotización:");
        res.status(500).json({ success: false, mensaje: "No se pudieron obtener los servicios." });
    }
}

module.exports = { listar, obtener, crear, actualizar, cambiarEstado, listarServicios };
