const {
    crearCampaniaSchema,
    estadoCampaniaSchema,
    filtrosCampaniaSchema,
    indicadorCampaniaSchema,
} = require("../../src/validators/campanias.schemas");

describe("schemas de campañas", () => {
    test("normaliza nombre, elimina canales duplicados y convierte IDs", () => {
        const resultado = crearCampaniaSchema.safeParse({
            nombre: "  Lanzamiento  ",
            id_cliente: "2",
            id_usuario: "3",
            canales: [" Instagram ", "Instagram", " Web "],
        });

        expect(resultado.success).toBe(true);
        expect(resultado.data).toEqual(expect.objectContaining({
            nombre: "Lanzamiento",
            id_cliente: 2,
            id_usuario: 3,
            canales: ["Instagram", "Web"],
        }));
    });

    test("rechaza un rango de fechas invertido y un estado desconocido", () => {
        expect(crearCampaniaSchema.safeParse({
            nombre: "Campaña",
            id_cliente: 2,
            id_usuario: 3,
            canales: [],
            fecha_inicio: "2026-11-10",
            fecha_fin: "2026-11-01",
        }).success).toBe(false);
        expect(estadoCampaniaSchema.safeParse({ estado: "En curso" }).success).toBe(false);
        expect(filtrosCampaniaSchema.safeParse({ estado: "" }).data.estado).toBeNull();
    });

    test("valida métricas como números enteros no negativos", () => {
        const base = { alcance: 10, impresiones: 8, clics: 2, leads: 1, conversiones: 1 };

        expect(indicadorCampaniaSchema.safeParse(base).success).toBe(true);
        expect(indicadorCampaniaSchema.safeParse({ ...base, clics: -1 }).success).toBe(false);
    });
});
