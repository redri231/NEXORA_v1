const { z, id, optionalText } = require("./shared.schemas");

const ETAPAS_ORDEN = ["Solicitud", "Planificación", "Asignación", "Producción", "Revisión", "Entrega", "Finalizado"];
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Usa una fecha válida con formato AAAA-MM-DD.");
const fechaOpcional = z.preprocess((value) => value === "" || value == null ? null : value, fecha.nullable().optional());
const idOpcional = z.preprocess((value) => value === "" || value == null ? null : value, id.nullable().optional());

const ordenSchema = z.object({
    titulo: z.string().trim().min(1).max(150),
    fecha_planificacion: fechaOpcional,
    fecha_entrega: fechaOpcional,
    id_proyecto: id,
    id_servicio: idOpcional,
    id_usuario: id
}).strict();

const cambiarEtapaSchema = z.object({
    estado_flujo: z.enum(ETAPAS_ORDEN),
    comentario: optionalText(255)
}).strict();

const filtrosTableroSchema = z.object({
    q: optionalText(120),
    dias_finalizados: z.preprocess((value) => value == null || value === "" ? "7" : value, z.enum(["7", "30"]).transform(Number))
}).strict();

const filtrosHistorialSchema = z.object({
    q: optionalText(120),
    desde: fechaOpcional,
    hasta: fechaOpcional
}).strict().refine((value) => !value.desde || !value.hasta || value.desde <= value.hasta,
    { message: "La fecha inicial debe ser anterior o igual a la fecha final.", path: ["hasta"] });

const idParamsSchema = z.object({ id });

module.exports = { ETAPAS_ORDEN, ordenSchema, cambiarEtapaSchema, filtrosTableroSchema, filtrosHistorialSchema, idParamsSchema };
