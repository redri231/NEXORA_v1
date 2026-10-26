const logger = require("../config/logger");
const usuariosService = require("../services/usuarios.service");


async function listarUsuarios(req, res) {

    try {

        const usuarios = await usuariosService.obtenerTodos();

        res.json({
            success: true,
            data: usuarios
        });

    } catch (error) {

        logger.error({ err: error }, "Error en la solicitud de usuarios");

        res.status(500).json({
            success: false,
            mensaje: "Error al obtener usuarios"
        });
    }
}


async function obtenerUsuario(req, res) {

    try {

        const usuario = await usuariosService.obtenerPorId(
            req.validatedParams.id
        );

        if (!usuario) {

            return res.status(404).json({
                success: false,
                mensaje: "Usuario no encontrado"
            });
        }

        res.json({
            success: true,
            data: usuario
        });

    } catch (error) {

        logger.error({ err: error }, "Error en la solicitud de usuarios");

        res.status(500).json({
            success: false,
            mensaje: "Error al obtener usuario"
        });
    }
}


async function crearUsuario(req, res) {

    try {

        const usuario = await usuariosService.crear(req.body);

        res.status(201).json({
            success: true,
            mensaje: "Usuario creado correctamente",
            data: usuario
        });

    } catch (error) {

        logger.error({ err: error }, "Error en la solicitud de usuarios");

        if (error.code === "23505") {

            return res.status(409).json({
                success: false,
                mensaje: "El email o username ya está registrado"
            });
        }

        res.status(500).json({
            success: false,
            mensaje: "Error al crear usuario"
        });
    }
}


async function actualizarUsuario(req, res) {

    try {

        const usuario = await usuariosService.actualizar(
            req.validatedParams.id,
            req.body
        );

        if (!usuario) {

            return res.status(404).json({
                success: false,
                mensaje: "Usuario no encontrado"
            });
        }

        res.json({
            success: true,
            mensaje: "Usuario actualizado correctamente",
            data: usuario
        });

    } catch (error) {

        logger.error({ err: error }, "Error en la solicitud de usuarios");

        if (error.code === "23505") {

            return res.status(409).json({
                success: false,
                mensaje: "El email o username ya está registrado"
            });
        }

        res.status(500).json({
            success: false,
            mensaje: "Error al actualizar usuario"
        });
    }
}


async function desactivarUsuario(req, res) {

    try {

        const usuario = await usuariosService.cambiarEstado(
            req.validatedParams.id,
            "Inactivo"
        );

        if (!usuario) {

            return res.status(404).json({
                success: false,
                mensaje: "Usuario no encontrado"
            });
        }

        res.json({
            success: true,
            mensaje: "Usuario desactivado correctamente",
            data: usuario
        });

    } catch (error) {

        logger.error({ err: error }, "Error en la solicitud de usuarios");

        res.status(500).json({
            success: false,
            mensaje: "Error al desactivar usuario"
        });
    }
}


async function listarRoles(req, res) {

    try {

        const roles = await usuariosService.obtenerRoles();

        res.json({
            success: true,
            data: roles
        });

    } catch (error) {

        logger.error({ err: error }, "Error en la solicitud de usuarios");

        res.status(500).json({
            success: false,
            mensaje: "Error al obtener roles"
        });
    }
}


module.exports = {
    listarUsuarios,
    obtenerUsuario,
    crearUsuario,
    actualizarUsuario,
    desactivarUsuario,
    listarRoles
};
