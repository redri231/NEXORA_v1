const { z, id, optionalText, email } = require("./shared.schemas");

const texto = (max) => z.string().trim().min(1).max(max);
const nullableText = (max) => z.preprocess((value) => value === "" ? null : value, optionalText(max).nullable().optional());
const idList = z.array(id).max(100).transform((items) => [...new Set(items)]).default([]);

const filtrosSchema = z.object({
    q: nullableText(120),
    estado: z.enum(["Activo", "Inactivo", "Todos"]).optional(),
    stock_bajo: z.enum(["true", "false"]).optional(),
}).strict();
const idParamsSchema = z.object({ id });
const camposProducto = {
    codigo: texto(20), nombre: texto(150), categoria: nullableText(60),
    unidad_medida: z.preprocess((value) => value === "" ? "unidad" : value, z.string().trim().min(1).max(15).default("unidad")),
    ubicacion: nullableText(60), stock_minimo: z.coerce.number().int().min(0).max(2147483647),
    estado: z.enum(["Activo", "Inactivo"]).default("Activo"), imagen_url: z.preprocess((value) => value === "" ? null : value, z.string().url().max(255).nullable().optional()),
    id_proveedores: idList,
};
const crearProductoSchema = z.object({ ...camposProducto, stock_inicial: z.coerce.number().int().min(0).max(2147483647).default(0) }).strict();
const actualizarProductoSchema = z.object(camposProducto).strict();
const proveedorSchema = z.object({
    nombre: texto(150), contacto: nullableText(120), telefono: nullableText(20), email, direccion: nullableText(200),
}).strict();
const movimientoSchema = z.object({
    tipo: z.enum(["Entrada", "Salida"]), cantidad: z.coerce.number().int().min(1).max(2147483647),
    referencia: nullableText(150), id_producto: id,
}).strict();
const filtrosMovimientosSchema = z.object({ q: nullableText(120), tipo: z.enum(["Entrada", "Salida"]).optional() }).strict();
const solicitudEstadoSchema = z.object({ estado: z.enum(["Aprobada", "Rechazada", "Entregada"]) }).strict();
const proveedorEstadoSchema = z.object({ estado: z.enum(["Activo", "Inactivo"]) }).strict();

module.exports = { filtrosSchema, idParamsSchema, crearProductoSchema, actualizarProductoSchema, proveedorSchema, movimientoSchema, filtrosMovimientosSchema, solicitudEstadoSchema, proveedorEstadoSchema };
