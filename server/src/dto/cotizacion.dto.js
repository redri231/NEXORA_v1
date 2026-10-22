function seleccionar(origen, campos) {
    if (!origen) return null;
    return Object.fromEntries(campos
        .filter((campo) => origen[campo] !== undefined)
        .map((campo) => [campo, origen[campo]]));
}

const cotizacionCampos = [
    "id_cotizacion", "codigo", "fecha_emision", "fecha_vencimiento", "estado",
    "monto_total", "id_cliente", "cliente", "id_usuario", "responsable",
    "id_oportunidad", "servicios", "cantidad_detalles"
];
const detalleCampos = [
    "id_detalle", "descripcion", "cantidad", "precio_unitario", "descuento",
    "impuesto", "subtotal", "id_servicio", "servicio", "categoria"
];
const servicioCampos = ["id_servicio", "nombre", "categoria", "descripcion", "precio_base", "estado"];

const cotizacionDTO = (row) => seleccionar(row, cotizacionCampos);
const detalleDTO = (row) => seleccionar(row, detalleCampos);
const servicioDTO = (row) => seleccionar(row, servicioCampos);

module.exports = { cotizacionDTO, detalleDTO, servicioDTO };
