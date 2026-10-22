require("dotenv").config();

const app = require("./app");
const pool = require("./config/database");
const authService = require("./services/auth.service");
const iniciarVencimientoCotizaciones = require("./jobs/vencimientoCotizaciones.job");
const iniciarFinalizacionCampanias = require("./jobs/finalizarCampanias.job");
const iniciarActualizacionProyectosAtrasados = require("./jobs/actualizarProyectosAtrasados.job");

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {

    try {
        authService.validarConfiguracion();
    } catch (error) {
        console.error("Configuración de autenticación inválida:");
        console.error(error.message);
        process.exitCode = 1;
        return;
    }

    try {

        await pool.query("SELECT NOW()");

        iniciarVencimientoCotizaciones();
        iniciarFinalizacionCampanias();
        iniciarActualizacionProyectosAtrasados();

        console.log("✅ Conexión a PostgreSQL funcionando");

        app.listen(PORT, () => {
            console.log(`🚀 NEXORA ejecutándose en http://localhost:${PORT}`);
        });

    } catch (error) {

        console.error("❌ No se pudo conectar a PostgreSQL");
        console.error(error.message);

    }
}

iniciarServidor();
