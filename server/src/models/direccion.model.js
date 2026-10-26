const pool = require("../config/database");

async function obtenerEquipo() {
    const { rows } = await pool.query(`
      SELECT u.id_usuario,u.nombres,u.apellidos,u.email,u.cargo,u.area,r.nombre AS rol,
             COUNT(t.id_tarea) FILTER (WHERE t.estado <> 'Completada')::INT AS tareas_activas,
             COUNT(t.id_tarea) FILTER (WHERE t.estado = 'Completada')::INT AS tareas_completadas,
             COUNT(t.id_tarea)::INT AS tareas_asignadas,
             COUNT(t.id_tarea) FILTER (
               WHERE t.estado <> 'Completada' AND t.prioridad='Urgente'
             )::INT AS tareas_urgentes_activas,
             COUNT(t.id_tarea) FILTER (
               WHERE t.estado <> 'Completada' AND t.fecha_limite < CURRENT_DATE
             )::INT AS tareas_vencidas,
             COUNT(t.id_tarea) FILTER (
               WHERE t.estado <> 'Completada' AND t.prioridad='Urgente' AND t.fecha_limite < CURRENT_DATE
             )::INT AS tareas_urgentes_vencidas,
             COUNT(t.id_tarea) FILTER (
               WHERE t.estado <> 'Completada'
                 AND t.fecha_limite BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
             )::INT AS tareas_proximas
      FROM usuario u
      LEFT JOIN rol r ON r.id_rol=u.id_rol
      LEFT JOIN tarea t ON t.id_usuario=u.id_usuario
      WHERE u.estado='Activo'
      GROUP BY u.id_usuario,r.nombre
      ORDER BY tareas_activas DESC,u.apellidos,u.nombres`);
    return rows;
}

async function obtenerAlertasGerenciales() {
    const [proyectos, ordenes, productos, pagos, ventasPorFacturar, cotizaciones, campaniasBajoRendimiento, campaniasPorFinalizar] = await Promise.all([
        pool.query(`SELECT id_proyecto,nombre,fecha_fin,id_usuario FROM proyecto
            WHERE estado NOT IN ('Completado','Cancelado') AND fecha_fin < CURRENT_DATE
            ORDER BY fecha_fin LIMIT 100`),
        pool.query(`SELECT o.id_orden,o.codigo,o.titulo,o.fecha_entrega,o.id_usuario,p.nombre AS proyecto,
                CONCAT_WS(' ',u.nombres,u.apellidos) AS responsable
            FROM orden_produccion o JOIN proyecto p ON p.id_proyecto=o.id_proyecto
            LEFT JOIN usuario u ON u.id_usuario=o.id_usuario
            WHERE o.estado_flujo <> 'Finalizado' AND o.fecha_entrega < CURRENT_DATE
            ORDER BY o.fecha_entrega LIMIT 100`),
        pool.query(`SELECT id_producto,codigo,nombre,stock_actual,stock_minimo FROM producto
            WHERE estado='Activo' AND stock_actual <= stock_minimo
            ORDER BY stock_actual, nombre LIMIT 100`),
        pool.query(`SELECT pg.id_pago,pg.codigo,pg.monto,pg.fecha_vencimiento,
                cl.razon_social_nombres AS cliente
            FROM pago pg JOIN cliente cl ON cl.id_cliente=pg.id_cliente
            WHERE pg.estado IN ('Pendiente','Vencido') AND pg.fecha_vencimiento < CURRENT_DATE
            ORDER BY pg.fecha_vencimiento LIMIT 100`),
        pool.query(`SELECT v.id_venta,v.codigo,v.fecha,v.monto_total,q.id_usuario,cl.razon_social_nombres AS cliente
            FROM venta v JOIN cliente cl ON cl.id_cliente=v.id_cliente
            JOIN cotizacion q ON q.id_cotizacion=v.id_cotizacion
            WHERE v.estado='Por facturar'
            ORDER BY v.fecha LIMIT 100`),
        pool.query(`SELECT c.id_cotizacion,c.codigo,c.id_usuario,c.fecha_vencimiento,
                cl.razon_social_nombres AS cliente,(c.fecha_vencimiento-CURRENT_DATE)::INT AS dias_restantes
            FROM cotizacion c JOIN cliente cl ON cl.id_cliente=c.id_cliente
            WHERE c.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
              AND c.estado NOT IN ('Aprobada','Rechazada','Vencida')
            ORDER BY c.fecha_vencimiento LIMIT 100`),
        pool.query(`SELECT c.id_campania,c.nombre,c.id_usuario,c.fecha_fin,cl.razon_social_nombres AS cliente
            FROM campania c JOIN cliente cl ON cl.id_cliente=c.id_cliente
            WHERE c.estado='Bajo rendimiento'
            ORDER BY c.fecha_fin NULLS LAST,c.nombre LIMIT 100`),
        pool.query(`SELECT c.id_campania,c.nombre,c.id_usuario,c.fecha_fin,cl.razon_social_nombres AS cliente,
                (c.fecha_fin-CURRENT_DATE)::INT AS dias_restantes
            FROM campania c JOIN cliente cl ON cl.id_cliente=c.id_cliente
            WHERE c.estado='Activa' AND c.fecha_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
            ORDER BY c.fecha_fin LIMIT 100`),
    ]);
    return {
        proyectos: proyectos.rows,
        ordenes: ordenes.rows,
        productos: productos.rows,
        pagos: pagos.rows,
        ventasPorFacturar: ventasPorFacturar.rows,
        cotizaciones: cotizaciones.rows,
        campaniasBajoRendimiento: campaniasBajoRendimiento.rows,
        campaniasPorFinalizar: campaniasPorFinalizar.rows,
    };
}

module.exports = { obtenerEquipo, obtenerAlertasGerenciales };
