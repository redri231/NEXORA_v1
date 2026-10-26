const pool = require("../config/database");

async function listarRoles() {
    return (await pool.query("SELECT id_rol,nombre,descripcion FROM rol ORDER BY id_rol")).rows;
}

async function listarPermisos() {
    return (await pool.query("SELECT id_permiso,modulo,nombre FROM permiso ORDER BY modulo,nombre")).rows;
}

async function listarMatrizPermisos() {
    return (await pool.query(`SELECT r.id_rol,r.nombre AS rol,p.id_permiso,p.modulo,p.nombre AS accion,
        (rp.id_permiso IS NOT NULL) AS habilitado
        FROM rol r CROSS JOIN permiso p
        LEFT JOIN rol_permiso rp ON rp.id_rol=r.id_rol AND rp.id_permiso=p.id_permiso
        ORDER BY r.id_rol,p.modulo,p.id_permiso`)).rows;
}

async function actualizarPermisosRol(idRol, idsPermisos) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const rol = await client.query("SELECT id_rol,nombre FROM rol WHERE id_rol=$1 FOR UPDATE", [idRol]);
        if (!rol.rowCount) { await client.query("ROLLBACK"); return false; }
        const nombreRol = rol.rows[0].nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (["administrador", "gerencia"].includes(nombreRol)) throw Object.assign(new Error("Los permisos de Administración y Gerencia son fijos por política del sistema."), { code: "ROL_PROTEGIDO" });
        const existentes = await client.query("SELECT id_permiso FROM permiso WHERE id_permiso=ANY($1::int[])", [idsPermisos]);
        if (existentes.rowCount !== idsPermisos.length) throw Object.assign(new Error("Hay permisos seleccionados que no existen."), { code: "PERMISOS_INVALIDOS" });
        await client.query("DELETE FROM rol_permiso WHERE id_rol=$1", [idRol]);
        if (idsPermisos.length) await client.query("INSERT INTO rol_permiso(id_rol,id_permiso) SELECT $1, unnest($2::int[])", [idRol, idsPermisos]);
        await client.query("COMMIT");
        return true;
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
}

async function tienePermiso(nombreRol, modulo, accion) {
    if (nombreRol === "Administrador") return true;
    return (await pool.query(`SELECT EXISTS(
        SELECT 1 FROM rol r JOIN rol_permiso rp USING(id_rol) JOIN permiso p USING(id_permiso)
        WHERE LOWER(TRANSLATE(r.nombre,'áéíóúÁÉÍÓÚ','aeiouAEIOU'))=LOWER(TRANSLATE($1,'áéíóúÁÉÍÓÚ','aeiouAEIOU')) AND p.modulo=$2 AND p.nombre=$3
    ) AS permitido`, [nombreRol, modulo, accion])).rows[0]?.permitido === true;
}

async function listarModulosUsuario(nombreRol) {
    if (nombreRol === "Administrador") return ["*"];
    const filas = (await pool.query(`SELECT DISTINCT p.modulo FROM rol r
        JOIN rol_permiso rp USING(id_rol) JOIN permiso p USING(id_permiso)
        WHERE LOWER(TRANSLATE(r.nombre,'áéíóúÁÉÍÓÚ','aeiouAEIOU'))=LOWER(TRANSLATE($1,'áéíóúÁÉÍÓÚ','aeiouAEIOU')) AND p.nombre='Ver' ORDER BY p.modulo`, [nombreRol])).rows;
    return filas.map((fila) => fila.modulo);
}

async function listarAreas() {
    return (await pool.query("SELECT DISTINCT BTRIM(area) AS nombre FROM usuario WHERE NULLIF(BTRIM(area),'') IS NOT NULL ORDER BY nombre")).rows;
}

async function listarServicios() {
    return (await pool.query("SELECT id_servicio,nombre,categoria,descripcion,precio_base,estado FROM servicio ORDER BY nombre")).rows;
}

async function guardarServicio(datos, id = null) {
    const params = [datos.nombre, datos.categoria || null, datos.descripcion || null, datos.precio_base ?? null, datos.estado || "Activo"];
    if (id) return (await pool.query(`UPDATE servicio SET nombre=$1,categoria=$2,descripcion=$3,precio_base=$4,estado=$5 WHERE id_servicio=$6 RETURNING *`, [...params, id])).rows[0] || null;
    return (await pool.query(`INSERT INTO servicio(nombre,categoria,descripcion,precio_base,estado) VALUES($1,$2,$3,$4,$5) RETURNING *`, params)).rows[0];
}

async function cambiarEstadoServicio(id, estado) {
    return (await pool.query("UPDATE servicio SET estado=$1 WHERE id_servicio=$2 RETURNING *", [estado, id])).rows[0] || null;
}

async function listarConfiguracionNotificaciones() {
    return (await pool.query("SELECT id_config,tipo_alerta,por_correo,en_plataforma FROM configuracion_notificacion ORDER BY tipo_alerta")).rows;
}

async function actualizarNotificacion(id, datos) {
    return (await pool.query("UPDATE configuracion_notificacion SET por_correo=$1,en_plataforma=$2 WHERE id_config=$3 RETURNING *", [datos.por_correo, datos.en_plataforma, id])).rows[0] || null;
}

async function obtenerEmpresa() {
    return (await pool.query("SELECT id_empresa,razon_social,ruc,direccion,telefono,email,logo_url,igv_porcentaje FROM empresa WHERE id_empresa=1")).rows[0] || null;
}

async function guardarEmpresa(datos) {
    return (await pool.query(`INSERT INTO empresa(id_empresa,razon_social,ruc,direccion,telefono,email,logo_url,igv_porcentaje)
        VALUES(1,$1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT(id_empresa) DO UPDATE SET razon_social=EXCLUDED.razon_social,ruc=EXCLUDED.ruc,
        direccion=EXCLUDED.direccion,telefono=EXCLUDED.telefono,email=EXCLUDED.email,logo_url=EXCLUDED.logo_url,
        igv_porcentaje=EXCLUDED.igv_porcentaje
        RETURNING id_empresa,razon_social,ruc,direccion,telefono,email,logo_url,igv_porcentaje`,
    [datos.razon_social, datos.ruc || null, datos.direccion || null, datos.telefono || null, datos.email || null, datos.logo_url || null, datos.igv_porcentaje])).rows[0];
}

module.exports = { listarRoles, listarPermisos, listarMatrizPermisos, actualizarPermisosRol, tienePermiso, listarModulosUsuario, listarAreas, listarServicios, guardarServicio, cambiarEstadoServicio, listarConfiguracionNotificaciones, actualizarNotificacion, obtenerEmpresa, guardarEmpresa };
