const { z, id, optionalText } = require("./shared.schemas");

const estadosTarea = ["Por hacer", "En progreso", "En revisión", "Completada"];
const prioridadesTarea = ["Baja", "Media", "Alta", "Urgente"];
const nullableDate = z.preprocess((value) => value === "" || value == null ? null : value,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
        const date = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }, "Usa una fecha válida con formato AAAA-MM-DD.").nullable().optional());
const nullableId = z.preprocess((value) => value === "" || value == null ? null : value, id.nullable().optional());

const tareaSchema = z.object({
    titulo: z.string().trim().min(1).max(150),
    descripcion: optionalText(255),
    fecha_limite: nullableDate,
    prioridad: z.enum(prioridadesTarea),
    estado: z.enum(estadosTarea).optional(),
    id_proyecto: id,
    id_usuario: nullableId
}).strict();

const estadoTareaSchema = z.object({ estado: z.enum(estadosTarea) }).strict();
const filtrosTareaSchema = z.object({
    q: optionalText(120),
    estado: z.preprocess((value) => value === "" ? null : value, z.enum(estadosTarea).nullable().optional()),
    prioridad: z.preprocess((value) => value === "" ? null : value, z.enum(prioridadesTarea).nullable().optional()),
    id_proyecto: z.preprocess((value) => value === "" || value == null ? null : value, id.nullable().optional())
}).strict();
const idParamsSchema = z.object({ id });

module.exports = { tareaSchema, estadoTareaSchema, filtrosTareaSchema, estadosTarea, prioridadesTarea, idParamsSchema };
