const logger = require("../config/logger");
const service = require("../services/campanias.service");

async function listar(req, res) {
    try { res.json({ success: true, data: await service.listar(req.validatedQuery) }); }
    catch (error) { logger.error({ err: error }, "Error listando campañas:"); res.status(500).json({ success: false, mensaje: "No se pudieron obtener las campañas." }); }
}

async function obtener(req, res) {
    try {
        const data = await service.obtenerPorId(req.validatedParams.id);
        if (!data) return res.status(404).json({ success: false, mensaje: "Campaña no encontrada." });
        res.json({ success: true, data });
    } catch (error) { logger.error({ err: error }, "Error obteniendo campaña:"); res.status(500).json({ success: false, mensaje: "No se pudo obtener la campaña." }); }
}

async function catalogos(req, res) {
    try { res.json({ success: true, data: await service.catalogos() }); }
    catch (error) { logger.error({ err: error }, "Error obteniendo catálogos de campañas:"); res.status(500).json({ success: false, mensaje: "No se pudieron obtener clientes, usuarios y proyectos." }); }
}

async function crear(req, res) {
    try { res.status(201).json({ success: true, mensaje: "Campaña creada correctamente.", data: await service.crear(req.body) }); }
    catch (error) {
        logger.error({ err: error }, "Error creando campaña:");
        const status = error.code === "PROYECTO_CLIENTE_INVALIDO" ? 400 : error.code === "23503" ? 400 : 500;
        res.status(status).json({ success: false, mensaje: error.message || "No se pudo crear la campaña." });
    }
}

async function actualizar(req, res) {
    try {
        const data = await service.actualizar(req.validatedParams.id, req.body);
        if (!data) return res.status(404).json({ success: false, mensaje: "Campaña no encontrada." });
        res.json({ success: true, mensaje: "Campaña actualizada correctamente.", data });
    } catch (error) {
        if (error.code === "CAMPANIA_NO_EDITABLE") return res.status(409).json({ success: false, mensaje: error.message });
        const status = error.code === "PROYECTO_CLIENTE_INVALIDO" || error.code === "23503" ? 400 : 500;
        res.status(status).json({ success: false, mensaje: error.message || "No se pudo actualizar la campaña." });
    }
}

async function cambiarEstado(req, res) {
    try {
        const data = await service.cambiarEstado(req.validatedParams.id, req.body.estado);
        if (!data) return res.status(404).json({ success: false, mensaje: "Campaña no encontrada." });
        res.json({ success: true, mensaje: "Estado actualizado.", data });
    } catch (error) {
        if (error.code === "TRANSICION_INVALIDA") return res.status(409).json({ success: false, mensaje: error.message });
        res.status(500).json({ success: false, mensaje: "No se pudo actualizar el estado de la campaña." });
    }
}

async function resumen(req, res) {
    try { res.json({ success: true, data: await service.resumenRoi() }); }
    catch (error) { logger.error({ err: error }, "Error obteniendo resumen de campañas:"); res.status(500).json({ success: false, mensaje: "No se pudo obtener el resumen de campañas." }); }
}

async function registrarIndicador(req, res) {
    try {
        const data = await service.registrarIndicador(req.validatedParams.id, req.body);
        if (!data) return res.status(404).json({ success: false, mensaje: "Campaña no encontrada." });
        res.status(201).json({ success: true, mensaje: "Medición registrada.", data });
    } catch (error) {
        logger.error({ err: error }, "Error registrando indicador de campaña:");
        res.status(500).json({ success: false, mensaje: "No se pudo registrar la medición." });
    }
}

async function listarProductosMaterial(req, res) {
    try { res.json({ success: true, data: await service.listarProductosMaterial() }); }
    catch (error) { logger.error({ err: error }, "Error listando productos para campañas:"); res.status(500).json({ success: false, mensaje: "No se pudieron obtener los materiales." }); }
}

async function listarSolicitudesMaterial(req, res) {
    try { res.json({ success: true, data: await service.listarSolicitudesMaterial(req.validatedParams.id) }); }
    catch (error) { logger.error({ err: error }, "Error listando solicitudes de campaña:"); res.status(500).json({ success: false, mensaje: "No se pudieron obtener las solicitudes." }); }
}

async function crearSolicitudMaterial(req, res) {
    try {
        const data = await service.crearSolicitudMaterial(req.validatedParams.id, req.usuario.id_usuario, req.body);
        if (!data) return res.status(404).json({ success: false, mensaje: "Campaña no encontrada." });
        res.status(201).json({ success: true, mensaje: "Solicitud enviada a almacén.", data });
    } catch (error) {
        logger.error({ err: error }, "Error creando solicitud de material:");
        const status = error.code === "23503" ? 400 : 500;
        res.status(status).json({ success: false, mensaje: "No se pudo registrar la solicitud." });
    }
}

module.exports = { listar, obtener, catalogos, crear, actualizar, cambiarEstado, registrarIndicador, listarProductosMaterial, listarSolicitudesMaterial, crearSolicitudMaterial, resumen };
