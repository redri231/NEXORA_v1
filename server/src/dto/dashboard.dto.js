function dashboardDTO(data) {
    return {
        modulos: data.modulos,
        indicadores: data.indicadores,
        graficos: data.graficos,
        actividad: data.actividad.map((item) => ({
            id: item.id_bitacora,
            accion: item.accion,
            entidad: item.entidad,
            descripcion: item.descripcion,
            fecha: item.fecha_hora,
            usuario: item.usuario || "Usuario desactivado",
        })),
    };
}

module.exports = { dashboardDTO };
