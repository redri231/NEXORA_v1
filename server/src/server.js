require("dotenv").config({ quiet: true });
const logger = require("./config/logger");

const app = require("./app");
const pool = require("./config/database");
const authService = require("./services/auth.service");
const iniciarVencimientoCotizaciones = require("./jobs/vencimientoCotizaciones.job");
const iniciarFinalizacionCampanias = require("./jobs/finalizarCampanias.job");
const iniciarActualizacionProyectosAtrasados = require("./jobs/actualizarProyectosAtrasados.job");
const iniciarVencimientoPagos = require("./jobs/vencimientoPagos.job");
const { crearAdminInicial } = require("./services/adminInicial.service");

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {

    try {
        authService.validarConfiguracion();
    } catch (error) {
        logger.error({ err: error }, "Configuración de autenticación inválida");
        process.exitCode = 1;
        return;
    }

    try {

        await pool.query("SELECT NOW()");

        iniciarVencimientoCotizaciones();
        iniciarFinalizacionCampanias();
        iniciarActualizacionProyectosAtrasados();
        iniciarVencimientoPagos();

        logger.info({ database: "postgresql" }, "Conexión a PostgreSQL funcionando");

        await crearAdminInicial();

        app.listen(PORT, () => {
            logger.info({ port: PORT }, "NEXORA está escuchando");
        });

    } catch (error) {

        logger.error({ err: error }, "No se pudo iniciar el servidor por un error de PostgreSQL");
        process.exitCode = 1;

    }
}

iniciarServidor();
