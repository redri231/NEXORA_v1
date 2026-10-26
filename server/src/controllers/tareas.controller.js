const logger = require("../config/logger");
const service = require("../services/tareas.service");

async function listar(req, res) {
    try { res.json({ success: true, data: await service.listar(req.validatedQuery) }); }
    catch (error) { logger.error({ err: error }, "Error listando tareas:"); res.status(500).json({ success: false, mensaje: "No se pudieron obtener las tareas." }); }
}

async function obtener(req, res) {
    try {
        const data = await service.obtener(req.validatedParams.id);
        if (!data) return res.status(404).json({ success: false, mensaje: "Tarea no encontrada." });
        res.json({ success: true, data });
    } catch (error) { res.status(500).json({ success: false, mensaje: "No se pudo obtener la tarea." }); }
}

async function catalogos(req, res) {
    try { res.json({ success: true, data: await service.catalogos() }); }
    catch (error) { logger.error({ err: error }, "Error cargando catálogos de tareas:"); res.status(500).json({ success: false, mensaje: "No se pudieron cargar los catálogos." }); }
}

async function crear(req, res) {
    try { res.status(201).json({ success: true, mensaje: "Tarea creada correctamente.", data: await service.crear(req.body) }); }
    catch (error) {
        logger.error({ err: error }, "Error creando tarea:");
        const status = error.code === "23503" ? 400 : 500;
        res.status(status).json({ success: false, mensaje: "No se pudo crear la tarea; verifica el proyecto y responsable seleccionados." });
    }
}

async function actualizar(req, res) {
    try {
        const data = await service.actualizar(req.validatedParams.id, req.body);
        if (!data) return res.status(404).json({ success: false, mensaje: "Tarea no encontrada." });
        res.json({ success: true, mensaje: "Tarea actualizada correctamente.", data });
    } catch (error) {
        const status = error.code === "23503" ? 400 : 500;
        res.status(status).json({ success: false, mensaje: "No se pudo actualizar la tarea." });
    }
}

async function cambiarEstado(req, res) {
    try {
        const data = await service.cambiarEstado(req.validatedParams.id, req.body.estado);
        if (!data) return res.status(404).json({ success: false, mensaje: "Tarea no encontrada." });
        res.json({ success: true, mensaje: "Estado de la tarea actualizado.", data });
    } catch (error) { res.status(500).json({ success: false, mensaje: "No se pudo actualizar el estado de la tarea." }); }
}

module.exports = { listar, obtener, catalogos, crear, actualizar, cambiarEstado };
