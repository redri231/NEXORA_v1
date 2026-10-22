const pool = require("../config/database");

const FILTROS_ESTADO = ["Borrador", "Enviada", "En negociación", "Aprobada", "Rechazada", "Vencida"];

async function marcarVencidas(executor = pool) {
    const result = await executor.query(`
        UPDATE cotizacion
        SET estado = 'Vencida'
        WHERE fecha_vencimiento < CURRENT_DATE
          AND estado IN ('Borrador', 'Enviada', 'En negociación')
        RETURNING id_cotizacion
    `);
    return result.rowCount;
}

async function listar(filtros = {}) {
    const values = [];
    const where = [];
    if (filtros.estado && FILTROS_ESTADO.includes(filtros.estado)) {
        values.push(filtros.estado);
        where.push(`c.estado = $${values.length}`);
    }
    if (filtros.q) {
        values.push(`%${filtros.q.trim()}%`);
        where.push(`(c.codigo ILIKE $${values.length} OR cl.razon_social_nombres ILIKE $${values.length} OR EXISTS (
            SELECT 1 FROM detalle_cotizacion dx
            JOIN servicio sx ON sx.id_servicio = dx.id_servicio
            WHERE dx.id_cotizacion = c.id_cotizacion
              AND (sx.nombre ILIKE $${values.length} OR dx.descripcion ILIKE $${values.length})
        ))`);
    }
    const result = await pool.query(`
        SELECT c.id_cotizacion, c.codigo, c.fecha_emision, c.fecha_vencimiento,
               c.estado, c.monto_total, c.id_cliente,
               cl.razon_social_nombres AS cliente,
               c.id_usuario,
               CONCAT_WS(' ', u.nombres, u.apellidos) AS responsable,
               c.id_oportunidad,
               COALESCE(STRING_AGG(DISTINCT s.nombre, ', ' ORDER BY s.nombre), '') AS servicios,
               COUNT(DISTINCT d.id_detalle)::INT AS cantidad_detalles
        FROM cotizacion c
        JOIN cliente cl ON cl.id_cliente = c.id_cliente
        JOIN usuario u ON u.id_usuario = c.id_usuario
        LEFT JOIN detalle_cotizacion d ON d.id_cotizacion = c.id_cotizacion
        LEFT JOIN servicio s ON s.id_servicio = d.id_servicio
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        GROUP BY c.id_cotizacion, cl.razon_social_nombres, u.nombres, u.apellidos
        ORDER BY c.fecha_emision DESC, c.id_cotizacion DESC
    `, values);
    return result.rows;
}

async function obtenerPorId(id) {
    const cabecera = await pool.query(`
        SELECT c.id_cotizacion, c.codigo, c.fecha_emision, c.fecha_vencimiento,
               c.estado, c.monto_total, c.id_cliente,
               cl.razon_social_nombres AS cliente, c.id_usuario,
               CONCAT_WS(' ', u.nombres, u.apellidos) AS responsable,
               c.id_oportunidad
        FROM cotizacion c
        JOIN cliente cl ON cl.id_cliente = c.id_cliente
        JOIN usuario u ON u.id_usuario = c.id_usuario
        WHERE c.id_cotizacion = $1
    `, [id]);
    if (!cabecera.rows[0]) return null;

    const detalles = await pool.query(`
        SELECT d.id_detalle, d.descripcion, d.cantidad, d.precio_unitario,
               d.descuento, d.impuesto, d.subtotal, d.id_servicio,
               s.nombre AS servicio, s.categoria
        FROM detalle_cotizacion d
        JOIN servicio s ON s.id_servicio = d.id_servicio
        WHERE d.id_cotizacion = $1
        ORDER BY d.id_detalle
    `, [id]);
    return { ...cabecera.rows[0], detalles: detalles.rows };
}

