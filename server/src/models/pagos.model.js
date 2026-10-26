const pool = require("../config/database");

async function listar(filtros = {}) {
    const values = []; const where = [];
    if (filtros.q) {
        values.push(`%${filtros.q}%`); const p = `$${values.length}`;
        where.push(`(pg.codigo ILIKE ${p} OR cl.razon_social_nombres ILIKE ${p} OR COALESCE(v.codigo,'') ILIKE ${p} OR COALESCE(pr.nombre,'') ILIKE ${p})`);
    }
    if (filtros.estado) { values.push(filtros.estado); where.push(`pg.estado=$${values.length}`); }
    const { rows } = await pool.query(`
      SELECT pg.id_pago,pg.codigo,pg.monto,pg.fecha,pg.fecha_vencimiento,pg.metodo_pago,pg.estado,
             pg.id_cliente,cl.razon_social_nombres AS cliente,pg.id_venta,v.codigo AS venta,
             pg.id_proyecto,pr.nombre AS proyecto
      FROM pago pg JOIN cliente cl ON cl.id_cliente=pg.id_cliente
      LEFT JOIN venta v ON v.id_venta=pg.id_venta
      LEFT JOIN proyecto pr ON pr.id_proyecto=pg.id_proyecto
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY pg.fecha DESC,pg.id_pago DESC LIMIT 1000`, values);
    return rows;
}

async function resumen() {
    const { rows } = await pool.query(`SELECT
      COALESCE(SUM(monto) FILTER(WHERE estado='Pagado' AND fecha>=date_trunc('month',CURRENT_DATE)::DATE),0) AS cobrado_mes,
      COALESCE(SUM(monto) FILTER(WHERE estado IN ('Pendiente','Vencido')),0) AS pendiente_cobro,
      COUNT(*)::INT AS pagos_registrados,
      COUNT(*) FILTER(WHERE estado='Vencido')::INT AS pagos_vencidos
      FROM pago WHERE estado<>'Anulado'`);
    return rows[0];
}

async function catalogos() {
    const [clientes, ventas, proyectos] = await Promise.all([
        pool.query("SELECT id_cliente,razon_social_nombres AS nombre FROM cliente WHERE estado='Activo' ORDER BY razon_social_nombres"),
        pool.query(`SELECT v.id_venta,v.codigo,v.id_cliente,v.monto_total,
              COALESCE(SUM(pg.monto) FILTER(WHERE pg.estado<>'Anulado'),0) AS monto_pagado,
              GREATEST(v.monto_total-COALESCE(SUM(pg.monto) FILTER(WHERE pg.estado<>'Anulado'),0),0) AS saldo_pendiente
            FROM venta v
            LEFT JOIN LATERAL (
              SELECT p.id_proyecto FROM proyecto p
              WHERE p.id_proyecto=v.id_proyecto OR (v.id_cotizacion IS NOT NULL AND p.id_cotizacion=v.id_cotizacion)
              ORDER BY CASE WHEN p.id_proyecto=v.id_proyecto THEN 0 ELSE 1 END LIMIT 1
            ) pr ON TRUE
            LEFT JOIN pago pg ON pg.id_venta=v.id_venta OR (pr.id_proyecto IS NOT NULL AND pg.id_proyecto=pr.id_proyecto)
            WHERE v.estado<>'Anulada'
            GROUP BY v.id_venta
            HAVING v.monto_total>COALESCE(SUM(pg.monto) FILTER(WHERE pg.estado<>'Anulado'),0)
            ORDER BY v.fecha DESC`),
        pool.query(`SELECT p.id_proyecto,p.nombre,p.id_cliente,
              COALESCE(v.monto_total,q.monto_total,p.presupuesto) AS monto_total,
              COALESCE(SUM(pg.monto) FILTER(WHERE pg.estado<>'Anulado'),0) AS monto_pagado,
              GREATEST(COALESCE(v.monto_total,q.monto_total,p.presupuesto,0)-COALESCE(SUM(pg.monto) FILTER(WHERE pg.estado<>'Anulado'),0),0) AS saldo_pendiente
            FROM proyecto p
            LEFT JOIN cotizacion q ON q.id_cotizacion=p.id_cotizacion
            LEFT JOIN LATERAL (
              SELECT v0.id_venta,v0.monto_total FROM venta v0
              WHERE v0.id_proyecto=p.id_proyecto OR (p.id_cotizacion IS NOT NULL AND v0.id_cotizacion=p.id_cotizacion)
              ORDER BY CASE WHEN v0.id_proyecto=p.id_proyecto THEN 0 ELSE 1 END LIMIT 1
            ) v ON TRUE
            LEFT JOIN pago pg ON pg.id_proyecto=p.id_proyecto OR (v.id_venta IS NOT NULL AND pg.id_venta=v.id_venta)
            WHERE p.estado<>'Cancelado'
            GROUP BY p.id_proyecto,q.monto_total,v.monto_total
            HAVING COALESCE(v.monto_total,q.monto_total,p.presupuesto,0)>COALESCE(SUM(pg.monto) FILTER(WHERE pg.estado<>'Anulado'),0)
            ORDER BY p.nombre`),
    ]);
    return { clientes: clientes.rows, ventas: ventas.rows, proyectos: proyectos.rows };
}

