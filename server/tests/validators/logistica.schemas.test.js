const {
    crearProductoSchema,
    proveedorSchema,
    movimientoSchema,
} = require("../../src/validators/logistica.schemas");

describe("schemas de logística", () => {
    test("normaliza producto y elimina IDs de proveedores duplicados", () => {
        const resultado = crearProductoSchema.safeParse({
            codigo: "P-01",
            nombre: "  Papel  ",
            stock_minimo: "2",
            id_proveedores: ["3", 3, "4"],
        });

        expect(resultado.success).toBe(true);
        expect(resultado.data).toEqual(expect.objectContaining({
            nombre: "Papel",
            unidad_medida: "unidad",
            estado: "Activo",
            stock_inicial: 0,
            id_proveedores: [3, 4],
        }));
    });

    test("valida correo del proveedor y exige movimiento con cantidad positiva", () => {
        expect(proveedorSchema.safeParse({ nombre: "Proveedor", email: "no-es-correo" }).success).toBe(false);
        expect(movimientoSchema.safeParse({ tipo: "Salida", cantidad: 0, id_producto: 1 }).success).toBe(false);
        expect(movimientoSchema.safeParse({ tipo: "Entrada", cantidad: 2, id_producto: "1" }).success).toBe(true);
    });
});
