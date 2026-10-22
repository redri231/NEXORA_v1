const pool = require("../config/database");

const ETAPAS = ["Solicitud", "Planificación", "Asignación", "Producción", "Revisión", "Entrega", "Finalizado"];

const SELECT_ORDENES = `
    SELECT o.id_orden, o.codigo, o.titulo, o.estado_flujo, o.fecha_planificacion,
           o.fecha_entrega, o.id_proyecto, p.nombre AS proyecto,
           cl.razon_social_nombres AS cliente, o.id_servicio, s.nombre AS servicio,
           o.id_usuario, CONCAT_WS(' ', u.nombres, u.apellidos) AS responsable,
           final.fecha AS fecha_finalizacion
    FROM orden_produccion o
    JOIN proyecto p ON p.id_proyecto=o.id_proyecto
    JOIN cliente cl ON cl.id_cliente=p.id_cliente
    LEFT JOIN servicio s ON s.id_servicio=o.id_servicio
    JOIN usuario u ON u.id_usuario=o.id_usuario
    LEFT JOIN LATERAL (
        SELECT eo.fecha
        FROM etapa_orden eo
        WHERE eo.id_orden=o.id_orden AND eo.nombre_etapa='Finalizado'
        ORDER BY eo.fecha DESC, eo.id_etapa DESC
        LIMIT 1
    ) final ON TRUE`;

function filtrosSql(filtros = {}) {
    const values = [];
    const where = [];
    if (filtros.q) {
        values.push(`%${filtros.q.trim()}%`);
        const p = `$${values.length}`;
        where.push(`(o.codigo ILIKE ${p} OR o.titulo ILIKE ${p} OR p.nombre ILIKE ${p}
            OR cl.razon_social_nombres ILIKE ${p} OR COALESCE(s.nombre,'') ILIKE ${p}
            OR CONCAT_WS(' ', u.nombres, u.apellidos) ILIKE ${p})`);
    }
    return { values, where };
}

async function listarTablero(filtros = {}) {
    const { values, where } = filtrosSql(filtros);
    values.push(filtros.dias_finalizados || 7);
    where.push(`(o.estado_flujo <> 'Finalizado' OR final.fecha >= NOW() - ($${values.length}::INT * INTERVAL '1 day'))`);
    const result = await pool.query(`${SELECT_ORDENES} WHERE ${where.join(" AND ")}
        ORDER BY CASE o.estado_flujo
            WHEN 'Solicitud' THEN 1 WHEN 'Planificación' THEN 2 WHEN 'Asignación' THEN 3
            WHEN 'Producción' THEN 4 WHEN 'Revisión' THEN 5 WHEN 'Entrega' THEN 6 ELSE 7 END,
            o.fecha_entrega NULLS LAST, o.id_orden DESC`, values);
    return result.rows;
}

async function listarHistorial(filtros = {}) {
    const { values, where } = filtrosSql(filtros);
    where.push("o.estado_flujo='Finalizado'");
    if (filtros.desde) { values.push(filtros.desde); where.push(`final.fecha::DATE >= $${values.length}::DATE`); }
    if (filtros.hasta) { values.push(filtros.hasta); where.push(`final.fecha::DATE <= $${values.length}::DATE`); }
    const result = await pool.query(`${SELECT_ORDENES} WHERE ${where.join(" AND ")}
        ORDER BY final.fecha DESC NULLS LAST, o.id_orden DESC`, values);
    return result.rows;
}

async function obtenerPorId(id) {
    const orden = await pool.query(`${SELECT_ORDENES} WHERE o.id_orden=$1`, [id]);
    if (!orden.rows[0]) return null;
    const historial = await pool.query(`
        SELECT eo.id_etapa, eo.nombre_etapa, eo.fecha, eo.comentario, eo.id_usuario,
               CONCAT_WS(' ', u.nombres, u.apellidos) AS usuario
        FROM etapa_orden eo JOIN usuario u ON u.id_usuario=eo.id_usuario
        WHERE eo.id_orden=$1 ORDER BY eo.fecha DESC, eo.id_etapa DESC
    `, [id]);
    return { ...orden.rows[0], historial: historial.rows };
}

