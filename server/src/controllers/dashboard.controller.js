const logger = require("../config/logger");
const service = require("../services/dashboard.service");

async function resumen(req, res) {
    try { return res.json({ success: true, data: await service.obtenerResumen(req.usuario) }); }
    catch (error) {
        logger.error({ err: error }, "Error al cargar Dashboard:");
        return res.status(500).json({ success: false, mensaje: "No se pudo cargar el Dashboard." });
    }
}

module.exports = { resumen };
