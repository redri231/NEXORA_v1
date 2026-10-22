const pool = require("../config/database");

function filtrosSql(filtros = {}) {
    const values = [];
    const where = [];
    if (filtros.estado) { values.push(filtros.estado); where.push(`p.estado=$${values.length}`); }
    if (filtros.q) {
        values.push(`%${filtros.q.trim()}%`);
        const param = `$${values.length}`;
        where.push(`(p.nombre ILIKE ${param} OR cl.razon_social_nombres ILIKE ${param} OR COALESCE(q.codigo,'') ILIKE ${param})`);
    }
    return { values, where: where.length ? `WHERE ${where.join(" AND ")}` : "" };
}

const SELECT_PROYECTOS = `
    SELECT p.id_proyecto, p.nombre, p.fecha_inicio, p.fecha_fin, p.fecha_entrega_real,
           p.presupuesto, p.objetivo, p.estado, p.avance, p.id_cliente,
           cl.razon_social_nombres AS cliente, p.id_cotizacion, q.codigo AS cotizacion,
           p.id_usuario, CONCAT_WS(' ', u.nombres, u.apellidos) AS responsable,
           COUNT(DISTINCT t.id_tarea)::INT AS total_tareas,
           COUNT(DISTINCT t.id_tarea) FILTER (WHERE t.estado='Completada')::INT AS tareas_completadas
    FROM proyecto p
    JOIN cliente cl ON cl.id_cliente=p.id_cliente
    JOIN usuario u ON u.id_usuario=p.id_usuario
    LEFT JOIN cotizacion q ON q.id_cotizacion=p.id_cotizacion
    LEFT JOIN tarea t ON t.id_proyecto=p.id_proyecto`;

async function listar(filtros = {}) {
    const { values, where } = filtrosSql(filtros);
    const { rows } = await pool.query(`${SELECT_PROYECTOS} ${where}
        GROUP BY p.id_proyecto, cl.razon_social_nombres, q.codigo, u.nombres, u.apellidos
        ORDER BY p.fecha_fin ASC NULLS LAST, p.id_proyecto DESC`, values);
    return rows;
}

async function obtenerPorId(id) {
    const { rows } = await pool.query(`${SELECT_PROYECTOS}
        WHERE p.id_proyecto=$1
        GROUP BY p.id_proyecto, cl.razon_social_nombres, q.codigo, u.nombres, u.apellidos`, [id]);
    if (!rows[0]) return null;
    const [equipo, tareas] = await Promise.all([
        pool.query(`SELECT ep.id_usuario, ep.rol_proyecto, CONCAT_WS(' ', u.nombres, u.apellidos) AS nombre
                    FROM equipo_proyecto ep JOIN usuario u ON u.id_usuario=ep.id_usuario
                    WHERE ep.id_proyecto=$1 ORDER BY u.nombres, u.apellidos`, [id]),
        pool.query(`SELECT t.id_tarea, t.titulo, t.descripcion, t.fecha_limite, t.prioridad, t.estado,
                           t.id_proyecto, t.id_usuario, CONCAT_WS(' ', u.nombres, u.apellidos) AS responsable
                    FROM tarea t LEFT JOIN usuario u ON u.id_usuario=t.id_usuario
                    WHERE t.id_proyecto=$1 ORDER BY t.fecha_limite NULLS LAST, t.id_tarea DESC`, [id])
    ]);
    return { ...rows[0], equipo: equipo.rows, tareas: tareas.rows };
}

async function catalogos() {
    const [clientes, usuarios, cotizaciones] = await Promise.all([
        pool.query(`SELECT id_cliente, razon_social_nombres AS nombre FROM cliente WHERE estado='Activo' ORDER BY razon_social_nombres`),
        pool.query(`SELECT id_usuario, CONCAT_WS(' ', nombres, apellidos) AS nombre FROM usuario WHERE estado='Activo' ORDER BY nombres, apellidos`),
        pool.query(`SELECT q.id_cotizacion, q.codigo, q.id_cliente, cl.razon_social_nombres AS cliente, q.monto_total
                    FROM cotizacion q JOIN cliente cl ON cl.id_cliente=q.id_cliente
                    WHERE q.estado='Aprobada' ORDER BY q.fecha_emision DESC, q.id_cotizacion DESC`)
    ]);
    return { clientes: clientes.rows, usuarios: usuarios.rows, cotizaciones: cotizaciones.rows };
}

