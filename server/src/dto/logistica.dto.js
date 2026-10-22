function productoDTO(row) {
    return { ...row, id_producto: Number(row.id_producto), stock_actual: Number(row.stock_actual), stock_minimo: Number(row.stock_minimo), proveedores: (row.proveedores || []).map((p) => ({ ...p, id_proveedor: Number(p.id_proveedor) })) };
}
function proveedorDTO(row) { return { ...row, id_proveedor: Number(row.id_proveedor), productos_asociados: Number(row.productos_asociados || 0) }; }
module.exports = { productoDTO, proveedorDTO };
