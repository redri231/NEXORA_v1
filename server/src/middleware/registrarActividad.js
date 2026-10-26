const logger = require("../config/logger");
const auditoriaService = require("../services/auditoria.service");

function registrarActividad(req, res, next) {
    const responderJson = res.json.bind(res);
    res.json = (respuesta) => {
        const resultado = responderJson(respuesta);
        const generaReporte = req.method === "GET" && req.baseUrl === "/api/reportes"
            && req.route?.path === "/vista-previa";
        if ((["POST", "PUT", "PATCH", "DELETE"].includes(req.method) || generaReporte)
            && res.statusCode >= 200 && res.statusCode < 300
            && respuesta?.success !== false) {
            auditoriaService.registrar(req, respuesta).catch((error) => {
                logger.error({ err: error }, "No se pudo registrar la actividad en bitácora:");
            });
        }
        return resultado;
    };
    next();
}

module.exports = registrarActividad;
