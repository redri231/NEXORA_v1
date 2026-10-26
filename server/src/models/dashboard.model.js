const pool = require("../config/database");

async function indicadoresClientes() {
    return (await pool.query("SELECT COUNT(*)::INT AS clientes_activos FROM cliente WHERE estado='Activo'")).rows[0];
}

async function indicadoresLeads() {
    return (await pool.query("SELECT COUNT(*)::INT AS leads_activos FROM cliente_potencial WHERE estado='Activo'")).rows[0];
}

async function indicadoresCotizaciones() {
    return (await pool.query(`SELECT COUNT(*) FILTER(WHERE estado IN ('Borrador','Enviada','En negociación'))::INT AS cotizaciones_pendientes,
        COUNT(*) FILTER(WHERE estado NOT IN ('Aprobada','Rechazada','Vencida') AND fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE+7)::INT AS cotizaciones_por_vencer
        FROM cotizacion`)).rows[0];
}

async function clientesPorMes() {
    return (await pool.query(`WITH meses AS (
        SELECT generate_series(date_trunc('month',CURRENT_DATE)-INTERVAL '5 months',date_trunc('month',CURRENT_DATE),INTERVAL '1 month')::DATE AS mes
    ) SELECT m.mes,COUNT(c.id_cliente)::INT AS clientes FROM meses m
      LEFT JOIN cliente c ON date_trunc('month',c.fecha_registro)=m.mes
      GROUP BY m.mes ORDER BY m.mes`)).rows;
}

async function indicadoresProyectos() {
    return (await pool.query(`SELECT COUNT(*) FILTER(WHERE estado IN ('Planificación','En ejecución','En revisión','Atrasado'))::INT AS proyectos_activos,
        COUNT(*) FILTER(WHERE estado='Atrasado')::INT AS proyectos_atrasados FROM proyecto`)).rows[0];
}

async function indicadoresTareas() {
    return (await pool.query(`SELECT COUNT(*) FILTER(WHERE estado<>'Completada')::INT AS tareas_pendientes,
        COUNT(*) FILTER(WHERE estado<>'Completada' AND fecha_limite=CURRENT_DATE)::INT AS tareas_para_hoy,
        COUNT(*) FILTER(WHERE estado<>'Completada' AND fecha_limite<CURRENT_DATE)::INT AS tareas_vencidas FROM tarea`)).rows[0];
}

async function proyectosPorEstado() {
    return (await pool.query("SELECT estado,COUNT(*)::INT AS cantidad FROM proyecto GROUP BY estado ORDER BY estado")).rows;
}

async function tareasPorColaborador() {
    return (await pool.query(`SELECT u.id_usuario,CONCAT_WS(' ',u.nombres,u.apellidos) AS responsable,
        COUNT(t.id_tarea) FILTER(WHERE t.estado='Completada')::INT AS completadas,
        COUNT(t.id_tarea) FILTER(WHERE t.estado<>'Completada')::INT AS pendientes
        FROM usuario u LEFT JOIN tarea t ON t.id_usuario=u.id_usuario
        WHERE u.estado='Activo' GROUP BY u.id_usuario,u.nombres,u.apellidos
        HAVING COUNT(t.id_tarea)>0 ORDER BY pendientes DESC,responsable LIMIT 8`)).rows;
}

async function rendimientoCampanias() {
    const [indicadores, rendimiento] = await Promise.all([
        pool.query(`SELECT COUNT(*) FILTER(WHERE c.estado='Activa')::INT AS campanias_activas,
            COALESCE(AVG(i.roi),0)::NUMERIC(8,2) AS roi_promedio
            FROM campania c LEFT JOIN LATERAL (SELECT roi FROM indicador_campania WHERE id_campania=c.id_campania ORDER BY fecha_registro DESC,id_indicador DESC LIMIT 1) i ON TRUE`),
        pool.query(`SELECT c.id_campania,c.nombre,cl.razon_social_nombres AS cliente,i.roi
            FROM campania c JOIN cliente cl ON cl.id_cliente=c.id_cliente
            JOIN LATERAL (SELECT roi FROM indicador_campania WHERE id_campania=c.id_campania ORDER BY fecha_registro DESC,id_indicador DESC LIMIT 1) i ON TRUE
            ORDER BY i.roi DESC NULLS LAST,c.nombre LIMIT 6`),
    ]);
    return { ...indicadores.rows[0], rendimiento: rendimiento.rows };
}

async function finanzas() {
    const [resumen, serie] = await Promise.all([
        pool.query("SELECT * FROM v_finanzas_resumen_mes"),
        pool.query(`WITH meses AS (SELECT generate_series(date_trunc('month',CURRENT_DATE)-INTERVAL '5 months',date_trunc('month',CURRENT_DATE),INTERVAL '1 month')::DATE AS mes)
            SELECT m.mes,COALESCE(SUM(ig.monto) FILTER(WHERE ig.tipo='Ingreso' AND ig.estado='Cobrado'),0)::NUMERIC(12,2) AS ingresos,
            COALESCE(SUM(ig.monto) FILTER(WHERE ig.tipo='Gasto' AND ig.estado='Pagado'),0)::NUMERIC(12,2) AS gastos
            FROM meses m LEFT JOIN ingreso_gasto ig ON date_trunc('month',ig.fecha)=m.mes AND ig.estado IN ('Cobrado','Pagado')
            GROUP BY m.mes ORDER BY m.mes`),
    ]);
    return { resumen: resumen.rows[0] || {}, serie: serie.rows };
}

async function inventario() {
    return (await pool.query(`SELECT COUNT(*) FILTER(WHERE estado='Activo')::INT AS productos_activos,
        COUNT(*) FILTER(WHERE estado='Activo' AND stock_actual<=stock_minimo)::INT AS stock_bajo
        FROM producto`)).rows[0];
}

async function actividadReciente(usuario, esGerencia) {
    const values = [];
    const filtro = esGerencia ? "" : `WHERE b.id_usuario=$${values.push(usuario.id_usuario)}`;
    return (await pool.query(`SELECT b.id_bitacora,b.accion,b.entidad,b.descripcion,b.fecha_hora,
        CONCAT_WS(' ',u.nombres,u.apellidos) AS usuario
        FROM bitacora b LEFT JOIN usuario u ON u.id_usuario=b.id_usuario
        ${filtro} ORDER BY b.fecha_hora DESC,b.id_bitacora DESC LIMIT 8`, values)).rows;
}

module.exports = { indicadoresClientes, indicadoresLeads, indicadoresCotizaciones, clientesPorMes, indicadoresProyectos, indicadoresTareas, proyectosPorEstado, tareasPorColaborador, rendimientoCampanias, finanzas, inventario, actividadReciente };
