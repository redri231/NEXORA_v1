const { z, id, optionalText } = require("./shared.schemas");

const nullableId = z.preprocess((value) => value === "" || value == null ? null : value, id.nullable().optional());
const textoOpcional = (max) => z.preprocess((value) => value === "" ? null : value, optionalText(max).nullable().optional());
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Usa una fecha válida.");
const fechaOpcional = z.preprocess((value) => value === "" || value == null ? null : value, fecha.nullable().optional());

const filtrosSchema = z.object({
    q: textoOpcional(120),
    tipo: z.preprocess((value) => value === "" ? null : value, z.enum(["Ingreso", "Gasto"]).nullable().optional()),
    estado: z.preprocess((value) => value === "" ? null : value, z.enum(["Cobrado", "Pagado", "Pendiente", "Anulado"]).nullable().optional()),
    desde: fechaOpcional,
    hasta: fechaOpcional,
}).strict().refine((value) => !value.desde || !value.hasta || value.desde <= value.hasta,
    { message: "La fecha inicial no puede ser posterior a la final.", path: ["hasta"] });

const crearGastoSchema = z.object({
    categoria: textoOpcional(60),
    monto: z.coerce.number().finite().positive().max(9999999999.99),
    fecha: fechaOpcional,
    metodo_pago: textoOpcional(30),
    descripcion: z.string().trim().min(1).max(255),
    estado: z.enum(["Pagado", "Pendiente", "Anulado"]).default("Pendiente"),
    id_cliente: nullableId,
    id_proyecto: nullableId,
    id_proveedor: nullableId,
}).strict();

const cambiarEstadoGastoSchema = z.object({ estado: z.enum(["Pagado", "Pendiente", "Anulado"]) }).strict();
const idParamsSchema = z.object({ id });
module.exports = { filtrosSchema, crearGastoSchema, cambiarEstadoGastoSchema, idParamsSchema };
