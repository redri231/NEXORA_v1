const { filtrosSchema, crearGastoSchema } = require("../../src/validators/finanzas.schemas");

describe("schemas de finanzas", () => {
    test("acepta un gasto y usa estado Pendiente por defecto", () => {
        const resultado = crearGastoSchema.safeParse({ monto: "125.50", descripcion: "  Materiales  " });

        expect(resultado.success).toBe(true);
        expect(resultado.data).toEqual(expect.objectContaining({
            monto: 125.5,
            descripcion: "Materiales",
            estado: "Pendiente",
        }));
    });

    test("rechaza montos no positivos y fechas de filtro invertidas", () => {
        expect(crearGastoSchema.safeParse({ monto: 0, descripcion: "Gasto" }).success).toBe(false);
        expect(filtrosSchema.safeParse({ desde: "2026-11-15", hasta: "2026-11-01" }).success).toBe(false);
    });

    test("normaliza filtros opcionales vacíos", () => {
        const resultado = filtrosSchema.safeParse({ q: "", tipo: "", estado: "" });

        expect(resultado.success).toBe(true);
        expect(resultado.data.q).toBeNull();
        expect(resultado.data.tipo).toBeNull();
        expect(resultado.data.estado).toBeNull();
    });
});
