function seleccionar(origen, campos) {
    return Object.fromEntries(campos
        .filter((campo) => origen[campo] !== undefined)
        .map((campo) => [campo, origen[campo]]));
}

const personalCampos = [
    "id_usuario", "nombres", "apellidos", "email", "cargo", "area", "rol",
    "tareas_activas", "tareas_completadas", "tareas_asignadas", "tareas_vencidas",
    "tareas_proximas", "tareas_urgentes_activas", "tareas_urgentes_vencidas",
    "carga_puntos", "carga_pct", "productividad_pct",
];

const alertaCampos = ["id", "clave_evento", "tipo", "nivel", "mensaje", "id_usuario", "nombre", "valor", "ruta"];

function direccionDTO(data) {
    return {
        resumen: seleccionar(data.resumen, [
            "personal_activo", "tareas_activas", "tareas_vencidas", "productividad_equipo",
            "tareas_completadas", "tareas_asignadas", "capacidad_puntos",
        ]),
        equipo: data.equipo.map((persona) => seleccionar(persona, personalCampos)),
        alertas: data.alertas.map((alerta) => seleccionar(alerta, alertaCampos)),
    };
}

module.exports = { direccionDTO };
