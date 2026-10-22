const { z, id, optionalText } = require("./shared.schemas");

const estadosProyecto = ["Planificación", "En ejecución", "En revisión", "Completado", "Atrasado", "Cancelado"];
const fechaSql = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Usa una fecha válida con formato AAAA-MM-DD.");
const nullableDate = z.preprocess((value) => value === "" || value == null ? null : value, fechaSql.nullable().optional());
const nullableId = z.preprocess((value) => value === "" || value == null ? null : value, id.nullable().optional());
const miembros = z.array(z.object({ id_usuario: id, rol_proyecto: optionalText(60) }).strict()).max(100)
    .superRefine((items, context) => {
        const ids = items.map((item) => Number(item.id_usuario));
        if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", message: "No repitas integrantes del equipo." });
    }).optional().default([]);

const datosProyecto = z.object({
    nombre: z.string().trim().min(1).max(150),
    fecha_inicio: nullableDate,
    fecha_fin: nullableDate,
    presupuesto: z.preprocess((value) => value === "" || value == null ? null : value,
        z.coerce.number().finite().min(0).max(9999999999.99).nullable().optional()),
    objetivo: optionalText(255),
    avance: z.coerce.number().int().min(0).max(100),
    id_cliente: id,
    id_cotizacion: nullableId,
    id_usuario: id,
    equipo: miembros
}).strict().refine((value) => !value.fecha_inicio || !value.fecha_fin || value.fecha_fin >= value.fecha_inicio,
    { message: "La fecha final debe ser igual o posterior a la fecha inicial.", path: ["fecha_fin"] });

const proyectoSchema = datosProyecto;
const estadoProyectoSchema = z.object({ estado: z.enum(estadosProyecto) }).strict();
const filtrosProyectoSchema = z.object({
    q: optionalText(120),
    estado: z.preprocess((value) => value === "" ? null : value, z.enum(estadosProyecto).nullable().optional())
}).strict();
const idParamsSchema = z.object({ id });

module.exports = { proyectoSchema, estadoProyectoSchema, filtrosProyectoSchema, estadosProyecto, idParamsSchema };
