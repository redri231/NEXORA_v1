function seleccionar(origen, campos) {
    if (!origen) return null;
    return Object.fromEntries(campos.filter((campo) => origen[campo] !== undefined).map((campo) => [campo, origen[campo]]));
}

const ordenCampos = [
    "id_orden", "codigo", "titulo", "estado_flujo", "fecha_planificacion", "fecha_entrega",
    "fecha_finalizacion", "id_proyecto", "proyecto", "cliente", "id_servicio", "servicio",
    "id_usuario", "responsable", "historial"
];
const etapaCampos = ["id_etapa", "nombre_etapa", "fecha", "comentario", "id_usuario", "usuario"];

module.exports = {
    ordenDTO: (row) => seleccionar(row, ordenCampos),
    etapaDTO: (row) => seleccionar(row, etapaCampos)
};
