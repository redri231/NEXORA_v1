const logger = require("../config/logger");

const usuariosService = require("./usuarios.service");

async function crearAdminInicial() {
    try {
        const usuarios = await usuariosService.obtenerTodos();

        if (usuarios.length > 0) {
            logger.info("Ya existen usuarios. No se crea el administrador.");
            return;
        }

        const password = process.env.ADMIN_INITIAL_PASSWORD;

        if (!password) {
            throw new Error(
                "Debes configurar ADMIN_INITIAL_PASSWORD en el archivo .env"
            );
        }

        await usuariosService.crear({
            nombres: "Administrador",
            apellidos: "Sistema",
            email: process.env.ADMIN_INITIAL_EMAIL || "admin@empresa.com",
            username: process.env.ADMIN_INITIAL_USERNAME || "admin",
            password: password,
            cargo: "Administrador",
            area: "Sistemas",
            estado: "Activo",
            id_rol: Number(process.env.ADMIN_INITIAL_ROLE_ID)
        });

        logger.info("Administrador inicial creado correctamente.");

    } catch (error) {
        logger.error({ err: error }, "Error al crear el administrador inicial:");
        throw error;
    }
}

module.exports = { crearAdminInicial };
