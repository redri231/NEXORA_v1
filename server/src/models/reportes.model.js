const pool = require("../config/database");

function filtrosFecha(fechaDesde, fechaHasta, expresion, valores, where) {
    if (fechaDesde) { valores.push(fechaDesde); where.push(`${expresion} >= $${valores.length}::DATE`); }
    if (fechaHasta) { valores.push(fechaHasta); where.push(`${expresion} <= $${valores.length}::DATE`); }
}

async function obtenerVentas(f = {}) {
    const values = []; const where = ["v.estado <> 'Anulada'"];
    filtrosFecha(f.fecha_desde, f.fecha_hasta, "v.fecha", values, where);
    if (f.id_cliente) { values.push(f.id_cliente); where.push(`v.id_cliente=$${values.length}`); }
    const { rows } = await pool.query(`
      SELECT date_trunc('month',v.fecha)::DATE AS mes,cl.razon_social_nombres AS cliente,
             COUNT(DISTINCT v.id_venta)::INT AS numero_ventas,
             COUNT(DISTINCT c.id_cotizacion)::INT AS cotizaciones,
             SUM(v.monto_total)::NUMERIC(12,2) AS monto_ventas,
             SUM(COALESCE(pg.monto_pagado,0))::NUMERIC(12,2) AS monto_cobrado
      FROM venta v
      JOIN cliente cl ON cl.id_cliente=v.id_cliente
      JOIN cotizacion c ON c.id_cotizacion=v.id_cotizacion
      LEFT JOIN LATERAL (
        SELECT SUM(p.monto) AS monto_pagado FROM pago p
        WHERE p.id_venta=v.id_venta AND p.estado='Pagado'
      ) pg ON TRUE
      WHERE ${where.join(" AND ")}
      GROUP BY date_trunc('month',v.fecha),cl.id_cliente,cl.razon_social_nombres
      ORDER BY mes DESC,monto_ventas DESC,cliente`, values);
    return rows;
}

async function obtenerProyectos(f = {}) {
    const values = []; const where = [];
    filtrosFecha(f.fecha_desde, f.fecha_hasta, "COALESCE(p.fecha_entrega_real,p.fecha_fin,p.fecha_inicio)", values, where);
    if (f.id_cliente) { values.push(f.id_cliente); where.push(`p.id_cliente=$${values.length}`); }
    if (f.area) { values.push(f.area); where.push(`u.area=$${values.length}`); }
    const { rows } = await pool.query(`
      SELECT p.id_proyecto,p.nombre AS proyecto,cl.razon_social_nombres AS cliente,
             p.estado,p.avance,p.fecha_inicio,p.fecha_fin,p.fecha_entrega_real,
             CONCAT_WS(' ',u.nombres,u.apellidos) AS responsable,u.area,
             COUNT(DISTINCT t.id_tarea)::INT AS tareas,
             COUNT(DISTINCT t.id_tarea) FILTER (WHERE t.estado='Completada')::INT AS tareas_completadas
      FROM proyecto p JOIN cliente cl ON cl.id_cliente=p.id_cliente
      JOIN usuario u ON u.id_usuario=p.id_usuario LEFT JOIN tarea t ON t.id_proyecto=p.id_proyecto
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      GROUP BY p.id_proyecto,cl.razon_social_nombres,u.nombres,u.apellidos,u.area
      ORDER BY COALESCE(p.fecha_entrega_real,p.fecha_fin,p.fecha_inicio) DESC NULLS LAST,p.nombre`, values);
    return rows;
}

async function obtenerInventario() {
    // La vista aporta el inventario activo; se aplica <= para coincidir con Logística y Dirección.
    return (await pool.query(`SELECT id_producto,codigo,nombre,categoria,stock_actual,stock_minimo,proveedores,
      CASE WHEN stock_actual <= stock_minimo THEN 'Stock bajo' ELSE 'Disponible' END AS estado_stock
      FROM v_inventario ORDER BY nombre`)).rows;
}

async function obtenerFinanzas(f = {}) {
    const values = []; const where = [];
    filtrosFecha(f.fecha_desde, f.fecha_hasta, "ig.fecha", values, where);
    if (f.id_cliente) { values.push(f.id_cliente); where.push(`ig.id_cliente=$${values.length}`); }
    const { rows } = await pool.query(`
      SELECT date_trunc('month',ig.fecha)::DATE AS mes,ig.tipo,ig.estado,
             COUNT(*)::INT AS movimientos,SUM(ig.monto)::NUMERIC(12,2) AS monto_total
      FROM ingreso_gasto ig ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      GROUP BY date_trunc('month',ig.fecha),ig.tipo,ig.estado
      ORDER BY mes DESC,ig.tipo,ig.estado`, values);
    return rows;
}

