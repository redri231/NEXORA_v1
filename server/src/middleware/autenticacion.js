const logger = require("../config/logger");
const authService = require("../services/auth.service");

async function requerirAutenticacion(req, res, next) {
    const encabezado = req.get("authorization") || "";
    const coincidencia = encabezado.match(/^Bearer\s+(.+)$/i);

    if (!coincidencia) {
        return res.status(401).json({ success: false, mensaje: "Inicia sesión para continuar." });
    }

    try {
        const usuario = await authService.obtenerSesion(coincidencia[1]);
        if (!usuario) {
            return res.status(401).json({ success: false, mensaje: "La sesión venció o la cuenta está inactiva." });
        }

        req.usuario = usuario;
        return next();
    } catch (error) {
        logger.error({ err: error }, "Error al validar sesión:");
        return res.status(500).json({ success: false, mensaje: "No se pudo validar la sesión." });
    }
}

module.exports = requerirAutenticacion;
