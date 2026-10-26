const { z, id } = require("./shared.schemas");

const fecha = z.preprocess((value) => value === "" ? undefined : value,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
        const date = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }, "Usa una fecha válida.").optional());
const filtrosReporteSchema = z.object({
    tipo: z.enum(["Ventas", "Proyectos", "Inventario", "Finanzas", "Productividad"]),
    fecha_desde: fecha,
    fecha_hasta: fecha,
    id_cliente: z.preprocess((value) => value === "" || value == null ? undefined : value, id.optional()),
    area: z.preprocess((value) => value === "" ? undefined : value, z.string().trim().max(60).optional()),
}).strict().superRefine((data, ctx) => {
    if (data.fecha_desde && data.fecha_hasta && data.fecha_desde > data.fecha_hasta) {
        ctx.addIssue({ code: "custom", message: "La fecha inicial no puede ser posterior a la final.", path: ["fecha_hasta"] });
    }
    if (data.tipo !== "Inventario" && (!data.fecha_desde || !data.fecha_hasta)) {
        ctx.addIssue({ code: "custom", message: "Selecciona las fechas desde y hasta para este reporte.", path: [!data.fecha_desde ? "fecha_desde" : "fecha_hasta"] });
    }
});

module.exports = { filtrosReporteSchema };