async function catalogos() {
    const [proyectos, servicios, usuarios] = await Promise.all([
        pool.query(`SELECT id_proyecto, nombre FROM proyecto WHERE estado NOT IN ('Completado','Cancelado') ORDER BY nombre`),
        pool.query(`SELECT id_servicio, nombre FROM servicio WHERE estado='Activo' ORDER BY nombre`),
        pool.query(`SELECT id_usuario, CONCAT_WS(' ', nombres, apellidos) AS nombre FROM usuario WHERE estado='Activo' ORDER BY nombres, apellidos`)
    ]);
    return { proyectos: proyectos.rows, servicios: servicios.rows, usuarios: usuarios.rows };
}

async function crear(datos, idUsuarioActor) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(`
            INSERT INTO orden_produccion (titulo, fecha_planificacion, fecha_entrega, id_proyecto, id_servicio, id_usuario)
            VALUES ($1,$2,$3,$4,$5,$6) RETURNING id_orden
        `, [datos.titulo, datos.fecha_planificacion, datos.fecha_entrega, datos.id_proyecto, datos.id_servicio, datos.id_usuario]);
        const id = result.rows[0].id_orden;
        await client.query(`INSERT INTO etapa_orden (nombre_etapa, comentario, id_orden, id_usuario)
            VALUES ('Solicitud', 'Orden creada', $1, $2)`, [id, idUsuarioActor]);
        await client.query("COMMIT");
        return obtenerPorId(id);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally { client.release(); }
}

async function cambiarEtapa(id, estado, comentario, idUsuarioActor) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const current = await client.query(`SELECT estado_flujo FROM orden_produccion WHERE id_orden=$1 FOR UPDATE`, [id]);
        if (!current.rowCount) { await client.query("COMMIT"); return null; }
        const indiceActual = ETAPAS.indexOf(current.rows[0].estado_flujo);
        const etapaSiguiente = ETAPAS[indiceActual + 1];
        if (!etapaSiguiente || etapaSiguiente !== estado) {
            const error = new Error(`El flujo requiere avanzar de ${current.rows[0].estado_flujo} a ${etapaSiguiente || 'ninguna etapa'}.`);
            error.code = "TRANSICION_INVALIDA";
            throw error;
        }
        await client.query(`UPDATE orden_produccion SET estado_flujo=$1 WHERE id_orden=$2`, [estado, id]);
        await client.query(`INSERT INTO etapa_orden (nombre_etapa, comentario, id_orden, id_usuario)
            VALUES ($1,$2,$3,$4)`, [estado, comentario || null, id, idUsuarioActor]);
        await client.query("COMMIT");
        return obtenerPorId(id);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally { client.release(); }
}

async function resumen() {
    const { rows } = await pool.query(`
        SELECT
            COUNT(*) FILTER (WHERE estado_flujo='Producción')::INT AS en_produccion,
            COUNT(*) FILTER (WHERE estado_flujo IN ('Solicitud','Planificación','Asignación'))::INT AS pendientes,
            COUNT(*) FILTER (WHERE estado_flujo='Finalizado' AND fecha_finalizacion >= date_trunc('month', CURRENT_DATE))::INT AS finalizados_mes,
            COUNT(*) FILTER (WHERE estado_flujo <> 'Finalizado' AND fecha_entrega < CURRENT_DATE)::INT AS atrasados
        FROM (
            SELECT o.estado_flujo, o.fecha_entrega,
                   (SELECT MAX(eo.fecha) FROM etapa_orden eo WHERE eo.id_orden=o.id_orden AND eo.nombre_etapa='Finalizado') AS fecha_finalizacion
            FROM orden_produccion o
        ) x
    `);
    return rows[0];
}

module.exports = { listarTablero, listarHistorial, obtenerPorId, catalogos, crear, cambiarEtapa, resumen };
