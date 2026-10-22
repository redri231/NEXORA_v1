function seleccionar(origen, campos) {
    if (!origen) return null;
    return Object.fromEntries(campos.filter((campo) => origen[campo] !== undefined).map((campo) => [campo, origen[campo]]));
}

const proyectoCampos = [
    "id_proyecto", "nombre", "fecha_inicio", "fecha_fin", "fecha_entrega_real", "presupuesto",
    "objetivo", "estado", "avance", "id_cliente", "cliente", "id_cotizacion", "cotizacion",
    "id_usuario", "responsable", "total_tareas", "tareas_completadas", "equipo", "tareas"
];
const tareaCampos = [
    "id_tarea", "titulo", "descripcion", "fecha_limite", "prioridad", "estado", "fecha_creacion",
    "id_proyecto", "proyecto", "id_usuario", "responsable", "cliente"
];

module.exports = {
    proyectoDTO: (row) => seleccionar(row, proyectoCampos),
    tareaDTO: (row) => seleccionar(row, tareaCampos)
};
