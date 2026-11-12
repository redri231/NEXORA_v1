const databaseUrl = process.env.E2E_DATABASE_URL;
const authSecret = process.env.E2E_AUTH_SECRET;

if (!databaseUrl) {
    throw new Error("E2E_DATABASE_URL debe apuntar a una base PostgreSQL aislada de pruebas.");
}

if (!authSecret || authSecret.length < 32) {
    throw new Error("E2E_AUTH_SECRET debe tener al menos 32 caracteres.");
}

process.env.DATABASE_URL = databaseUrl;
process.env.AUTH_SECRET = authSecret;
process.env.DB_SSL = process.env.E2E_DB_SSL || "false";
process.env.PORT = "3000";
process.env.LOG_LEVEL = "silent";

const app = require("../src/app");
const pool = require("../src/config/database");
const server = app.listen(3000, "0.0.0.0", () => {
    process.stdout.write("Servidor E2E disponible en puerto 3000.\n");
});

function cerrar() {
    server.close(async () => {
        await pool.end();
        process.exit(0);
    });
}

process.on("SIGINT", cerrar);
process.on("SIGTERM", cerrar);
