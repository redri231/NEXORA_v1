const proyectosService = require("../services/proyectos.service");

const INTERVALO_MS = 60 * 60 * 1000;

function iniciarActualizacionProyectosAtrasados() {
    let ejecutando = false;
    const revisar = async () => {
        if (ejecutando) return;
        ejecutando = true;
        try {
            const actualizados = await proyectosService.marcarAtrasados();
            if (actualizados > 0) console.info(`Proyectos marcados como atrasados: ${actualizados}`);
        } catch (error) { console.error("No se pudieron actualizar los proyectos atrasados:", error.message); }
        finally { ejecutando = false; }
    };
    void revisar();
    const timer = setInterval(revisar, INTERVALO_MS);
    timer.unref();
    return timer;
}

module.exports = iniciarActualizacionProyectosAtrasados;
