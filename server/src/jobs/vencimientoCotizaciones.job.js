const cotizacionesService = require("../services/cotizaciones.service");

const INTERVALO_MS = 60 * 1000;

function iniciarVencimientoCotizaciones() {
    let ejecutando = false;

    const revisar = async () => {
        if (ejecutando) return;
        ejecutando = true;
        try {
            const actualizadas = await cotizacionesService.marcarVencidas();
            if (actualizadas > 0) console.info(`Cotizaciones vencidas actualizadas: ${actualizadas}`);
        } catch (error) {
            console.error("No se pudo actualizar el estado de cotizaciones vencidas:", error.message);
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
