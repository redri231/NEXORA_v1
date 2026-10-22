require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("../src/config/database");

async function crearAdminInicial() {
    const { INITIAL_ADMIN_USERNAME, INITIAL_ADMIN_PASSWORD, INITIAL_ADMIN_EMAIL } = process.env;

    if (!INITIAL_ADMIN_USERNAME || !INITIAL_ADMIN_PASSWORD || !INITIAL_ADMIN_EMAIL) {
        throw new Error("Configura INITIAL_ADMIN_USERNAME, INITIAL_ADMIN_PASSWORD e INITIAL_ADMIN_EMAIL antes de ejecutar este comando.");
    }

    const existentes = await pool.query("SELECT COUNT(*)::int AS cantidad FROM usuario");
    if (existentes.rows[0].cantidad > 0) {
        console.log("Ya existen usuarios; no se creó otra cuenta inicial.");
        return;
    }

    const rol = await pool.query("SELECT id_rol FROM rol WHERE nombre = 'Administrador'");
    if (!rol.rows[0]) throw new Error("No existe el rol Administrador. Ejecuta primero el script SQL vigente.");

    const hash = await bcrypt.hash(INITIAL_ADMIN_PASSWORD, 10);
    await pool.query(`
        INSERT INTO usuario (
            nombres, apellidos, email, username, password_hash,
            cargo, area, estado, id_rol
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Activo', $8)
    `, [
        process.env.INITIAL_ADMIN_NOMBRES || "Administrador",
        process.env.INITIAL_ADMIN_APELLIDOS || "NEXORA",
        INITIAL_ADMIN_EMAIL.trim().toLowerCase(),
        INITIAL_ADMIN_USERNAME.trim(),
        hash,
        process.env.INITIAL_ADMIN_CARGO || "Administrador",
        process.env.INITIAL_ADMIN_AREA || "Administración",
        rol.rows[0].id_rol
    ]);

    console.log(`Cuenta inicial creada para ${INITIAL_ADMIN_USERNAME.trim()}.`);
}

crearAdminInicial()
    .catch((error) => {
        console.error("No se pudo crear la cuenta inicial:", error.message);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
