jest.mock("../../src/models/cotizaciones.model", () => ({
    marcarVencidas: jest.fn(), obtenerPorId: jest.fn(), cambiarEstado: jest.fn(),
    listar: jest.fn(), listarServicios: jest.fn(), crear: jest.fn(), actualizar: jest.fn(),
}));
jest.mock("../../src/models/crm.model", () => ({
    obtenerClientePorId: jest.fn(), obtenerResponsables: jest.fn(), obtenerOportunidadPorId: jest.fn(),
}));

const service = require("../../src/services/cotizaciones.service");
const model = require("../../src/models/cotizaciones.model");

describe("cotizacionesService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("rechaza una transición de estado que no sigue el flujo", async () => {
        model.obtenerPorId.mockResolvedValue({ estado: "Aprobada", detalles: [] });

        await expect(service.cambiarEstado(5, "Enviada")).rejects.toMatchObject({ code: "TRANSICION_INVALIDA" });
        expect(model.cambiarEstado).not.toHaveBeenCalled();
    });

    test("valida el ID antes de consultar una cotización", async () => {
        await expect(service.obtenerPorId("no-id")).rejects.toThrow();
        expect(model.obtenerPorId).not.toHaveBeenCalled();
    });
});
