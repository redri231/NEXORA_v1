const pool = require("../config/database");

function filtrosSql(filtros = {}) {
    const values = [];
    const where = [];
    if (filtros.estado) { values.push(filtros.estado); where.push(`t.estado=$${values.length}`); }
    if (filtros.prioridad) { values.push(filtros.prioridad); where.push(`t.prioridad=$${values.length}`); }
    if (filtros.id_proyecto) { values.push(filtros.id_proyecto); where.push(`t.id_proyecto=$${values.length}`); }
    if (filtros.q) {
        values.push(`%${filtros.q.trim()}%`);
        const param = `$${values.length}`;
        where.push(`(t.titulo ILIKE ${param} OR COALESCE(t.descripcion,'') ILIKE ${param} OR p.nombre ILIKE ${param} OR COALESCE(CONCAT_WS(' ',u.nombres,u.apellidos),'') ILIKE ${param})`);
    }
    return { values, where: where.length ? `WHERE ${where.join(" AND ")}` : "" };
}

const SELECT_TAREAS = `
    SELECT t.id_tarea, t.titulo, t.descripcion, t.fecha_limite, t.prioridad,
           t.estado, t.fecha_creacion, t.id_proyecto, p.nombre AS proyecto,
           t.id_usuario, CONCAT_WS(' ', u.nombres, u.apellidos) AS responsable,
           cl.razon_social_nombres AS cliente
    FROM tarea t JOIN proyecto p ON p.id_proyecto=t.id_proyecto
    JOIN cliente cl ON cl.id_cliente=p.id_cliente
    LEFT JOIN usuario u ON u.id_usuario=t.id_usuario`;

async function listar(filtros = {}) {
    const { values, where } = filtrosSql(filtros);
    const { rows } = await pool.query(`${SELECT_TAREAS} ${where}
        ORDER BY t.fecha_limite NULLS LAST,
                 CASE t.prioridad WHEN 'Urgente' THEN 0 WHEN 'Alta' THEN 1 WHEN 'Media' THEN 2 ELSE 3 END,
                 t.id_tarea DESC`, values);
    return rows;
}

async function obtenerPorId(id) {
    const { rows } = await pool.query(`${SELECT_TAREAS} WHERE t.id_tarea=$1`, [id]);
    return rows[0] || null;
}

async function catalogos() {
    const [proyectos, usuarios] = await Promise.all([
        pool.query(`SELECT id_proyecto, nombre FROM proyecto WHERE estado NOT IN ('Completado','Cancelado') ORDER BY nombre`),
        pool.query(`SELECT id_usuario, CONCAT_WS(' ', nombres, apellidos) AS nombre FROM usuario WHERE estado='Activo' ORDER BY nombres, apellidos`)
    ]);
    return { proyectos: proyectos.rows, usuarios: usuarios.rows };
}

async function crear(datos) {
    const { rows } = await pool.query(`
        INSERT INTO tarea (titulo, descripcion, fecha_limite, prioridad, estado, id_proyecto, id_usuario)
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id_tarea
    `, [datos.titulo, datos.descripcion, datos.fecha_limite, datos.prioridad,
        datos.estado || "Por hacer", datos.id_proyecto, datos.id_usuario]);
    return obtenerPorId(rows[0].id_tarea);
}

async function actualizar(id, datos) {
    const result = await pool.query(`
        UPDATE tarea SET titulo=$1, descripcion=$2, fecha_limite=$3, prioridad=$4,
            id_proyecto=$5, id_usuario=$6, estado=COALESCE($7, estado)
        WHERE id_tarea=$8 RETURNING id_tarea
    `, [datos.titulo, datos.descripcion, datos.fecha_limite, datos.prioridad,
        datos.id_proyecto, datos.id_usuario, datos.estado || null, id]);
    return result.rowCount ? obtenerPorId(id) : null;
}

async function cambiarEstado(id, estado) {
    const result = await pool.query(`UPDATE tarea SET estado=$1 WHERE id_tarea=$2 RETURNING id_tarea`, [estado, id]);
    return result.rowCount ? obtenerPorId(id) : null;
}

module.exports = { listar, obtenerPorId, catalogos, crear, actualizar, cambiarEstado };
