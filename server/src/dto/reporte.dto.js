const seleccionar = (row, campos) => Object.fromEntries(campos.filter((campo) => row[campo] !== undefined).map((campo) => [campo, row[campo]]));

function normalizarFecha(valor) {
    if (valor == null) return null;
    return valor instanceof Date ? valor.toISOString().slice(0, 10) : String(valor).slice(0, 10);
}

function generadoDTO(row) {
    const dto = seleccionar(row, ["id_reporte", "nombre", "tipo", "fecha_desde", "fecha_hasta", "area", "id_cliente", "cliente", "id_usuario", "usuario", "fecha_generacion"]);
    dto.fecha_desde = normalizarFecha(dto.fecha_desde);
    dto.fecha_hasta = normalizarFecha(dto.fecha_hasta);
    return dto;
}

module.exports = { generadoDTO };
