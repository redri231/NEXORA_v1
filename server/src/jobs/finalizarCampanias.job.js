const logger = require("../config/logger");
const service = require("../services/campanias.service");

const INTERVALO_MS = 60 * 60 * 1000;

function iniciarFinalizacionCampanias() {
    let ejecutando = false;
    const revisar = async () => {
        if (ejecutando) return;
        ejecutando = true;
        try {
            const actualizadas = await service.marcarFinalizadas();
            if (actualizadas > 0) logger.info({ actualizadas }, "Campañas finalizadas por fecha");
        } catch (error) {
            logger.error({ err: error }, "No se pudo finalizar campañas vencidas");
        } finally { ejecutando = false; }
    };
    void revisar();
    const temporizador = setInterval(revisar, INTERVALO_MS);
    temporizador.unref();
    return temporizador;
}

module.exports = iniciarFinalizacionCampanias;
