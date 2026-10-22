const pool = require("../config/database");

async function listar(filtros = {}) {
    const values = [];
    const where = [];
    if (filtros.estado) {
        values.push(filtros.estado);
        where.push(`v.estado = $${values.length}`);
    }
    if (filtros.q) {
        values.push(`%${filtros.q.trim()}%`);
        const n = values.length;
        where.push(`(v.codigo ILIKE $${n} OR cl.razon_social_nombres ILIKE $${n}
            OR q.codigo ILIKE $${n} OR COALESCE(p.nombre, '') ILIKE $${n}
            OR EXISTS (
                SELECT 1 FROM detalle_cotizacion dx
                JOIN servicio sx ON sx.id_servicio = dx.id_servicio
                WHERE dx.id_cotizacion = q.id_cotizacion
                  AND (sx.nombre ILIKE $${n} OR dx.descripcion ILIKE $${n})
            ))`);
    }
    const result = await pool.query(`
        SELECT v.id_venta, v.codigo, v.monto_total, v.fecha, v.estado,
               v.id_cliente, cl.razon_social_nombres AS cliente,
               v.id_cotizacion, q.codigo AS cotizacion,
               v.id_proyecto, p.nombre AS proyecto,
               COALESCE(STRING_AGG(DISTINCT s.nombre, ', ' ORDER BY s.nombre), '') AS servicios
        FROM venta v
        JOIN cliente cl ON cl.id_cliente = v.id_cliente
        JOIN cotizacion q ON q.id_cotizacion = v.id_cotizacion
        LEFT JOIN proyecto p ON p.id_proyecto = v.id_proyecto
        LEFT JOIN detalle_cotizacion d ON d.id_cotizacion = q.id_cotizacion
        LEFT JOIN servicio s ON s.id_servicio = d.id_servicio
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        GROUP BY v.id_venta, cl.razon_social_nombres, q.codigo, p.nombre
        ORDER BY v.fecha DESC, v.id_venta DESC
    `, values);
    return result.rows;
}

async function obtenerPorId(id) {
    const cabecera = await pool.query(`
        SELECT v.id_venta, v.codigo, v.monto_total, v.fecha, v.estado,
               v.id_cliente, cl.razon_social_nombres AS cliente,
               v.id_cotizacion, q.codigo AS cotizacion,
               v.id_proyecto, p.nombre AS proyecto
        FROM venta v
        JOIN cliente cl ON cl.id_cliente = v.id_cliente
        JOIN cotizacion q ON q.id_cotizacion = v.id_cotizacion
        LEFT JOIN proyecto p ON p.id_proyecto = v.id_proyecto
        WHERE v.id_venta = $1
    `, [id]);
    if (!cabecera.rows[0]) return null;

    const detalles = await pool.query(`
        SELECT d.id_detalle, d.descripcion, d.cantidad, d.precio_unitario,
               d.descuento, d.impuesto, d.subtotal, s.nombre AS servicio, s.categoria
        FROM detalle_cotizacion d
        JOIN servicio s ON s.id_servicio = d.id_servicio
        WHERE d.id_cotizacion = $1
        ORDER BY d.id_detalle
    `, [cabecera.rows[0].id_cotizacion]);
    return { ...cabecera.rows[0], detalles: detalles.rows };
}

async function cotizacionesDisponibles() {
    const result = await pool.query(`
        SELECT q.id_cotizacion, q.codigo, q.fecha_vencimiento, q.monto_total,
               q.id_cliente, cl.razon_social_nombres AS cliente
        FROM cotizacion q
        JOIN cliente cl ON cl.id_cliente = q.id_cliente
        WHERE q.estado = 'Aprobada'
          AND NOT EXISTS (SELECT 1 FROM venta v WHERE v.id_cotizacion = q.id_cotizacion)
        ORDER BY q.fecha_emision DESC, q.id_cotizacion DESC
    `);
    return result.rows;
}

async function proyectos() {
    const result = await pool.query(`
        SELECT id_proyecto, nombre, id_cliente, id_cotizacion
        FROM proyecto
        ORDER BY nombre
    `);
    return result.rows;
}

async function resumen() {
    const result = await pool.query(`
        SELECT
            COALESCE(SUM(monto_total) FILTER (
                WHERE estado <> 'Anulada'
                  AND fecha >= date_trunc('month', CURRENT_DATE)::DATE
            ), 0) AS ventas_mes,
            COUNT(*) FILTER (WHERE estado <> 'Anulada')::INT AS cantidad_ventas,
            COALESCE(AVG(monto_total) FILTER (WHERE estado <> 'Anulada'), 0) AS ticket_promedio,
            COUNT(*) FILTER (WHERE estado = 'Por facturar')::INT AS por_facturar
        FROM venta
    `);
    return result.rows[0];
}

async function crear(datos) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const cotizacionResult = await client.query(`
            SELECT q.id_cotizacion, q.id_cliente, q.monto_total, q.estado
            FROM cotizacion q WHERE q.id_cotizacion = $1 FOR UPDATE
        `, [datos.id_cotizacion]);
        const cotizacion = cotizacionResult.rows[0];
        if (!cotizacion) {
            const error = new Error("La cotización no existe."); error.code = "COTIZACION_NOT_FOUND"; throw error;
        }
        if (cotizacion.estado !== "Aprobada") {
            const error = new Error("Solo se puede registrar una venta desde una cotización aprobada."); error.code = "COTIZACION_NO_APROBADA"; throw error;
        }
        const ventaExistente = await client.query("SELECT id_venta FROM venta WHERE id_cotizacion = $1", [datos.id_cotizacion]);
        if (ventaExistente.rowCount) {
            const error = new Error("Esta cotización ya tiene una venta registrada."); error.code = "VENTA_EXISTENTE"; throw error;
        }
        if (datos.id_proyecto) {
            const proyecto = await client.query(`
                SELECT id_proyecto FROM proyecto
                WHERE id_proyecto = $1 AND id_cliente = $2
            `, [datos.id_proyecto, cotizacion.id_cliente]);
            if (!proyecto.rowCount) {
                const error = new Error("El proyecto seleccionado no existe o pertenece a otro cliente."); error.code = "PROYECTO_INVALIDO"; throw error;
            }
        }
        const result = await client.query(`
            INSERT INTO venta (monto_total, id_cliente, id_cotizacion, id_proyecto)
            VALUES ($1, $2, $3, $4)
            RETURNING id_venta
        `, [cotizacion.monto_total, cotizacion.id_cliente, cotizacion.id_cotizacion, datos.id_proyecto || null]);
        const id = result.rows[0].id_venta;
        await client.query("COMMIT");
        return obtenerPorId(id);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function cambiarEstado(id, estado) {
    const result = await pool.query(`
        UPDATE venta SET estado = $1 WHERE id_venta = $2 RETURNING id_venta
    `, [estado, id]);
    return result.rowCount ? obtenerPorId(id) : null;
}

module.exports = { listar, obtenerPorId, cotizacionesDisponibles, proyectos, resumen, crear, cambiarEstado };
