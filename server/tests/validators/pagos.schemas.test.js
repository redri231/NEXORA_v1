const { crearPagoSchema, filtrosPagosSchema } = require("../../src/validators/pagos.schemas");

describe("schemas de pagos", () => {
    const pago = { monto: "250", id_cliente: "5", id_venta: "8" };

    test("normaliza IDs y aplica valores por defecto al pago", () => {
        const resultado = crearPagoSchema.safeParse(pago);

        expect(resultado.success).toBe(true);
        expect(resultado.data).toEqual(expect.objectContaining({
            monto: 250,
            id_cliente: 5,
            id_venta: 8,
            estado: "Pendiente",
            metodo_pago: "Transferencia",
        }));
        expect(resultado.data).not.toHaveProperty("id_proyecto");
    });

    test("exige asociar el pago a una venta o a un proyecto, no a ambos", () => {
        expect(crearPagoSchema.safeParse({ monto: 250, id_cliente: 5 }).success).toBe(false);
        expect(crearPagoSchema.safeParse({ ...pago, id_proyecto: 9 }).success).toBe(false);
        expect(crearPagoSchema.safeParse({ ...pago, id_proyecto: "" }).success).toBe(true);
    });

    test("rechaza vencimiento anterior a la fecha de pago y estados desconocidos", () => {
        expect(crearPagoSchema.safeParse({
            ...pago,
            fecha: "2026-11-10",
            fecha_vencimiento: "2026-11-01",
        }).success).toBe(false);
        expect(filtrosPagosSchema.safeParse({ estado: "En revisión" }).success).toBe(false);
    });
});
