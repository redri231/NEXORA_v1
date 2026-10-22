const pool = require("../config/database");

function filtroSql(filtros = {}) {
    const values = [];
    const where = [];
    if (filtros.estado) {
        values.push(filtros.estado);
        where.push(`c.estado = $${values.length}`);
    }
    if (filtros.q) {
        values.push(`%${filtros.q.trim()}%`);
        const p = `$${values.length}`;
        where.push(`(c.nombre ILIKE ${p} OR cl.razon_social_nombres ILIKE ${p}
            OR COALESCE(p.nombre, '') ILIKE ${p}
            OR EXISTS (SELECT 1 FROM canal_campania cc WHERE cc.id_campania = c.id_campania AND cc.nombre_canal ILIKE ${p}))`);
    }
    return { values, where: where.length ? `WHERE ${where.join(" AND ")}` : "" };
}

const SELECT_CAMPANIAS = `
    SELECT c.id_campania, c.nombre, c.objetivo, c.plataforma, c.publico_objetivo,
           c.fecha_inicio, c.fecha_fin, c.presupuesto, c.estado,
           c.id_cliente, cl.razon_social_nombres AS cliente,
           c.id_proyecto, p.nombre AS proyecto, c.id_usuario,
           CONCAT_WS(' ', u.nombres, u.apellidos) AS responsable,
           COALESCE(ARRAY_AGG(DISTINCT cc.nombre_canal) FILTER (WHERE cc.nombre_canal IS NOT NULL), '{}') AS canales,
           (SELECT jsonb_build_object(
                'id_indicador', i.id_indicador, 'fecha_registro', i.fecha_registro,
                'alcance', i.alcance, 'impresiones', i.impresiones, 'clics', i.clics,
                'leads', i.leads, 'conversiones', i.conversiones,
                'costo_por_lead', i.costo_por_lead, 'roi', i.roi
            ) FROM indicador_campania i WHERE i.id_campania = c.id_campania
            ORDER BY i.fecha_registro DESC, i.id_indicador DESC LIMIT 1) AS indicador_vigente
    FROM campania c
    JOIN cliente cl ON cl.id_cliente = c.id_cliente
    LEFT JOIN proyecto p ON p.id_proyecto = c.id_proyecto
    JOIN usuario u ON u.id_usuario = c.id_usuario
    LEFT JOIN canal_campania cc ON cc.id_campania = c.id_campania`;

async function listar(filtros) {
    const { values, where } = filtroSql(filtros);
    const result = await pool.query(`${SELECT_CAMPANIAS} ${where}
        GROUP BY c.id_campania, cl.razon_social_nombres, p.nombre, u.nombres, u.apellidos
        ORDER BY c.fecha_inicio DESC NULLS LAST, c.id_campania DESC`, values);
    return result.rows;
}

async function obtenerPorId(id) {
    const result = await pool.query(`${SELECT_CAMPANIAS}
        WHERE c.id_campania = $1
        GROUP BY c.id_campania, cl.razon_social_nombres, p.nombre, u.nombres, u.apellidos`, [id]);
    if (!result.rows[0]) return null;
    const indicadores = await pool.query(`
        SELECT id_indicador, fecha_registro, alcance, impresiones, clics, leads,
               conversiones, costo_por_lead, roi, id_campania
        FROM indicador_campania WHERE id_campania = $1
        ORDER BY fecha_registro DESC, id_indicador DESC
    `, [id]);
    return { ...result.rows[0], indicadores: indicadores.rows };
}

async function clientes() {
    const { rows } = await pool.query(`SELECT id_cliente, razon_social_nombres AS nombre FROM cliente WHERE estado = 'Activo' ORDER BY razon_social_nombres`);
    return rows;
}

async function usuarios() {
    const { rows } = await pool.query(`SELECT id_usuario, CONCAT_WS(' ', nombres, apellidos) AS nombre FROM usuario WHERE estado = 'Activo' ORDER BY nombres, apellidos`);
    return rows;
}

async function proyectos() {
    const { rows } = await pool.query(`SELECT id_proyecto, nombre, id_cliente FROM proyecto ORDER BY nombre`);
    return rows;
}

async function reemplazarCanales(executor, id, canales = []) {
    await executor.query("DELETE FROM canal_campania WHERE id_campania = $1", [id]);
    for (const nombre of canales) {
        await executor.query("INSERT INTO canal_campania (id_campania, nombre_canal) VALUES ($1, $2)", [id, nombre]);
    }
}

async function guardar(datos, id = null) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        if (datos.id_proyecto) {
            const check = await client.query("SELECT 1 FROM proyecto WHERE id_proyecto = $1 AND id_cliente = $2", [datos.id_proyecto, datos.id_cliente]);
            if (!check.rowCount) {
                const error = new Error("El proyecto seleccionado debe pertenecer al cliente elegido.");
                error.code = "PROYECTO_CLIENTE_INVALIDO";
                throw error;
            }
        }
        let campaniaId = id;
        if (id) {
            const update = await client.query(`
                UPDATE campania SET nombre=$1, objetivo=$2, publico_objetivo=$3,
                    fecha_inicio=$4, fecha_fin=$5, presupuesto=$6, id_cliente=$7,
                    id_proyecto=$8, id_usuario=$9
                WHERE id_campania=$10 AND estado='Planificada'
                RETURNING id_campania
            `, [datos.nombre, datos.objetivo, datos.publico_objetivo, datos.fecha_inicio,
                datos.fecha_fin, datos.presupuesto, datos.id_cliente, datos.id_proyecto, datos.id_usuario, id]);
            if (!update.rowCount) {
                const error = new Error("Solo se pueden editar campañas planificadas.");
                error.code = "CAMPANIA_NO_EDITABLE";
                throw error;
            }
        } else {
            const insert = await client.query(`
                INSERT INTO campania (nombre, objetivo, publico_objetivo, fecha_inicio, fecha_fin,
                    presupuesto, id_cliente, id_proyecto, id_usuario)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id_campania
            `, [datos.nombre, datos.objetivo, datos.publico_objetivo, datos.fecha_inicio,
                datos.fecha_fin, datos.presupuesto, datos.id_cliente, datos.id_proyecto, datos.id_usuario]);
            campaniaId = insert.rows[0].id_campania;
        }
        await reemplazarCanales(client, campaniaId, datos.canales);
        await client.query("COMMIT");
        return campaniaId;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

