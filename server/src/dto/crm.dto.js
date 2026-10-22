function seleccionar(origen, campos) {
    if (!origen) return null;
    return Object.fromEntries(campos
        .filter((campo) => origen[campo] !== undefined)
        .map((campo) => [campo, origen[campo]]));
}

const clienteCampos = [
    "id_cliente", "tipo_cliente", "razon_social_nombres", "num_documento",
    "contacto_nombre", "contacto_cargo", "email", "telefono", "direccion",
    "fecha_registro", "estado", "id_usuario", "responsable"
];
const leadCampos = [
    "id_lead", "nombre", "contacto", "cargo_contacto", "email", "telefono",
    "fuente", "estado", "fecha_registro", "id_cliente", "cliente_convertido"
];
const responsableCampos = ["id_usuario", "nombres", "apellidos", "nombre_completo", "email"];
const oportunidadCampos = [
    "id_oportunidad", "valor_estimado", "etapa", "notas", "fecha_registro",
    "id_cliente", "cliente", "id_lead", "lead", "contacto_lead", "fuente_lead",
    "id_usuario", "responsable", "id_servicio", "servicio", "categoria_servicio"
];
const seguimientoCampos = [
    "id_seguimiento", "fecha", "tipo", "descripcion", "proxima_fecha_contacto", "id_oportunidad"
];

const lista = (filas, dto) => filas.map(dto);
const clienteDTO = (row) => seleccionar(row, clienteCampos);
const leadDTO = (row) => seleccionar(row, leadCampos);
const responsableDTO = (row) => seleccionar(row, responsableCampos);
const oportunidadDTO = (row) => seleccionar(row, oportunidadCampos);
const seguimientoDTO = (row) => seleccionar(row, seguimientoCampos);

module.exports = {
    lista, clienteDTO, leadDTO, responsableDTO, oportunidadDTO, seguimientoDTO
};
