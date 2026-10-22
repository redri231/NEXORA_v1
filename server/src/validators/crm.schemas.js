const { z, id, idRole, requiredText, optionalText, email } = require("./shared.schemas");

const tipoCliente = z.enum(["Empresa", "Persona"]);
const estadoCliente = z.enum(["Activo", "Inactivo"]);
const estadoLead = z.enum(["Activo", "Descartado"]);
const etapaOportunidad = z.enum([
    "Nuevo lead", "Contactado", "Reunión", "Propuesta enviada",
    "Negociación", "Ganado", "Perdido"
]);
const nullableId = (schema = id) => z.preprocess(
    (value) => value === "" ? null : value,
    schema.nullable().optional()
);

const clienteSchema = z.object({
    tipo_cliente: tipoCliente,
    razon_social_nombres: requiredText(150),
    num_documento: optionalText(20),
    email,
    telefono: optionalText(20),
    direccion: optionalText(200),
    id_usuario: nullableId(),
    estado: estadoCliente.optional()
}).strict();

const leadSchema = z.object({
    nombre: requiredText(150),
    contacto: optionalText(120),
    cargo_contacto: optionalText(80),
    email,
    telefono: optionalText(20),
    fuente: optionalText(60),
    estado: estadoLead.optional()
}).strict();

const actualizarLeadSchema = leadSchema.extend({ estado: estadoLead });

const oportunidadSchema = z.object({
    valor_estimado: z.preprocess((value) => value === "" || value == null ? 0 : value,
        z.coerce.number().finite().min(0).max(9999999999.99)),
    etapa: etapaOportunidad.optional().default("Nuevo lead"),
    notas: optionalText(255),
    id_cliente: nullableId(),
    id_lead: nullableId(),
    id_usuario: id,
    id_servicio: nullableId(idRole)
}).strict().refine(
    (value) => (value.id_cliente != null) !== (value.id_lead != null),
    { message: "La oportunidad debe pertenecer a un cliente o a un lead, pero no a ambos.", path: ["id_cliente"] }
);

const etapaOportunidadSchema = z.object({ etapa: etapaOportunidad }).strict();
const etapaLeadSchema = z.object({ estado_pipeline: estadoLead }).strict();
const conversionLeadSchema = z.object({
    tipo_cliente: tipoCliente,
    num_documento: optionalText(20),
    direccion: optionalText(200),
    id_usuario: nullableId()
}).strict();
const fechaSql = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Usa una fecha válida con formato AAAA-MM-DD.");

const seguimientoSchema = z.object({
    fecha: z.preprocess((value) => value === "" ? undefined : value, fechaSql.optional()),
    tipo: requiredText(30),
    descripcion: requiredText(255),
    proxima_fecha_contacto: z.preprocess((value) => value === "" || value == null ? null : value,
        fechaSql.nullable().optional())
}).strict();

const idParamsSchema = z.object({ id });
module.exports = {
    clienteSchema,
    leadSchema,
    actualizarLeadSchema,
    oportunidadSchema,
    etapaOportunidadSchema,
    etapaLeadSchema,
    conversionLeadSchema,
    seguimientoSchema,
    idParamsSchema
};
