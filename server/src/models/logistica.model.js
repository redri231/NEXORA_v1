const pool = require("../config/database");

const PRODUCTO_SELECT = `SELECT p.id_producto,p.codigo,p.nombre,p.categoria,p.unidad_medida,p.ubicacion,p.stock_actual,p.stock_minimo,p.estado,p.imagen_url,
    COALESCE(json_agg(json_build_object('id_proveedor',pr.id_proveedor,'nombre',pr.nombre,'estado',pr.estado)) FILTER (WHERE pr.id_proveedor IS NOT NULL),'[]') AS proveedores
    FROM producto p LEFT JOIN proveedor_producto pp ON pp.id_producto=p.id_producto LEFT JOIN proveedor pr ON pr.id_proveedor=pp.id_proveedor`;

async function listarProductos(f = {}) {
    const values = []; const where = [];
    if (f.q) { values.push(`%${f.q}%`); where.push(`(p.codigo ILIKE $${values.length} OR p.nombre ILIKE $${values.length} OR COALESCE(p.categoria,'') ILIKE $${values.length} OR COALESCE(p.ubicacion,'') ILIKE $${values.length})`); }
    if (f.estado && f.estado !== "Todos") { values.push(f.estado); where.push(`p.estado=$${values.length}`); }
    if (f.stock_bajo === "true") where.push("p.stock_actual <= p.stock_minimo");
    return (await pool.query(`${PRODUCTO_SELECT} ${where.length ? `WHERE ${where.join(" AND ")}` : ""} GROUP BY p.id_producto ORDER BY p.nombre`, values)).rows;
}
async function obtenerProducto(id) { return (await pool.query(`${PRODUCTO_SELECT} WHERE p.id_producto=$1 GROUP BY p.id_producto`, [id])).rows[0] || null; }
async function guardarProducto(datos, id = null, idUsuarioActor = null) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        let productId;
        if (id) {
            const result = await client.query(`UPDATE producto SET codigo=$1,nombre=$2,categoria=$3,unidad_medida=$4,ubicacion=$5,stock_minimo=$6,estado=$7,imagen_url=$8 WHERE id_producto=$9 RETURNING id_producto`,
                [datos.codigo,datos.nombre,datos.categoria,datos.unidad_medida,datos.ubicacion,datos.stock_minimo,datos.estado,datos.imagen_url ?? null,id]);
            if (!result.rowCount) { await client.query("ROLLBACK"); return null; }
            productId = result.rows[0].id_producto;
            await client.query("DELETE FROM proveedor_producto WHERE id_producto=$1", [productId]);
        } else {
            const result = await client.query(`INSERT INTO producto(codigo,nombre,categoria,unidad_medida,ubicacion,stock_minimo,estado,imagen_url) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id_producto`,
                [datos.codigo,datos.nombre,datos.categoria,datos.unidad_medida,datos.ubicacion,datos.stock_minimo,datos.estado,datos.imagen_url ?? null]);
            productId = result.rows[0].id_producto;
            if (datos.stock_inicial > 0) {
                await client.query(`INSERT INTO movimiento_almacen(tipo,cantidad,referencia,id_producto,id_usuario) VALUES('Entrada',$1,'Stock inicial del producto',$2,$3)`,
                    [datos.stock_inicial, productId, idUsuarioActor]);
            }
        }
        if (datos.id_proveedores.length) {
            await client.query(`INSERT INTO proveedor_producto(id_producto,id_proveedor) SELECT $1,id_proveedor FROM proveedor WHERE id_proveedor=ANY($2::BIGINT[])`, [productId, datos.id_proveedores]);
            const linked = await client.query("SELECT COUNT(*)::INT AS total FROM proveedor_producto WHERE id_producto=$1", [productId]);
            if (linked.rows[0].total !== datos.id_proveedores.length) { const e = new Error("Selecciona proveedores existentes."); e.code = "PROVEEDOR_INVALIDO"; throw e; }
        }
        await client.query("COMMIT"); return productId;
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
}
async function listarProveedores({ q, estado } = {}) {
    const values = []; const where = [];
    if (q) { values.push(`%${q}%`); where.push(`(nombre ILIKE $${values.length} OR COALESCE(contacto,'') ILIKE $${values.length} OR COALESCE(email,'') ILIKE $${values.length} OR COALESCE(telefono,'') ILIKE $${values.length})`); }
    if (estado && estado !== "Todos") { values.push(estado); where.push(`estado=$${values.length}`); }
    return (await pool.query(`SELECT pr.*,COUNT(pp.id_producto)::INT AS productos_asociados FROM proveedor pr LEFT JOIN proveedor_producto pp USING(id_proveedor) ${where.length ? `WHERE ${where.join(" AND ")}` : ""} GROUP BY pr.id_proveedor ORDER BY pr.nombre`, values)).rows;
}
async function guardarProveedor(data, id = null) {
    if (id) { const r = await pool.query(`UPDATE proveedor SET nombre=$1,contacto=$2,telefono=$3,email=$4,direccion=$5 WHERE id_proveedor=$6 RETURNING *`, [data.nombre,data.contacto,data.telefono,data.email,data.direccion,id]); return r.rows[0] || null; }
    return (await pool.query(`INSERT INTO proveedor(nombre,contacto,telefono,email,direccion) VALUES($1,$2,$3,$4,$5) RETURNING *`, [data.nombre,data.contacto,data.telefono,data.email,data.direccion])).rows[0];
}
async function cambiarProveedorEstado(id, estado) { return (await pool.query("UPDATE proveedor SET estado=$1 WHERE id_proveedor=$2 RETURNING *", [estado,id])).rows[0] || null; }
async function catalogos() {
    const [proveedores, productos] = await Promise.all([
        pool.query("SELECT id_proveedor,nombre,estado FROM proveedor ORDER BY nombre"),
        pool.query("SELECT id_producto,codigo,nombre,unidad_medida,stock_actual,stock_minimo FROM producto WHERE estado='Activo' ORDER BY nombre")
    ]);
    return { proveedores: proveedores.rows, productos: productos.rows };
}
async function resumen() {
    return (await pool.query(`SELECT COUNT(*) FILTER(WHERE estado='Activo')::INT AS productos,
      COUNT(*) FILTER(WHERE estado='Activo' AND stock_actual<=stock_minimo)::INT AS stock_bajo,
      (SELECT COUNT(*)::INT FROM movimiento_almacen WHERE tipo='Entrada' AND fecha>=date_trunc('month',CURRENT_DATE)) AS entradas_mes,
      (SELECT COUNT(*)::INT FROM movimiento_almacen WHERE tipo='Salida' AND fecha>=date_trunc('month',CURRENT_DATE)) AS salidas_mes,
      (SELECT COUNT(*)::INT FROM proveedor WHERE estado='Activo') AS proveedores_activos FROM producto`)).rows[0];
}
async function listarMovimientos(f = {}) {
    const values = []; const where = [];
    if (f.q) { values.push(`%${f.q}%`); where.push(`(p.nombre ILIKE $${values.length} OR p.codigo ILIKE $${values.length} OR COALESCE(m.referencia,'') ILIKE $${values.length} OR CONCAT_WS(' ',u.nombres,u.apellidos) ILIKE $${values.length})`); }
    if (f.tipo) { values.push(f.tipo); where.push(`m.tipo=$${values.length}`); }
    return (await pool.query(`SELECT m.*,p.codigo,p.nombre AS producto,CONCAT_WS(' ',u.nombres,u.apellidos) AS usuario FROM movimiento_almacen m JOIN producto p USING(id_producto) JOIN usuario u USING(id_usuario) ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY m.fecha DESC,m.id_movimiento_almacen DESC LIMIT 500`, values)).rows;
}
async function registrarMovimiento(data, idUsuario) {
    return (await pool.query(`INSERT INTO movimiento_almacen(tipo,cantidad,referencia,id_producto,id_usuario) VALUES($1,$2,$3,$4,$5) RETURNING *`, [data.tipo,data.cantidad,data.referencia,data.id_producto,idUsuario])).rows[0];
}
async function listarSolicitudes() {
    return (await pool.query(`SELECT sm.id_solicitud,sm.cantidad_solicitada,sm.estado,sm.fecha,sm.id_producto,sm.id_proyecto,sm.id_campania,p.codigo,p.nombre AS producto,p.unidad_medida,p.stock_actual,pr.nombre AS proyecto,c.nombre AS campania,CONCAT_WS(' ',u.nombres,u.apellidos) AS solicitante
      FROM solicitud_material sm
      JOIN producto p ON p.id_producto=sm.id_producto
      LEFT JOIN proyecto pr ON pr.id_proyecto=sm.id_proyecto
      LEFT JOIN campania c ON c.id_campania=sm.id_campania
      JOIN usuario u ON u.id_usuario=sm.id_usuario
      ORDER BY CASE sm.estado WHEN 'Pendiente' THEN 1 WHEN 'Aprobada' THEN 2 ELSE 3 END,sm.fecha DESC`)).rows;
}
async function cambiarSolicitud(id, estado, idUsuario) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const current = await client.query("SELECT * FROM solicitud_material WHERE id_solicitud=$1 FOR UPDATE", [id]);
        if (!current.rowCount) { await client.query("COMMIT"); return null; }
        const s = current.rows[0];
        const valid = (s.estado === "Pendiente" && ["Aprobada","Rechazada"].includes(estado)) || (s.estado === "Aprobada" && estado === "Entregada");
        if (!valid) { const e = new Error(`No se puede cambiar de ${s.estado} a ${estado}.`); e.code = "TRANSICION_INVALIDA"; throw e; }
        if (estado === "Entregada") {
            await client.query(`INSERT INTO movimiento_almacen(tipo,cantidad,referencia,id_producto,id_usuario) VALUES('Salida',$1,$2,$3,$4)`, [s.cantidad_solicitada,`Solicitud de material #${s.id_solicitud}`,s.id_producto,idUsuario]);
        }
        const updated = await client.query("UPDATE solicitud_material SET estado=$1 WHERE id_solicitud=$2 RETURNING *", [estado,id]);
        await client.query("COMMIT"); return updated.rows[0];
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
}

module.exports = { listarProductos, obtenerProducto, guardarProducto, listarProveedores, guardarProveedor, cambiarProveedorEstado, catalogos, resumen, listarMovimientos, registrarMovimiento, listarSolicitudes, cambiarSolicitud };
