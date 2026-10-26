const pool = require("../config/database");

async function listarUsuariosActivos() {
    const { rows } = await pool.query(`
        SELECT u.id_usuario, r.nombre AS rol
        FROM usuario u
        JOIN rol r ON r.id_rol = u.id_rol
        WHERE u.estado = 'Activo'
    `);
    return rows;
}

async function listarConfiguracionesCanales() {
    const { rows } = await pool.query("SELECT tipo_alerta,en_plataforma FROM configuracion_notificacion");
    return rows;
}

async function sincronizar(eventos) {
    const client = await pool.connect();
    const payload = JSON.stringify(eventos);
    try {
        await client.query("BEGIN");
        await client.query(`
            INSERT INTO notificacion (
                id_usuario, clave_evento, tipo, nivel, titulo, mensaje, ruta,
                activa, fecha_creacion, fecha_lectura
            )
            SELECT e.id_usuario, e.clave_evento, e.tipo, e.nivel, e.titulo,
                   e.mensaje, e.ruta, TRUE, CURRENT_TIMESTAMP, NULL
            FROM jsonb_to_recordset($1::JSONB) AS e(
                id_usuario INTEGER, clave_evento TEXT, tipo TEXT, nivel TEXT,
                titulo TEXT, mensaje TEXT, ruta TEXT
            )
            ON CONFLICT (id_usuario, clave_evento) DO UPDATE SET
                tipo = EXCLUDED.tipo,
                nivel = EXCLUDED.nivel,
                titulo = EXCLUDED.titulo,
                mensaje = EXCLUDED.mensaje,
                ruta = EXCLUDED.ruta,
                fecha_creacion = CASE
                    WHEN notificacion.activa THEN notificacion.fecha_creacion
                    ELSE CURRENT_TIMESTAMP
                END,
                fecha_lectura = CASE
                    WHEN notificacion.activa THEN notificacion.fecha_lectura
                    ELSE NULL
                END,
                activa = TRUE
        `, [payload]);

        await client.query(`
            UPDATE notificacion n
            SET activa = FALSE
            WHERE n.activa = TRUE
              AND n.clave_evento LIKE 'gerencial:%'
              AND NOT EXISTS (
                  SELECT 1
                  FROM jsonb_to_recordset($1::JSONB) AS e(
                      id_usuario INTEGER, clave_evento TEXT, tipo TEXT, nivel TEXT,
                      titulo TEXT, mensaje TEXT, ruta TEXT
                  )
                  WHERE e.id_usuario = n.id_usuario
                    AND e.clave_evento = n.clave_evento
              )
        `, [payload]);
        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function listarActivas(idUsuario) {
    const { rows } = await pool.query(`
        SELECT id_notificacion, clave_evento, tipo, nivel, titulo, mensaje,
               ruta, activa, fecha_creacion, fecha_lectura
        FROM notificacion
        WHERE id_usuario = $1 AND activa = TRUE
        ORDER BY fecha_lectura NULLS FIRST, fecha_creacion DESC, id_notificacion DESC
        LIMIT 100
    `, [idUsuario]);
    return rows;
}

async function marcarLeida(id, idUsuario) {
    const { rows } = await pool.query(`
        UPDATE notificacion
        SET fecha_lectura = COALESCE(fecha_lectura, CURRENT_TIMESTAMP)
        WHERE id_notificacion = $1 AND id_usuario = $2 AND activa = TRUE
        RETURNING id_notificacion
    `, [id, idUsuario]);
    return rows[0] || null;
}

async function marcarTodasLeidas(idUsuario) {
    const { rowCount } = await pool.query(`
        UPDATE notificacion
        SET fecha_lectura = CURRENT_TIMESTAMP
        WHERE id_usuario = $1 AND activa = TRUE AND fecha_lectura IS NULL
    `, [idUsuario]);
    return rowCount;
}

module.exports = { listarUsuariosActivos, listarConfiguracionesCanales, sincronizar, listarActivas, marcarLeida, marcarTodasLeidas };
