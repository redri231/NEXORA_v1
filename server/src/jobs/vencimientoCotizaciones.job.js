const logger = require("../config/logger");
const cotizacionesService = require("../services/cotizaciones.service");

const INTERVALO_MS = 60 * 1000;

function iniciarVencimientoCotizaciones() {
    let ejecutando = false;

    const revisar = async () => {
        if (ejecutando) return;
        ejecutando = true;
        try {
            const actualizadas = await cotizacionesService.marcarVencidas();
            if (actualizadas > 0) logger.info({ actualizadas }, "Cotizaciones vencidas actualizadas");
        } catch (error) {
            logger.error({ err: error }, "No se pudo actualizar el estado de cotizaciones vencidas");
        } finally {
            ejecutando = false;
        }
    };

    void revisar();
    const temporizador = setInterval(revisar, INTERVALO_MS);
    temporizador.unref();
    return temporizador;
}

module.exports = iniciarVencimientoCotizaciones;
