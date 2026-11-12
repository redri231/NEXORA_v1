const {
    cotizacionSchema,
    estadoCotizacionSchema,
    filtrosCotizacionSchema,
} = require("../../src/validators/cotizaciones.schemas");

describe("schemas de cotizaciones", () => {
    const cotizacion = {
        fecha_emision: "2026-11-01",
        fecha_vencimiento: "2026-11-30",
        id_cliente: "4",
        id_usuario: "2",
        detalles: [{ cantidad: "2", precio_unitario: "25", id_servicio: "3" }],
    };

    test("convierte IDs y aplica valores por defecto a los detalles", () => {
        const resultado = cotizacionSchema.safeParse(cotizacion);

        expect(resultado.success).toBe(true);
        expect(resultado.data.id_cliente).toBe(4);
        expect(resultado.data.detalles[0]).toEqual(expect.objectContaining({
            cantidad: 2,
            precio_unitario: 25,
            descuento: 0,
            impuesto: 0,
        }));
    });

    test("rechaza vencimiento anterior a emisión y estado no permitido", () => {
        expect(cotizacionSchema.safeParse({ ...cotizacion, fecha_vencimiento: "2026-10-31" }).success).toBe(false);
        expect(estadoCotizacionSchema.safeParse({ estado: "Borrador" }).success).toBe(false);
        expect(filtrosCotizacionSchema.safeParse({ estado: "" }).data.estado).toBeNull();
    });
});
