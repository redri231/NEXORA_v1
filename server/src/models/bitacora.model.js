const pool = require("../config/database");

async function registrar({ accion, entidad, idEntidad, descripcion, idUsuario }) {
    await pool.query(`
        INSERT INTO bitacora (accion, entidad, id_entidad, descripcion, id_usuario)
        VALUES ($1, $2, $3, $4, $5)
    `, [accion, entidad, idEntidad, descripcion, idUsuario]);
}

module.exports = { registrar };
