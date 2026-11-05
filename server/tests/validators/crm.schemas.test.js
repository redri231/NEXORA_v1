const {
    clienteSchema,
    oportunidadSchema,
    seguimientoSchema,
} = require("../../src/validators/crm.schemas");

describe("schemas de CRM", () => {
    test("normaliza campos opcionales vacíos del cliente", () => {
        const resultado = clienteSchema.safeParse({
            tipo_cliente: "Empresa",
            razon_social_nombres: "  Nexora  ",
            num_documento: "",
            email: "",
            telefono: "",
            direccion: "",
        });

        expect(resultado.success).toBe(true);
        expect(resultado.data.razon_social_nombres).toBe("Nexora");
        expect(resultado.data.num_documento).toBeNull();
        expect(resultado.data.email).toBeNull();
    });

    test("requiere que la oportunidad pertenezca a un cliente o lead, pero no a ambos", () => {
        const base = { valor_estimado: "125.50", id_usuario: "4" };
        const porCliente = oportunidadSchema.safeParse({ ...base, id_cliente: "7", id_lead: null });
        const porLead = oportunidadSchema.safeParse({ ...base, id_cliente: null, id_lead: "8" });

        expect(porCliente.success).toBe(true);
        expect(porCliente.data.valor_estimado).toBe(125.5);
        expect(porLead.success).toBe(true);
        expect(oportunidadSchema.safeParse({ ...base, id_cliente: "7", id_lead: "8" }).success).toBe(false);
        expect(oportunidadSchema.safeParse({ ...base, id_cliente: null, id_lead: null }).success).toBe(false);
    });

    test("acepta fechas reales y rechaza fechas inexistentes en seguimientos", () => {
        const base = { tipo: "Llamada", descripcion: "Contacto de seguimiento" };

        expect(seguimientoSchema.safeParse({ ...base, fecha: "2026-11-05" }).success).toBe(true);
        expect(seguimientoSchema.safeParse({ ...base, fecha: "2026-02-30" }).success).toBe(false);
    });
});
