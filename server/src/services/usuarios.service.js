const pool = require("../config/database");
const bcrypt = require("bcrypt");
const { usuarioDTO, rolDTO } = require("../dto/usuario.dto");

async function obtenerTodos() {

    const result = await pool.query(`
        SELECT
            u.id_usuario,
            u.nombres,
            u.apellidos,
            u.email,
            u.username,
            u.cargo,
            u.area,
            u.estado,
            u.fecha_registro,
            r.id_rol,
            r.nombre AS rol
        FROM usuario u
        INNER JOIN rol r
            ON u.id_rol = r.id_rol
        ORDER BY u.id_usuario DESC
    `);

    return result.rows.map(usuarioDTO);
}


async function obtenerPorId(id) {

    const result = await pool.query(`
        SELECT
            u.id_usuario,
            u.nombres,
            u.apellidos,
            u.email,
            u.username,
            u.cargo,
            u.area,
            u.estado,
            u.fecha_registro,
            r.id_rol,
            r.nombre AS rol
        FROM usuario u
        INNER JOIN rol r
            ON u.id_rol = r.id_rol
        WHERE u.id_usuario = $1
    `, [id]);

    return usuarioDTO(result.rows[0]);
}


async function crear(usuario) {

    const {
        nombres,
        apellidos,
        email,
        username,
        password,
        cargo,
        area,
        estado,
        id_rol
    } = usuario;

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(`
        INSERT INTO usuario (
            nombres,
            apellidos,
            email,
            username,
            password_hash,
            cargo,
            area,
            estado,
            fecha_registro,
            id_rol
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            CURRENT_TIMESTAMP,
            $9
        )
        RETURNING
            id_usuario,
            nombres,
            apellidos,
            email,
            username,
            cargo,
            area,
            estado,
            fecha_registro,
            id_rol
    `, [
        nombres,
        apellidos,
        email,
        username,
        passwordHash,
        cargo,
        area,
        estado || "Activo",
        id_rol
    ]);

    return usuarioDTO(result.rows[0]);
}


async function actualizar(id, usuario) {

    const {
        nombres,
        apellidos,
        email,
        username,
        password,
        cargo,
        area,
        estado,
        id_rol
    } = usuario;


    // ========================================================
    // SI VIENE UNA NUEVA CONTRASEÑA
    // ========================================================

    if (password && password.trim() !== '') {

        const passwordHash =
            await bcrypt.hash(password, 10);


        const result = await pool.query(`
            UPDATE usuario
            SET
                nombres = $1,
                apellidos = $2,
                email = $3,
                username = $4,
                password_hash = $5,
                cargo = $6,
                area = $7,
                estado = $8,
                id_rol = $9
            WHERE id_usuario = $10

            RETURNING
                id_usuario,
                nombres,
                apellidos,
                email,
                username,
                cargo,
                area,
                estado,
                fecha_registro,
                id_rol
        `, [
            nombres,
            apellidos,
            email,
            username,
            passwordHash,
            cargo,
            area,
            estado,
            id_rol,
            id
        ]);


        return usuarioDTO(result.rows[0]);

    }


    // ========================================================
    // SI NO CAMBIA LA CONTRASEÑA
    // ========================================================

    const result = await pool.query(`
        UPDATE usuario
        SET
            nombres = $1,
            apellidos = $2,
            email = $3,
            username = $4,
            cargo = $5,
            area = $6,
            estado = $7,
            id_rol = $8
        WHERE id_usuario = $9

        RETURNING
            id_usuario,
            nombres,
            apellidos,
            email,
            username,
            cargo,
            area,
            estado,
            fecha_registro,
            id_rol
    `, [
        nombres,
        apellidos,
        email,
        username,
        cargo,
        area,
        estado,
        id_rol,
        id
    ]);


    return usuarioDTO(result.rows[0]);
}


async function cambiarEstado(id, estado) {

    const result = await pool.query(`
        UPDATE usuario
        SET estado = $1
        WHERE id_usuario = $2
        RETURNING
            id_usuario,
            nombres,
            apellidos,
            email,
            username,
            cargo,
            area,
            estado,
            id_rol
    `, [estado, id]);

    return usuarioDTO(result.rows[0]);
}


async function obtenerRoles() {

    const result = await pool.query(`
        SELECT
            id_rol,
            nombre
        FROM rol
        ORDER BY nombre
    `);

    return result.rows.map(rolDTO);
}


module.exports = {
    obtenerTodos,
    obtenerPorId,
    crear,
    actualizar,
    cambiarEstado,
    obtenerRoles
};
