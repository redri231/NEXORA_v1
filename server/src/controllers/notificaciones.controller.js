const logger = require("../config/logger");
const service = require("../services/notificaciones.service");

async function listar(req, res) {
    try {
        const data = await service.listar(req.usuario.id_usuario);
        res.json({ success: true, data });
    } catch (error) {
        logger.error({ err: error }, "Error al listar notificaciones:");
        res.status(500).json({ success: false, mensaje: "No se pudieron cargar las notificaciones." });
    }
}

async function marcarLeida(req, res) {
    try {
        const marcada = await service.marcarLeida(req.validatedParams.id, req.usuario.id_usuario);
        if (!marcada) return res.status(404).json({ success: false, mensaje: "Notificación no encontrada." });
        res.json({ success: true, mensaje: "Notificación marcada como leída." });
    } catch (error) {
        logger.error({ err: error }, "Error al marcar notificación:");
        res.status(500).json({ success: false, mensaje: "No se pudo actualizar la notificación." });
    }
}

async function marcarTodasLeidas(req, res) {
    try {
        const cantidad = await service.marcarTodasLeidas(req.usuario.id_usuario);
        res.json({ success: true, data: { cantidad }, mensaje: "Notificaciones marcadas como leídas." });
    } catch (error) {
        logger.error({ err: error }, "Error al marcar todas las notificaciones:");
        res.status(500).json({ success: false, mensaje: "No se pudieron actualizar las notificaciones." });
    }
}

module.exports = { listar, marcarLeida, marcarTodasLeidas };
