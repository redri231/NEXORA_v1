jest.mock("../../src/models/produccion.model", () => ({
    listarTablero: jest.fn(), listarHistorial: jest.fn(), obtenerPorId: jest.fn(),
    catalogos: jest.fn(), crear: jest.fn(), cambiarEtapa: jest.fn(), resumen: jest.fn(),
}));

const service = require("../../src/services/produccion.service");
const model = require("../../src/models/produccion.model");

describe("produccionService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("mapea órdenes al DTO y omite datos internos", async () => {
        model.listarTablero.mockResolvedValue([{ id_orden: 5, titulo: "Impresión", interno: true }]);

        await expect(service.listarTablero({ q: "impresión" })).resolves.toEqual([
            { id_orden: 5, titulo: "Impresión" },
        ]);
    });

    test("convierte IDs al crear una orden y rechaza el actor inválido", async () => {
        model.crear.mockResolvedValue({ id_orden: 8, titulo: "Orden" });
        await service.crear({ titulo: "Orden" }, "4");
        expect(model.crear).toHaveBeenCalledWith({ titulo: "Orden" }, 4);

        model.crear.mockClear();
        await expect(service.crear({ titulo: "Orden" }, 0)).rejects.toThrow();
        expect(model.crear).not.toHaveBeenCalled();
    });
});
