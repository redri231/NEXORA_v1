function seleccionar(origen, campos) {
    if (!origen) return null;
    return Object.fromEntries(campos
        .filter((campo) => origen[campo] !== undefined)
        .map((campo) => [campo, origen[campo]]));
}

const ventaCampos = [
    "id_venta", "codigo", "monto_total", "fecha", "estado", "id_cliente",
    "cliente", "id_cotizacion", "cotizacion", "id_proyecto", "proyecto", "servicios"
];
const detalleCampos = [
    "id_detalle", "descripcion", "cantidad", "precio_unitario", "descuento",
    "impuesto", "subtotal", "servicio", "categoria"
];
const cotizacionCampos = ["id_cotizacion", "codigo", "cliente", "monto_total", "fecha_vencimiento", "id_cliente"];
const proyectoCampos = ["id_proyecto", "nombre", "id_cliente", "id_cotizacion"];

const ventaDTO = (row) => seleccionar(row, ventaCampos);
const detalleDTO = (row) => seleccionar(row, detalleCampos);
const cotizacionDTO = (row) => seleccionar(row, cotizacionCampos);
const proyectoDTO = (row) => seleccionar(row, proyectoCampos);

module.exports = { ventaDTO, detalleDTO, cotizacionDTO, proyectoDTO };
