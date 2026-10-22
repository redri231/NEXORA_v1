const { z, id } = require("./shared.schemas");

const estadosVenta = ["Por facturar", "Facturada", "Anulada"];
const nullableId = z.preprocess((value) => value === "" ? null : value, id.nullable().optional());

const crearVentaSchema = z.object({
    id_cotizacion: id,
    id_proyecto: nullableId
}).strict();

const estadoVentaSchema = z.object({
    estado: z.enum(estadosVenta)
}).strict();

const filtrosVentaSchema = z.object({
    q: z.preprocess((value) => value === "" ? null : value, z.string().trim().max(120).nullable().optional()),
    estado: z.preprocess((value) => value === "" ? null : value, z.enum(estadosVenta).nullable().optional())
}).strict();

module.exports = { crearVentaSchema, estadoVentaSchema, filtrosVentaSchema, idParamsSchema: z.object({ id }) };