const TRANSICIONES = {
    "Planificada": ["Activa"],
    "Activa": ["Pausada", "Finalizada", "Bajo rendimiento"],
    "Pausada": ["Activa", "Finalizada", "Bajo rendimiento"],
    "Bajo rendimiento": ["Activa", "Pausada", "Finalizada"],
    "Finalizada": []
};

async function cambiarEstado(id, estado) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const current = await client.query("SELECT estado FROM campania WHERE id_campania=$1 FOR UPDATE", [id]);
        if (!current.rowCount) { await client.query("COMMIT"); return null; }
        if (!TRANSICIONES[current.rows[0].estado]?.includes(estado)) {
            const error = new Error(`No se permite pasar de ${current.rows[0].estado} a ${estado}.`);
            error.code = "TRANSICION_INVALIDA";
            throw error;
        }
        await client.query("UPDATE campania SET estado=$1 WHERE id_campania=$2", [estado, id]);
        await client.query("COMMIT");
        return obtenerPorId(id);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function marcarFinalizadas(executor = pool) {
    const result = await executor.query(`
        UPDATE campania SET estado='Finalizada'
        WHERE fecha_fin < CURRENT_DATE AND estado <> 'Finalizada'
        RETURNING id_campania
    `);
    return result.rowCount;
}

async function registrarIndicador(id, datos) {
    const exists = await pool.query("SELECT 1 FROM campania WHERE id_campania=$1", [id]);
    if (!exists.rowCount) return null;
    const result = await pool.query(`
        INSERT INTO indicador_campania (alcance, impresiones, clics, leads, conversiones, costo_por_lead, roi, id_campania)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING id_indicador, fecha_registro, alcance, impresiones, clics, leads,
                  conversiones, costo_por_lead, roi, id_campania
    `, [datos.alcance, datos.impresiones, datos.clics, datos.leads, datos.conversiones, datos.costo_por_lead, datos.roi, id]);
    return result.rows[0];
}

async function listarProductosMaterial() {
    const { rows } = await pool.query(`
        SELECT id_producto, codigo, nombre, unidad_medida, stock_actual
        FROM producto WHERE estado='Activo' ORDER BY nombre
    `);
    return rows;
}

async function listarSolicitudesMaterial(id) {
    const { rows } = await pool.query(`
        SELECT sm.id_solicitud, sm.cantidad_solicitada, sm.estado, sm.fecha,
               sm.id_producto, pr.codigo AS codigo_producto, pr.nombre AS producto,
               pr.unidad_medida, sm.id_usuario,
               CONCAT_WS(' ', u.nombres, u.apellidos) AS solicitante
        FROM solicitud_material sm
        JOIN producto pr ON pr.id_producto=sm.id_producto
        JOIN usuario u ON u.id_usuario=sm.id_usuario
        WHERE sm.id_campania=$1
        ORDER BY sm.fecha DESC, sm.id_solicitud DESC
    `, [id]);
    return rows;
}

async function crearSolicitudMaterial(id, idUsuario, datos) {
    const campaign = await pool.query("SELECT 1 FROM campania WHERE id_campania=$1", [id]);
    if (!campaign.rowCount) return null;
    const { rows } = await pool.query(`
        INSERT INTO solicitud_material (cantidad_solicitada, id_producto, id_campania, id_usuario)
        VALUES ($1,$2,$3,$4)
        RETURNING id_solicitud, cantidad_solicitada, estado, fecha, id_producto, id_usuario
    `, [datos.cantidad_solicitada, datos.id_producto, id, idUsuario]);
    return rows[0];
}

async function resumenRoi() {
    const [resumen, rendimiento] = await Promise.all([
        pool.query(`
            SELECT COUNT(*) FILTER (WHERE estado='Activa')::INT AS campanias_activas,
                   COALESCE(AVG(i.roi), 0) AS roi_promedio
            FROM campania c
            LEFT JOIN LATERAL (
                SELECT roi FROM indicador_campania
                WHERE id_campania=c.id_campania ORDER BY fecha_registro DESC, id_indicador DESC LIMIT 1
            ) i ON TRUE
        `),
        pool.query(`
            SELECT c.id_campania, c.nombre, cl.razon_social_nombres AS cliente,
                   i.fecha_registro, i.roi, i.alcance, i.clics, i.leads, i.conversiones
            FROM campania c
            JOIN cliente cl ON cl.id_cliente=c.id_cliente
            JOIN LATERAL (
                SELECT fecha_registro, roi, alcance, clics, leads, conversiones
                FROM indicador_campania WHERE id_campania=c.id_campania
                ORDER BY fecha_registro DESC, id_indicador DESC LIMIT 1
            ) i ON TRUE
            ORDER BY i.roi DESC NULLS LAST, i.fecha_registro DESC
            LIMIT 6
        `)
    ]);
    return { ...resumen.rows[0], rendimiento: rendimiento.rows };
}

module.exports = { listar, obtenerPorId, clientes, usuarios, proyectos, guardar, cambiarEstado, marcarFinalizadas, registrarIndicador, listarProductosMaterial, listarSolicitudesMaterial, crearSolicitudMaterial, resumenRoi };
