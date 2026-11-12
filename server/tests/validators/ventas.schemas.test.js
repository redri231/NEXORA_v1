const {
    crearVentaSchema,
    estadoVentaSchema,
    filtrosVentaSchema,
} = require("../../src/validators/ventas.schemas");

describe("schemas de ventas", () => {
    test("convierte IDs de cotización y proyecto", () => {
        const resultado = crearVentaSchema.safeParse({ id_cotizacion: "4", id_proyecto: "7" });

        expect(resultado.success).toBe(true);
        expect(resultado.data).toEqual({ id_cotizacion: 4, id_proyecto: 7 });
    });

    test("permite proyecto opcional y limpia filtros vacíos", () => {
        expect(crearVentaSchema.safeParse({ id_cotizacion: 4, id_proyecto: "" }).data.id_proyecto).toBeNull();
        expect(filtrosVentaSchema.safeParse({ q: "", estado: "" }).data).toEqual({ q: null, estado: null });
        expect(estadoVentaSchema.safeParse({ estado: "Pendiente" }).success).toBe(false);
    });
});