async function obtenerProductividad(f = {}) {
    const values = []; const joins = [];
    if (f.fecha_desde) { values.push(f.fecha_desde); joins.push(`t.fecha_creacion >= $${values.length}::DATE`); }
    if (f.fecha_hasta) { values.push(f.fecha_hasta); joins.push(`t.fecha_creacion < ($${values.length}::DATE + INTERVAL '1 day')`); }
    if (f.area) { values.push(f.area); }
    const where = ["u.estado='Activo'"];
    if (f.area) where.push(`u.area=$${values.length}`);
    const { rows } = await pool.query(`
      SELECT u.id_usuario,CONCAT_WS(' ',u.nombres,u.apellidos) AS responsable,u.cargo,u.area,
             COUNT(t.id_tarea)::INT AS tareas,
             COUNT(t.id_tarea) FILTER (WHERE t.estado='Completada')::INT AS tareas_completadas,
             COUNT(t.id_tarea) FILTER (WHERE t.estado<>'Completada')::INT AS tareas_pendientes,
             COUNT(t.id_tarea) FILTER (WHERE t.estado<>'Completada' AND t.prioridad='Urgente')::INT AS urgentes_pendientes,
             (SELECT COUNT(*)::INT FROM tarea ta WHERE ta.id_usuario=u.id_usuario AND ta.estado<>'Completada') AS tareas_activas_actuales,
             (SELECT COUNT(*)::INT FROM tarea ta WHERE ta.id_usuario=u.id_usuario AND ta.estado<>'Completada' AND ta.prioridad='Urgente') AS urgentes_activas_actuales
      FROM usuario u LEFT JOIN tarea t ON t.id_usuario=u.id_usuario ${joins.length ? `AND ${joins.join(" AND ")}` : ""}
      WHERE ${where.join(" AND ")}
      GROUP BY u.id_usuario,u.nombres,u.apellidos,u.cargo,u.area
      ORDER BY tareas_pendientes DESC,responsable`, values);
    return rows;
}

async function catalogos() {
    const [clientes, areas] = await Promise.all([
        pool.query("SELECT id_cliente,razon_social_nombres AS nombre FROM cliente WHERE estado='Activo' ORDER BY razon_social_nombres"),
        pool.query("SELECT DISTINCT area AS nombre FROM usuario WHERE estado='Activo' AND NULLIF(BTRIM(area),'') IS NOT NULL ORDER BY area"),
    ]);
    return { clientes: clientes.rows, areas: areas.rows.map((row) => row.nombre) };
}

async function registrarGenerado(data, idUsuario) {
    const nombre = `${data.tipo} · ${data.fecha_desde || "sin inicio"} – ${data.fecha_hasta || "sin fin"}`.slice(0, 150);
    return (await pool.query(`INSERT INTO reporte_generado(nombre,tipo,fecha_desde,fecha_hasta,area,id_cliente,id_usuario)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id_reporte,nombre,tipo,fecha_desde,fecha_hasta,area,id_cliente,id_usuario,fecha_generacion`,
    [nombre,data.tipo,data.fecha_desde || null,data.fecha_hasta || null,data.area || null,data.id_cliente || null,idUsuario])).rows[0];
}

async function listarGenerados(idUsuario, verTodos = false) {
    const values = [];
    const where = verTodos ? "" : `WHERE rg.id_usuario=$${values.push(idUsuario)}`;
    return (await pool.query(`SELECT rg.id_reporte,rg.nombre,rg.tipo,rg.fecha_desde,rg.fecha_hasta,rg.area,rg.id_cliente,
      cl.razon_social_nombres AS cliente,rg.id_usuario,CONCAT_WS(' ',u.nombres,u.apellidos) AS usuario,rg.fecha_generacion
      FROM reporte_generado rg JOIN usuario u ON u.id_usuario=rg.id_usuario
      LEFT JOIN cliente cl ON cl.id_cliente=rg.id_cliente ${where}
      ORDER BY rg.fecha_generacion DESC,rg.id_reporte DESC LIMIT 30`, values)).rows;
}

module.exports = { obtenerVentas, obtenerProyectos, obtenerInventario, obtenerFinanzas, obtenerProductividad, catalogos, registrarGenerado, listarGenerados };
