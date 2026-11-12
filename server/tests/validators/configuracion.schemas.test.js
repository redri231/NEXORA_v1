const {
    servicioSchema,
    permisosRolSchema,
    notificacionSchema,
    empresaSchema,
} = require("../../src/validators/configuracion.schemas");

describe("schemas de configuración", () => {
    test("normaliza campos opcionales del servicio y convierte el precio", () => {
        const resultado = servicioSchema.safeParse({ nombre: "  Diseño  ", categoria: "", precio_base: "120.5" });

        expect(resultado.success).toBe(true);
        expect(resultado.data).toEqual(expect.objectContaining({
            nombre: "Diseño",
            categoria: "",
            precio_base: 120.5,
        }));
    });

    test("convierte los IDs de permisos y valida opciones de notificación", () => {
        expect(permisosRolSchema.safeParse({ permisos: ["1", 2] }).data.permisos).toEqual([1, 2]);
        expect(notificacionSchema.safeParse({ por_correo: true, en_plataforma: false }).success).toBe(true);
        expect(notificacionSchema.safeParse({ por_correo: "true", en_plataforma: false }).success).toBe(false);
    });

    test("valida RUC, correo y porcentaje de IGV de la empresa", () => {
        const datos = { razon_social: "Nexora", ruc: "20123456789", igv_porcentaje: "18" };

        expect(empresaSchema.safeParse(datos).success).toBe(true);
        expect(empresaSchema.safeParse({ ...datos, ruc: "123" }).success).toBe(false);
        expect(empresaSchema.safeParse({ ...datos, igv_porcentaje: 101 }).success).toBe(false);
    });
});
