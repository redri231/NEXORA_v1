function servicioDTO(row) {
    if (!row) return null;
    return { id_servicio: row.id_servicio, nombre: row.nombre, categoria: row.categoria, descripcion: row.descripcion, precio_base: row.precio_base == null ? null : Number(row.precio_base), estado: row.estado };
}

function empresaDTO(row) {
    if (!row) return null;
    return { ...row, igv_porcentaje: Number(row.igv_porcentaje) };
}

module.exports = { servicioDTO, empresaDTO };
