const {
    ordenSchema,
    cambiarEtapaSchema,
    filtrosTableroSchema,
    filtrosHistorialSchema,
} = require("../../src/validators/produccion.schemas");

describe("schemas de producción", () => {
    test("valida una orden y convierte IDs de proyecto y usuario", () => {
        const resultado = ordenSchema.safeParse({ titulo: "  Orden  ", id_proyecto: "2", id_usuario: "3" });

        expect(resultado.success).toBe(true);
        expect(resultado.data).toEqual(expect.objectContaining({
            titulo: "Orden",
            id_proyecto: 2,
            id_usuario: 3,
        }));
        expect(resultado.data).not.toHaveProperty("id_servicio");
    });

    test("usa 7 días como filtro por defecto y rechaza una etapa desconocida", () => {
        expect(filtrosTableroSchema.safeParse({}).data.dias_finalizados).toBe(7);
        expect(cambiarEtapaSchema.safeParse({ estado_flujo: "Pausada" }).success).toBe(false);
    });

    test("rechaza un rango invertido en el historial", () => {
        expect(filtrosHistorialSchema.safeParse({ desde: "2026-11-15", hasta: "2026-11-01" }).success).toBe(false);
    });
});