async function guardar(datos, id = null) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        if (datos.id_cotizacion) {
            const quote = await client.query("SELECT id_cliente, estado FROM cotizacion WHERE id_cotizacion=$1 FOR SHARE", [datos.id_cotizacion]);
            if (!quote.rowCount || quote.rows[0].estado !== "Aprobada" || Number(quote.rows[0].id_cliente) !== Number(datos.id_cliente)) {
                const error = new Error("La cotización debe estar aprobada y pertenecer al cliente del proyecto.");
                error.code = "COTIZACION_PROYECTO_INVALIDA";
                throw error;
            }
        }
        let projectId = id;
        if (id) {
            const updated = await client.query(`
                UPDATE proyecto SET nombre=$1, fecha_inicio=$2, fecha_fin=$3, presupuesto=$4,
                    objetivo=$5, avance=$6, id_cliente=$7, id_cotizacion=$8, id_usuario=$9
                WHERE id_proyecto=$10 AND estado NOT IN ('Completado','Cancelado')
                RETURNING id_proyecto
            `, [datos.nombre, datos.fecha_inicio, datos.fecha_fin, datos.presupuesto, datos.objetivo,
                datos.avance, datos.id_cliente, datos.id_cotizacion, datos.id_usuario, id]);
            if (!updated.rowCount) {
                const found = await client.query("SELECT estado FROM proyecto WHERE id_proyecto=$1", [id]);
                if (!found.rowCount) { await client.query("COMMIT"); return null; }
                const error = new Error("No se pueden editar proyectos completados o cancelados.");
                error.code = "PROYECTO_NO_EDITABLE";
                throw error;
            }
        } else {
            const created = await client.query(`
                INSERT INTO proyecto (nombre, fecha_inicio, fecha_fin, presupuesto, objetivo, avance,
                    id_cliente, id_cotizacion, id_usuario)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id_proyecto
            `, [datos.nombre, datos.fecha_inicio, datos.fecha_fin, datos.presupuesto, datos.objetivo,
                datos.avance ?? 0, datos.id_cliente, datos.id_cotizacion, datos.id_usuario]);
            projectId = created.rows[0].id_proyecto;
        }
        await client.query("DELETE FROM equipo_proyecto WHERE id_proyecto=$1", [projectId]);
        for (const miembro of datos.equipo || []) {
            await client.query(`INSERT INTO equipo_proyecto (id_proyecto,id_usuario,rol_proyecto) VALUES ($1,$2,$3)`,
                [projectId, miembro.id_usuario, miembro.rol_proyecto || null]);
        }
        await client.query("COMMIT");
        return projectId;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally { client.release(); }
}

const TRANSICIONES = {
    "Planificación": ["En ejecución", "Cancelado"],
    "En ejecución": ["En revisión", "Atrasado", "Cancelado"],
    "En revisión": ["En ejecución", "Completado", "Atrasado", "Cancelado"],
    "Atrasado": ["En ejecución", "En revisión", "Cancelado"],
    "Completado": [],
    "Cancelado": []
};

async function cambiarEstado(id, estado) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const current = await client.query("SELECT estado FROM proyecto WHERE id_proyecto=$1 FOR UPDATE", [id]);
        if (!current.rowCount) { await client.query("COMMIT"); return null; }
        if (!TRANSICIONES[current.rows[0].estado]?.includes(estado)) {
            const error = new Error(`No se permite pasar de ${current.rows[0].estado} a ${estado}.`);
            error.code = "TRANSICION_INVALIDA";
            throw error;
        }
        if (estado === "Completado") {
            await client.query("UPDATE proyecto SET estado=$1, avance=100, fecha_entrega_real=CURRENT_DATE WHERE id_proyecto=$2", [estado, id]);
        } else {
            await client.query("UPDATE proyecto SET estado=$1 WHERE id_proyecto=$2", [estado, id]);
        }
        await client.query("COMMIT");
        return obtenerPorId(id);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally { client.release(); }
}

async function marcarAtrasados(executor = pool) {
    const result = await executor.query(`
        UPDATE proyecto SET estado='Atrasado'
        WHERE fecha_fin < CURRENT_DATE AND estado IN ('Planificación','En ejecución','En revisión')
        RETURNING id_proyecto
    `);
    return result.rowCount;
}

async function resumen() {
    const { rows } = await pool.query(`
        SELECT
            (SELECT COUNT(*)::INT FROM proyecto WHERE estado IN ('En ejecución','En revisión','Atrasado')) AS proyectos_activos,
            (SELECT COUNT(*)::INT FROM tarea WHERE estado <> 'Completada') AS tareas_pendientes,
            (SELECT COUNT(*)::INT FROM tarea WHERE estado <> 'Completada' AND fecha_limite=CURRENT_DATE) AS tareas_para_hoy,
            (SELECT COUNT(*)::INT FROM proyecto WHERE estado='Atrasado') AS proyectos_atrasados
    `);
    return rows[0];
}

module.exports = { listar, obtenerPorId, catalogos, guardar, cambiarEstado, marcarAtrasados, resumen };
