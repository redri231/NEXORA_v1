const pool = require("../config/database");

async function resumen() {
    const { rows } = await pool.query("SELECT * FROM v_finanzas_resumen_mes");
    return rows[0];
}

async function serieMensual() {
    const { rows } = await pool.query(`
      WITH meses AS (SELECT generate_series(date_trunc('month',CURRENT_DATE)-INTERVAL '5 months',date_trunc('month',CURRENT_DATE),INTERVAL '1 month')::DATE AS mes)
      SELECT m.mes,
        COALESCE(SUM(ig.monto) FILTER (WHERE ig.tipo='Ingreso' AND ig.estado='Cobrado'),0) AS ingresos,
        COALESCE(SUM(ig.monto) FILTER (WHERE ig.tipo='Gasto' AND ig.estado='Pagado'),0) AS gastos
      FROM meses m LEFT JOIN ingreso_gasto ig ON date_trunc('month',ig.fecha)=m.mes AND ig.estado IN ('Cobrado','Pagado')
      GROUP BY m.mes ORDER BY m.mes`);
    return rows;
}

async function listarMovimientos(f = {}) {
    const values = []; const where = [];
    if (f.q) { values.push(`%${f.q}%`); const p = `$${values.length}`; where.push(`(ig.descripcion ILIKE ${p} OR COALESCE(ig.categoria,'') ILIKE ${p} OR COALESCE(cl.razon_social_nombres,'') ILIKE ${p} OR COALESCE(pr.nombre,'') ILIKE ${p} OR COALESCE(proy.nombre,'') ILIKE ${p} OR COALESCE(pg.codigo,'') ILIKE ${p})`); }
    if (f.tipo) { values.push(f.tipo); where.push(`ig.tipo=$${values.length}`); }
    if (f.estado) { values.push(f.estado); where.push(`ig.estado=$${values.length}`); }
    if (f.desde) { values.push(f.desde); where.push(`ig.fecha >= $${values.length}::DATE`); }
    if (f.hasta) { values.push(f.hasta); where.push(`ig.fecha <= $${values.length}::DATE`); }
    const { rows } = await pool.query(`
      SELECT ig.id_movimiento,ig.tipo,ig.categoria,ig.monto,ig.fecha,ig.metodo_pago,ig.descripcion,ig.estado,
             ig.id_cliente,cl.razon_social_nombres AS cliente,ig.id_proyecto,proy.nombre AS proyecto,
             ig.id_proveedor,pr.nombre AS proveedor,ig.id_pago,pg.codigo AS codigo_pago
      FROM ingreso_gasto ig LEFT JOIN cliente cl ON cl.id_cliente=ig.id_cliente
      LEFT JOIN proyecto proy ON proy.id_proyecto=ig.id_proyecto
      LEFT JOIN proveedor pr ON pr.id_proveedor=ig.id_proveedor
      LEFT JOIN pago pg ON pg.id_pago=ig.id_pago
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY ig.fecha DESC,ig.id_movimiento DESC LIMIT 1000`, values);
    return rows;
}

async function crearGasto(data) {
    const { rows } = await pool.query(`INSERT INTO ingreso_gasto(tipo,categoria,monto,fecha,metodo_pago,descripcion,estado,id_cliente,id_proyecto,id_proveedor)
      VALUES('Gasto',$1,$2,COALESCE($3::DATE,CURRENT_DATE),$4,$5,$6,$7,$8,$9) RETURNING *`,
    [data.categoria,data.monto,data.fecha,data.metodo_pago,data.descripcion,data.estado,data.id_cliente,data.id_proyecto,data.id_proveedor]);
    return rows[0];
}

async function cambiarEstadoGasto(id, estado) {
    const { rows } = await pool.query(`UPDATE ingreso_gasto SET estado=$1 WHERE id_movimiento=$2 AND tipo='Gasto' RETURNING *`, [estado,id]);
    return rows[0] || null;
}

async function catalogosGastos() {
    const [clientes, proyectos, proveedores] = await Promise.all([
      pool.query("SELECT id_cliente,razon_social_nombres AS nombre FROM cliente WHERE estado='Activo' ORDER BY razon_social_nombres"),
      pool.query("SELECT id_proyecto,nombre,id_cliente FROM proyecto WHERE estado NOT IN ('Completado','Cancelado') ORDER BY nombre"),
      pool.query("SELECT id_proveedor,nombre FROM proveedor WHERE estado='Activo' ORDER BY nombre"),
    ]);
    return { clientes:clientes.rows, proyectos:proyectos.rows, proveedores:proveedores.rows };
}

module.exports = { resumen, serieMensual, listarMovimientos, crearGasto, cambiarEstadoGasto, catalogosGastos };