async function crear(datos) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(`
            INSERT INTO cotizacion (fecha_emision, fecha_vencimiento, id_cliente, id_usuario, id_oportunidad)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id_cotizacion
        `, [datos.fecha_emision, datos.fecha_vencimiento, datos.id_cliente, datos.id_usuario, datos.id_oportunidad || null]);
        const id = result.rows[0].id_cotizacion;
        for (const detalle of datos.detalles) {
            await insertarDetalle(client, id, detalle);
        }
        await client.query("COMMIT");
        return obtenerPorId(id);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function actualizar(id, datos) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const existente = await client.query(`
            SELECT c.id_cotizacion,
                   EXISTS (SELECT 1 FROM venta v WHERE v.id_cotizacion = c.id_cotizacion) AS tiene_venta
            FROM cotizacion c WHERE c.id_cotizacion = $1 FOR UPDATE
        `, [id]);
        if (!existente.rowCount) {
            await client.query("ROLLBACK");
            return null;
        }
        if (existente.rows[0].tiene_venta) {
            const error = new Error("Esta cotización ya tiene una venta y no puede editarse.");
            error.code = "COTIZACION_VINCULADA_VENTA";
            throw error;
        }
        await client.query(`
            UPDATE cotizacion
            SET fecha_emision = $1, fecha_vencimiento = $2, id_cliente = $3,
                id_usuario = $4, id_oportunidad = $5
            WHERE id_cotizacion = $6
        `, [datos.fecha_emision, datos.fecha_vencimiento, datos.id_cliente, datos.id_usuario, datos.id_oportunidad || null, id]);
        await client.query("DELETE FROM detalle_cotizacion WHERE id_cotizacion = $1", [id]);
        for (const detalle of datos.detalles) {
            await insertarDetalle(client, id, detalle);
        }
        await client.query("COMMIT");
        return obtenerPorId(id);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function insertarDetalle(client, idCotizacion, detalle) {
    await client.query(`
        INSERT INTO detalle_cotizacion (descripcion, cantidad, precio_unitario, descuento, impuesto, id_cotizacion, id_servicio)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [detalle.descripcion || null, detalle.cantidad, detalle.precio_unitario, detalle.descuento ?? 0, detalle.impuesto ?? 0, idCotizacion, detalle.id_servicio]);
}

async function cambiarEstado(id, estadoAnterior, estado, executor = pool) {
    const result = await executor.query(`
        UPDATE cotizacion SET estado = $1
        WHERE id_cotizacion = $2 AND estado = $3
          AND fecha_vencimiento >= CURRENT_DATE
          AND ($1 = 'Aprobada' OR NOT EXISTS (SELECT 1 FROM venta v WHERE v.id_cotizacion = cotizacion.id_cotizacion))
        RETURNING id_cotizacion
    `, [estado, id, estadoAnterior]);
    if (!result.rowCount) {
        const existente = await executor.query("SELECT estado, fecha_vencimiento < CURRENT_DATE AS vencida FROM cotizacion WHERE id_cotizacion = $1", [id]);
        if (existente.rows[0]?.vencida) {
            await marcarVencidas(executor);
            const error = new Error("La cotización ya venció y no admite cambios de estado.");
            error.code = "COTIZACION_VENCIDA";
            throw error;
        }
        if (existente.rowCount && existente.rows[0].estado !== estadoAnterior) {
            const error = new Error("El estado de la cotización cambió. Actualiza la lista e inténtalo nuevamente.");
            error.code = "TRANSICION_CONFLICTO";
            throw error;
        }
        if (existente.rowCount && estado !== "Aprobada") {
            const error = new Error("Una cotización vinculada a una venta debe conservar el estado Aprobada.");
            error.code = "COTIZACION_VINCULADA_VENTA";
            throw error;
        }
    }
    return result.rowCount ? obtenerPorId(id) : null;
}

async function listarServicios() {
    const result = await pool.query(`
        SELECT id_servicio, nombre, categoria, descripcion, precio_base, estado
        FROM servicio ORDER BY nombre
    `);
    return result.rows;
}

module.exports = { listar, obtenerPorId, crear, actualizar, cambiarEstado, listarServicios, marcarVencidas };
