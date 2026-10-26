const pool = require("../config/database");

const USUARIO_SELECT = `
    SELECT u.id_usuario, u.nombres, u.apellidos, u.email, u.username,
           u.cargo, u.area, u.estado, u.fecha_registro, r.id_rol, r.nombre AS rol
    FROM usuario u
    INNER JOIN rol r ON r.id_rol = u.id_rol`;

async function obtenerTodos() {
    const result = await pool.query(`${USUARIO_SELECT} ORDER BY u.id_usuario DESC`);
    return result.rows;
}

async function obtenerPorId(id) {
    const result = await pool.query(`${USUARIO_SELECT} WHERE u.id_usuario = $1`, [id]);
    return result.rows[0] || null;
}

async function crear(usuario, passwordHash) {
    const result = await pool.query(`
        INSERT INTO usuario (
            nombres, apellidos, email, username, password_hash,
            cargo, area, estado, fecha_registro, id_rol
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP,$9)
        RETURNING id_usuario,nombres,apellidos,email,username,cargo,area,estado,fecha_registro,id_rol
    `, [
        usuario.nombres, usuario.apellidos, usuario.email, usuario.username,
        passwordHash, usuario.cargo, usuario.area, usuario.estado || "Activo", usuario.id_rol,
    ]);
    return result.rows[0] || null;
}

async function actualizar(id, usuario, passwordHash = null) {
    const result = passwordHash
        ? await pool.query(`
            UPDATE usuario
            SET nombres=$1,apellidos=$2,email=$3,username=$4,password_hash=$5,
                cargo=$6,area=$7,estado=$8,id_rol=$9
            WHERE id_usuario=$10
            RETURNING id_usuario,nombres,apellidos,email,username,cargo,area,estado,fecha_registro,id_rol
        `, [usuario.nombres, usuario.apellidos, usuario.email, usuario.username, passwordHash,
            usuario.cargo, usuario.area, usuario.estado, usuario.id_rol, id])
        : await pool.query(`
            UPDATE usuario
            SET nombres=$1,apellidos=$2,email=$3,username=$4,cargo=$5,area=$6,estado=$7,id_rol=$8
            WHERE id_usuario=$9
            RETURNING id_usuario,nombres,apellidos,email,username,cargo,area,estado,fecha_registro,id_rol
        `, [usuario.nombres, usuario.apellidos, usuario.email, usuario.username,
            usuario.cargo, usuario.area, usuario.estado, usuario.id_rol, id]);
    return result.rows[0] || null;
}

async function cambiarEstado(id, estado) {
    const result = await pool.query(`
        UPDATE usuario SET estado=$1 WHERE id_usuario=$2
        RETURNING id_usuario,nombres,apellidos,email,username,cargo,area,estado,id_rol
    `, [estado, id]);
    return result.rows[0] || null;
}

async function obtenerRoles() {
    const result = await pool.query("SELECT id_rol,nombre FROM rol ORDER BY nombre");
    return result.rows;
}

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, cambiarEstado, obtenerRoles };
