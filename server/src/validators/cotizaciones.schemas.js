const { z, id, idRole, optionalText } = require("./shared.schemas");

const estadosCotizacion = ["Borrador", "Enviada", "En negociación", "Aprobada", "Rechazada", "Vencida"];
const fechaSql = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Usa una fecha válida con formato AAAA-MM-DD.");
const nullableId = (schema = id) => z.preprocess(
    (value) => value === "" ? null : value,
    schema.nullable().optional()
);

const detalleCotizacionSchema = z.object({
    descripcion: optionalText(200),
    cantidad: z.coerce.number().int().min(1).max(2147483647),
    precio_unitario: z.coerce.number().finite().min(0).max(99999999.99),
    descuento: z.preprocess((value) => value === "" || value == null ? 0 : value,
        z.coerce.number().finite().min(0).max(100)),
    impuesto: z.preprocess((value) => value === "" || value == null ? 0 : value,
        z.coerce.number().finite().min(0).max(100)),
    id_servicio: idRole
}).strict();

const cotizacionSchema = z.object({
    fecha_emision: fechaSql,
    fecha_vencimiento: fechaSql,
    id_cliente: id,
    id_usuario: id,
    id_oportunidad: nullableId(),
    detalles: z.array(detalleCotizacionSchema)
}).strict().refine(
    (data) => data.fecha_vencimiento >= data.fecha_emision,
    { message: "La fecha de vencimiento debe ser igual o posterior a la emisión.", path: ["fecha_vencimiento"] }
);

const estadoCotizacionSchema = z.object({
    estado: z.enum(["Enviada", "En negociación", "Aprobada", "Rechazada"])
}).strict();

const filtrosCotizacionSchema = z.object({
    q: optionalText(120),
    estado: z.preprocess((value) => value === "" ? null : value,
        z.enum(estadosCotizacion).nullable().optional())
}).strict();

module.exports = {
    cotizacionSchema,
    estadoCotizacionSchema,
    filtrosCotizacionSchema,
    idParamsSchema: z.object({ id })
};
