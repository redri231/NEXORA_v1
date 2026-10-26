const campos = ["id_pago", "codigo", "monto", "fecha", "fecha_vencimiento", "metodo_pago", "estado", "id_cliente", "cliente", "id_venta", "venta", "id_proyecto", "proyecto"];
function pagoDTO(pago) {
    if (!pago) return null;
    return Object.fromEntries(campos.filter((campo) => pago[campo] !== undefined).map((campo) => [campo, pago[campo]]));
}
module.exports = { pagoDTO };
