const pool = require("../config/database");

async function obtenerUsuariosReporte() {
    const result = await pool.query(`
        SELECT
            u.id_usuario,
            u.nombres,
            u.apellidos,
            u.email,
            u.username,
            u.cargo,
            u.area,
            r.nombre AS rol,
            u.estado,
            u.fecha_registro
        FROM usuario u
        LEFT JOIN rol r
            ON u.id_rol = r.id_rol
        ORDER BY u.id_usuario ASC
    `);

    return result.rows;
}

async function obtenerClientesReporte() {

    const result = await pool.query(`
        SELECT
            c.id_cliente,
            c.tipo_cliente,
            c.razon_social_nombres,
            c.num_documento,
            c.email,
            c.telefono,
            c.direccion,
            c.fecha_registro,
            c.estado,
            CONCAT(
                u.nombres,
                ' ',
                u.apellidos
            ) AS responsable

        FROM cliente c

        LEFT JOIN usuario u
            ON c.id_usuario = u.id_usuario

        ORDER BY c.id_cliente ASC
    `);

    return result.rows;
}

async function obtenerLeadsReporte() {
    const result = await pool.query(`
        SELECT
            l.id_lead,
            l.nombre,
            l.contacto,
            l.cargo_contacto,
            l.email,
            l.telefono,
            l.fuente,
            l.estado,
            l.fecha_registro,
            l.id_cliente,
            c.razon_social_nombres AS cliente_convertido
        FROM cliente_potencial l
        LEFT JOIN cliente c ON c.id_cliente = l.id_cliente
        ORDER BY l.id_lead ASC
    `);

    return result.rows;
}

module.exports = {
    obtenerUsuariosReporte,
    obtenerClientesReporte,
    obtenerLeadsReporte
};
