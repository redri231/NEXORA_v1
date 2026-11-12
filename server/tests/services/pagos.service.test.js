jest.mock("../../src/models/pagos.model", () => ({
    crear: jest.fn(), listar: jest.fn(), cambiarEstado: jest.fn(), resumen: jest.fn(), catalogos: jest.fn(), marcarVencidos: jest.fn(),
}));

const service = require("../../src/services/pagos.service");
const model = require("../../src/models/pagos.model");

describe("pagosService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("normaliza a número los IDs opcionales antes de crear un pago", async () => {
        model.crear.mockImplementation(async (pago) => ({ id_pago: 2, ...pago }));

        const resultado = await service.crear({ monto: 50, id_venta: "7", id_proyecto: null });

        expect(model.crear).toHaveBeenCalledWith(expect.objectContaining({ id_venta: 7, id_proyecto: null }));
        expect(resultado).toEqual(expect.objectContaining({ id_pago: 2, id_venta: 7 }));
    });

    test("rechaza un ID inválido al cambiar el estado", async () => {
        await expect(service.cambiarEstado(-1, "Pagado")).rejects.toThrow();
        expect(model.cambiarEstado).not.toHaveBeenCalled();
    });
});
