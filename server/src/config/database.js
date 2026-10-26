require("dotenv").config({ quiet: true });

const { Pool } = require("pg");
const logger = require("./logger");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === "true"
        ? { rejectUnauthorized: false }
        : false
});

pool.on("connect", () => {
    logger.debug({ database: "postgresql" }, "Se abrió una conexión del pool");
});

pool.on("error", (error) => {
    logger.error({ err: error }, "Error inesperado del pool de PostgreSQL");
});

module.exports = pool;
