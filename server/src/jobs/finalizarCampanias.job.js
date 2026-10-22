const service = require("../services/campanias.service");

const INTERVALO_MS = 60 * 60 * 1000;

function iniciarFinalizacionCampanias() {
    let ejecutando = false;
    const revisar = async () => {
        if (ejecutando) return;
        ejecutando = true;
        try {
            const actualizadas = await service.marcarFinalizadas();
            if (actualizadas > 0) console.info(`Campañas finalizadas por fecha: ${actualizadas}`);
        } catch (error) {
            console.error("No se pudo finalizar campañas vencidas:", error.message);
        } finally { ejecutando = false; }
    };
    void revisar();
    const temporizador = setInterval(revisar, INTERVALO_MS);
    temporizador.unref();
    return temporizador;
}

module.exports = iniciarFinalizacionCampanias;