async function crear(datos) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        let referencia; let montoTotal; let idProyectoVinculado = datos.id_proyecto || null; let idVentaVinculada = datos.id_venta || null;
        if (datos.id_venta) {
            const result = await client.query(`SELECT v.id_venta,v.id_cliente,v.monto_total,v.id_proyecto,v.id_cotizacion
                FROM venta v WHERE v.id_venta=$1 AND v.estado<>'Anulada' FOR UPDATE`, [datos.id_venta]);
            referencia = result.rows[0] || null;
            if (referencia) {
                montoTotal = Number(referencia.monto_total);
                const linked = await client.query(`SELECT id_proyecto FROM proyecto
                    WHERE id_proyecto=$1 OR ($2::BIGINT IS NOT NULL AND id_cotizacion=$2)
                    ORDER BY CASE WHEN id_proyecto=$1 THEN 0 ELSE 1 END LIMIT 1 FOR UPDATE`,
                [referencia.id_proyecto, referencia.id_cotizacion]);
                idProyectoVinculado = linked.rows[0]?.id_proyecto || null;
            }
        } else {
            const result = await client.query(`SELECT p.id_proyecto,p.id_cliente,p.presupuesto,p.id_cotizacion,q.monto_total AS monto_cotizacion,
                    v.id_venta,v.monto_total AS monto_venta
                FROM proyecto p LEFT JOIN cotizacion q ON q.id_cotizacion=p.id_cotizacion
                LEFT JOIN LATERAL (
                    SELECT v0.id_venta,v0.monto_total FROM venta v0
                    WHERE v0.id_proyecto=p.id_proyecto OR (p.id_cotizacion IS NOT NULL AND v0.id_cotizacion=p.id_cotizacion)
                    ORDER BY CASE WHEN v0.id_proyecto=p.id_proyecto THEN 0 ELSE 1 END LIMIT 1
                ) v ON TRUE
                WHERE p.id_proyecto=$1 AND p.estado<>'Cancelado' FOR UPDATE OF p`, [datos.id_proyecto]);
            referencia = result.rows[0] || null;
            if (referencia) {
                montoTotal = Number(referencia.monto_venta ?? referencia.monto_cotizacion ?? referencia.presupuesto);
                idVentaVinculada = referencia.id_venta || null;
            }
        }
        if (!referencia) { const error = new Error("La venta o el proyecto ya no está disponible."); error.code = "REFERENCIA_PAGO_INVALIDA"; throw error; }
        if (Number(referencia.id_cliente) !== Number(datos.id_cliente)) { const error = new Error("El cliente debe coincidir con el cliente de la venta o del proyecto."); error.code = "CLIENTE_PAGO_INVALIDO"; throw error; }
        if (!Number.isFinite(montoTotal) || montoTotal <= 0) { const error = new Error("El destino no tiene un importe total definido para calcular sus cuotas."); error.code = "DESTINO_SIN_TOTAL"; throw error; }

        const saldoResult = idProyectoVinculado
            ? await client.query(`SELECT COALESCE(SUM(monto),0) AS usado FROM pago
                WHERE estado<>'Anulado' AND (id_proyecto=$1 OR ($2::BIGINT IS NOT NULL AND id_venta=$2))`, [idProyectoVinculado,idVentaVinculada])
            : await client.query("SELECT COALESCE(SUM(monto),0) AS usado FROM pago WHERE estado<>'Anulado' AND id_venta=$1", [idVentaVinculada]);
        const usado = Number(saldoResult.rows[0].usado);
        const saldo = Math.max(0, Number((montoTotal-usado).toFixed(2)));
        if (Number(Number(datos.monto).toFixed(2)) > saldo) {
            const error = new Error(`El pago supera el saldo pendiente de S/ ${saldo.toFixed(2)}.`);
            error.code = "SALDO_INSUFICIENTE";
            throw error;
        }

        const inserted = await client.query(`INSERT INTO pago(monto,fecha,fecha_vencimiento,metodo_pago,estado,id_cliente,id_venta,id_proyecto)
            VALUES($1,COALESCE($2::DATE,CURRENT_DATE),$3,$4,$5,$6,$7,$8) RETURNING *`,
        [datos.monto,datos.fecha,datos.fecha_vencimiento,datos.metodo_pago,datos.estado,datos.id_cliente,datos.id_venta,datos.id_proyecto]);
        await client.query("COMMIT");
        return inserted.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally { client.release(); }
}

async function cambiarEstado(id, estado) {
    const { rows } = await pool.query("UPDATE pago SET estado=$1 WHERE id_pago=$2 RETURNING *", [estado,id]);
    return rows[0] || null;
}

async function marcarVencidos() {
    const { rowCount } = await pool.query("UPDATE pago SET estado='Vencido' WHERE estado='Pendiente' AND fecha_vencimiento < CURRENT_DATE");
    return rowCount;
}

module.exports = { listar, resumen, catalogos, crear, cambiarEstado, marcarVencidos };
