const { filtrosReporteSchema } = require("../../src/validators/reportes.schemas");

describe("schema de reportes", () => {
    test("requiere fechas para reportes que dependen de un período", () => {
        expect(filtrosReporteSchema.safeParse({ tipo: "Ventas" }).success).toBe(false);
        expect(filtrosReporteSchema.safeParse({
            tipo: "Ventas",
            fecha_desde: "2026-11-01",
            fecha_hasta: "2026-11-30",
        }).success).toBe(true);
    });

    test("permite inventario sin fechas y rechaza fechas invertidas", () => {
        expect(filtrosReporteSchema.safeParse({ tipo: "Inventario" }).success).toBe(true);
        expect(filtrosReporteSchema.safeParse({
            tipo: "Finanzas",
            fecha_desde: "2026-11-20",
            fecha_hasta: "2026-11-01",
        }).success).toBe(false);
    });
});
