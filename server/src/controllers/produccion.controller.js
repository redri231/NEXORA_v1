const service = require("../services/produccion.service");

async function listarTablero(req, res) {
    try { res.json({ success: true, data: await service.listarTablero(req.validatedQuery) }); }
    catch (error) { console.error("Error listando órdenes de producción:", error); res.status(500).json({ success: false, mensaje: "No se pudieron obtener las órdenes de trabajo." }); }
}

async function listarHistorial(req, res) {
    try { res.json({ success: true, data: await service.listarHistorial(req.validatedQuery) }); }
    catch (error) { console.error("Error consultando historial de órdenes finalizadas:", error); res.status(500).json({ success: false, mensaje: "No se pudo obtener el historial." }); }
}

async function obtener(req, res) {
    try {
        const data = await service.obtener(req.validatedParams.id);
        if (!data) return res.status(404).json({ success: false, mensaje: "Orden de trabajo no encontrada." });
        res.json({ success: true, data });
    } catch (error) { console.error("Error obteniendo orden de trabajo:", error); res.status(500).json({ success: false, mensaje: "No se pudo obtener la orden." }); }
}

async function catalogos(req, res) {
    try { res.json({ success: true, data: await service.catalogos() }); }
    catch (error) { console.error("Error cargando catálogos de producción:", error); res.status(500).json({ success: false, mensaje: "No se pudieron cargar proyectos, servicios y responsables." }); }
}

async function crear(req, res) {
    try {
        res.status(201).json({ success: true, mensaje: "Orden de trabajo creada.", data: await service.crear(req.body, req.usuario.id_usuario) });
    } catch (error) {
        console.error("Error creando orden de trabajo:", error);
        const status = error.code === "23503" ? 400 : 500;
        res.status(status).json({ success: false, mensaje: status === 400 ? "Verifica el proyecto, servicio y responsable seleccionados." : "No se pudo crear la orden de trabajo." });
    }
}

async function cambiarEtapa(req, res) {
    try {
        const data = await service.cambiarEtapa(req.validatedParams.id, req.body.estado_flujo, req.body.comentario, req.usuario.id_usuario);
        if (!data) return res.status(404).json({ success: false, mensaje: "Orden de trabajo no encontrada." });
        res.json({ success: true, mensaje: "Etapa de producción actualizada.", data });
    } catch (error) {
        if (error.code === "TRANSICION_INVALIDA") return res.status(409).json({ success: false, mensaje: error.message });
        console.error("Error cambiando etapa de orden:", error);
        res.status(500).json({ success: false, mensaje: "No se pudo actualizar la etapa de la orden." });
    }
}

async function resumen(req, res) {
    try { res.json({ success: true, data: await service.resumen() }); }
    catch (error) { console.error("Error obteniendo resumen de producción:", error); res.status(500).json({ success: false, mensaje: "No se pudo obtener el resumen de producción." }); }
}

module.exports = { listarTablero, listarHistorial, obtener, catalogos, crear, cambiarEtapa, resumen };
