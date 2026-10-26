const { z, id, optionalText } = require("./shared.schemas");

const nullableId = z.preprocess((value) => value === "" || value == null ? null : value, id.nullable().optional());
const textoOpcional = (max) => z.preprocess((value) => value === "" ? null : value, optionalText(max).nullable().optional());
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Usa una fecha válida.");
const fechaOpcional = z.preprocess((value) => value === "" || value == null ? null : value, fecha.nullable().optional());

const filtrosPagosSchema = z.object({
    q: textoOpcional(120),
    estado: z.preprocess((value) => value === "" ? null : value, z.enum(["Pendiente", "Pagado", "Vencido", "Anulado"]).nullable().optional()),
}).strict();

const crearPagoSchema = z.object({
    monto: z.coerce.number().finite().positive().max(9999999999.99),
    fecha: fechaOpcional,
    fecha_vencimiento: fechaOpcional,
    metodo_pago: z.enum(["Transferencia", "Depósito", "Tarjeta", "Yape", "Plin", "Efectivo", "Cheque"]).default("Transferencia"),
    estado: z.enum(["Pendiente", "Pagado", "Vencido", "Anulado"]).default("Pendiente"),
    id_cliente: id,
    id_venta: nullableId,
    id_proyecto: nullableId,
}).strict()
    .refine((value) => Number(Boolean(value.id_venta)) + Number(Boolean(value.id_proyecto)) === 1,
        { message: "Selecciona una venta o un proyecto, pero no ambos.", path: ["id_venta"] })
    .refine((value) => !value.fecha || !value.fecha_vencimiento || value.fecha_vencimiento >= value.fecha,
        { message: "El vencimiento no puede ser anterior a la fecha del pago.", path: ["fecha_vencimiento"] });

const cambiarEstadoPagoSchema = z.object({ estado: z.enum(["Pendiente", "Pagado", "Vencido", "Anulado"]) }).strict();
const idParamsSchema = z.object({ id });
module.exports = { filtrosPagosSchema, crearPagoSchema, cambiarEstadoPagoSchema, idParamsSchema };
