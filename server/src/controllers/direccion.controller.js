const logger = require("../config/logger");
const service = require("../services/direccion.service");

async function resumen(req, res) {
    try {
        const soloEquipo = req.usuario?.rol === "Operaciones";
        res.json({ success: true, data: await service.obtenerResumen({ soloEquipo }) });
    } catch (error) {
        logger.error({ err: error }, "Error al cargar el resumen de dirección:");
        res.status(500).json({ success: false, mensaje: "No se pudo cargar el panel de dirección." });
    }
}

module.exports = { resumen };
