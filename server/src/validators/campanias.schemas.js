const { z, id, optionalText } = require("./shared.schemas");

const estadosCampania = ["Planificada", "Activa", "Pausada", "Finalizada", "Bajo rendimiento"];
const fechaSql = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Usa una fecha válida con formato AAAA-MM-DD.");
const fechaOpcional = z.preprocess((value) => value === "" || value == null ? null : value, fechaSql.nullable().optional());
const textoOpcional = (max) => z.preprocess((value) => value === "" ? null : value, optionalText(max).nullable().optional());
const canales = z.array(z.string().trim().min(1).max(60)).max(20)
    .transform((items) => [...new Set(items.map((item) => item.trim()).filter(Boolean))]);

const datosCampania = z.object({
    nombre: z.string().trim().min(1).max(150),
    objetivo: textoOpcional(255),
    publico_objetivo: textoOpcional(150),
    fecha_inicio: fechaOpcional,
    fecha_fin: fechaOpcional,
    presupuesto: z.preprocess((value) => value === "" || value == null ? null : value,
        z.coerce.number().finite().min(0).max(9999999999.99).nullable().optional()),
    id_cliente: id,
    id_proyecto: z.preprocess((value) => value === "" || value == null ? null : value, id.nullable().optional()),
    id_usuario: id,
    canales
}).strict().refine((value) => !value.fecha_inicio || !value.fecha_fin || value.fecha_fin >= value.fecha_inicio,
    { message: "La fecha final debe ser igual o posterior a la fecha inicial.", path: ["fecha_fin"] });

const crearCampaniaSchema = datosCampania;
const actualizarCampaniaSchema = datosCampania;
const estadoCampaniaSchema = z.object({ estado: z.enum(estadosCampania) }).strict();
const filtrosCampaniaSchema = z.object({
    q: textoOpcional(120),
    estado: z.preprocess((value) => value === "" ? null : value, z.enum(estadosCampania).nullable().optional())
}).strict();
const idParamsSchema = z.object({ id });
const indicadorCampaniaSchema = z.object({
    alcance: z.coerce.number().int().min(0).max(2147483647),
    impresiones: z.coerce.number().int().min(0).max(2147483647),
    clics: z.coerce.number().int().min(0).max(2147483647),
    leads: z.coerce.number().int().min(0).max(2147483647),
    conversiones: z.coerce.number().int().min(0).max(2147483647),
    costo_por_lead: z.preprocess((value) => value === "" || value == null ? null : value,
        z.coerce.number().finite().min(0).max(99999999.99).nullable().optional()),
    roi: z.preprocess((value) => value === "" || value == null ? null : value,
        z.coerce.number().finite().min(-9999.99).max(9999.99).nullable().optional())
}).strict();
const solicitudMaterialSchema = z.object({
    id_producto: id,
    cantidad_solicitada: z.coerce.number().int().min(1).max(2147483647)
}).strict();

module.exports = { crearCampaniaSchema, actualizarCampaniaSchema, estadoCampaniaSchema, filtrosCampaniaSchema, indicadorCampaniaSchema, solicitudMaterialSchema, idParamsSchema };
