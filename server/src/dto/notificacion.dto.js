function notificacionDTO(notificacion) {
    if (!notificacion) return null;
    return {
        id: notificacion.id_notificacion,
        clave_evento: notificacion.clave_evento,
        tipo: notificacion.tipo,
        nivel: notificacion.nivel,
        titulo: notificacion.titulo,
        mensaje: notificacion.mensaje,
        ruta: notificacion.ruta,
        activa: notificacion.activa,
        fecha_creacion: notificacion.fecha_creacion,
        fecha_lectura: notificacion.fecha_lectura,
        leida: Boolean(notificacion.fecha_lectura),
    };
}

module.exports = { notificacionDTO };
