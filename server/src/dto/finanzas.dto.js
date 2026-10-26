const movimientoCampos = ["id_movimiento", "tipo", "categoria", "monto", "fecha", "metodo_pago", "descripcion", "estado", "id_cliente", "cliente", "id_proyecto", "proyecto", "id_proveedor", "proveedor", "id_pago", "codigo_pago"];
function seleccionar(origen, campos) { if (!origen) return null; return Object.fromEntries(campos.filter((c) => origen[c] !== undefined).map((c) => [c, origen[c]])); }
module.exports = { movimientoDTO: (row) => seleccionar(row, movimientoCampos) };
