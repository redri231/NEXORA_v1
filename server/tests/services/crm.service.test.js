jest.mock("../../src/models/crm.model", () => ({
    crearCliente: jest.fn(), obtenerClientePorId: jest.fn(), obtenerResponsables: jest.fn(),
    obtenerLeadPorId: jest.fn(), crearLead: jest.fn(), obtenerOportunidadPorId: jest.fn(),
}));

const service = require("../../src/services/crm.service");
const model = require("../../src/models/crm.model");

describe("crmService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("normaliza email y documento al crear un cliente", async () => {
        const cliente = { tipo_cliente: "Empresa", razon_social_nombres: "Nexora", email: "  VENTAS@EXAMPLE.COM ", num_documento: " 123 " };
        model.crearCliente.mockImplementation(async (datos) => ({ id_cliente: 4, ...datos }));

        const resultado = await service.crearCliente(cliente);

        expect(model.crearCliente).toHaveBeenCalledWith(expect.objectContaining({
            email: "ventas@example.com",
            num_documento: "123",
        }));
        expect(resultado).toEqual(expect.objectContaining({ id_cliente: 4, email: "ventas@example.com" }));
    });

    test("asigna estado activo por defecto al crear un lead", async () => {
        model.crearLead.mockImplementation(async (lead) => ({ id_lead: 8, ...lead }));

        const resultado = await service.crearLead({ nombre: "Lead" });

        expect(model.crearLead).toHaveBeenCalledWith(expect.objectContaining({ estado: "Activo" }));
        expect(resultado).toEqual(expect.objectContaining({ id_lead: 8, estado: "Activo" }));
    });

    test("rechaza una oportunidad asociada simultáneamente a cliente y lead", async () => {
        await expect(service.crearOportunidad({ id_cliente: 1, id_lead: 2, id_usuario: 3 }))
            .rejects.toThrow("La oportunidad debe pertenecer a un cliente o a un lead, pero no a ambos.");
    });
});
