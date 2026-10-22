const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === "true"
        ? { rejectUnauthorized: false }
        : false
});

pool.on("connect", () => {
    console.log("✅ PostgreSQL conectado correctamente");
});

pool.on("error", (error) => {
    console.error("❌ Error inesperado de PostgreSQL:", error);
});

module.exports = pool;