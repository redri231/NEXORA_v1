const service = require("../services/proyectos.service");

async function listar(req, res) {
    try { res.json({ success: true, data: await service.listar(req.validatedQuery) }); }
    catch (error) { console.error("Error listando proyectos:", error); res.status(500).json({ success: false, mensaje: "No se pudieron obtener los proyectos." }); }
}

async function obtener(req, res) {
    try {
        const data = await service.obtener(req.validatedParams.id);
        if (!data) return res.status(404).json({ success: false, mensaje: "Proyecto no encontrado." });
        res.json({ success: true, data });
    } catch (error) { console.error("Error obteniendo proyecto:", error); res.status(500).json({ success: false, mensaje: "No se pudo obtener el proyecto." }); }
}

async function catalogos(req, res) {
    try { res.json({ success: true, data: await service.catalogos() }); }
    catch (error) { console.error("Error cargando catálogos de proyectos:", error); res.status(500).json({ success: false, mensaje: "No se pudieron cargar los catálogos." }); }
}

async function resumen(req, res) {
    try { res.json({ success: true, data: await service.resumen() }); }
    catch (error) { console.error("Error obteniendo resumen de proyectos y tareas:", error); res.status(500).json({ success: false, mensaje: "No se pudo obtener el resumen del equipo." }); }
}

async function crear(req, res) {
    try { res.status(201).json({ success: true, mensaje: "Proyecto creado correctamente.", data: await service.crear(req.body) }); }
    catch (error) {
        console.error("Error creando proyecto:", error);
        const status = ["COTIZACION_PROYECTO_INVALIDA", "23503"].includes(error.code) ? 400 : 500;
        res.status(status).json({ success: false, mensaje: error.message || "No se pudo crear el proyecto." });
    }
}

async function actualizar(req, res) {
    try {
        const data = await service.actualizar(req.validatedParams.id, req.body);
        if (!data) return res.status(404).json({ success: false, mensaje: "Proyecto no encontrado." });
        res.json({ success: true, mensaje: "Proyecto actualizado correctamente.", data });
    } catch (error) {
        if (error.code === "PROYECTO_NO_EDITABLE") return res.status(409).json({ success: false, mensaje: error.message });
        const status = ["COTIZACION_PROYECTO_INVALIDA", "23503"].includes(error.code) ? 400 : 500;
        res.status(status).json({ success: false, mensaje: error.message || "No se pudo actualizar el proyecto." });
    }
}

async function cambiarEstado(req, res) {
    try {
        const data = await service.cambiarEstado(req.validatedParams.id, req.body.estado);
        if (!data) return res.status(404).json({ success: false, mensaje: "Proyecto no encontrado." });
        res.json({ success: true, mensaje: "Estado del proyecto actualizado.", data });
    } catch (error) {
        if (error.code === "TRANSICION_INVALIDA") return res.status(409).json({ success: false, mensaje: error.message });
        res.status(500).json({ success: false, mensaje: "No se pudo actualizar el estado del proyecto." });
    }
}

module.exports = { listar, obtener, catalogos, resumen, crear, actualizar, cambiarEstado };
