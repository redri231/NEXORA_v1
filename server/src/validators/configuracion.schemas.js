const { z, id, requiredText } = require("./shared.schemas");

const servicioSchema = z.object({
    nombre: requiredText(120),
    categoria: z.string().trim().max(60).optional().nullable().transform((v) => v || ""),
    descripcion: z.string().trim().max(255).optional().nullable().transform((v) => v || ""),
    precio_base: z.preprocess((v) => v === "" || v == null ? null : Number(v), z.number().finite().min(0).nullable().optional()),
    estado: z.enum(["Activo", "Inactivo"]).optional()
}).strict();

const permisosRolSchema = z.object({ permisos: z.array(id).max(300) }).strict();
const notificacionSchema = z.object({ por_correo: z.boolean(), en_plataforma: z.boolean() }).strict();
const estadoServicioSchema = z.object({ estado: z.enum(["Activo", "Inactivo"]) }).strict();
const empresaSchema = z.object({
    razon_social: requiredText(150),
    ruc: z.string().trim().regex(/^$|^\d{11}$/, "El RUC debe tener 11 dígitos.").optional(),
    direccion: z.string().trim().max(200).optional(),
    telefono: z.string().trim().max(20).optional(),
    email: z.union([z.literal(""), z.string().trim().max(120).email()]).optional(),
    logo_url: z.union([z.literal(""), z.string().trim().max(255).url()]).optional(),
    igv_porcentaje: z.coerce.number().min(0).max(100)
}).strict();
const idParamsSchema = z.object({ id });

module.exports = { servicioSchema, permisosRolSchema, notificacionSchema, estadoServicioSchema, empresaSchema, idParamsSchema };
