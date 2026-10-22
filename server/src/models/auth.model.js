const pool = require("../config/database");

async function obtenerUsuarioPorUsername(username) {
    const result = await pool.query(`
        SELECT
            u.id_usuario,
            u.nombres,
            u.apellidos,
            u.email,
            u.username,
            u.password_hash,
            u.cargo,
            u.area,
            u.estado,
            u.id_rol,
            r.nombre AS rol
        FROM usuario u
        INNER JOIN rol r ON r.id_rol = u.id_rol
        WHERE u.username = $1
    `, [username]);

    return result.rows[0] || null;
}

async function obtenerUsuarioActivoPorId(id) {
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
            u.id_rol,
            r.nombre AS rol
        FROM usuario u
        INNER JOIN rol r ON r.id_rol = u.id_rol
        WHERE u.id_usuario = $1 AND u.estado = 'Activo'
    `, [id]);

    return result.rows[0] || null;
}

module.exports = { obtenerUsuarioPorUsername, obtenerUsuarioActivoPorId };
