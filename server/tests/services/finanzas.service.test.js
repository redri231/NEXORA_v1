const serviceModule = require("../../src/services/finanzas.service");

describe("finanzasService", () => {
    test("mapea movimientos a DTO y conserva solo campos expuestos", async () => {
        const repo = {
            listarMovimientos: jest.fn().mockResolvedValue([{ id_movimiento: 3, monto: 80, secreto: "oculto" }]),
        };
        const service = serviceModule.crearFinanzasService(repo);

        await expect(service.listarMovimientos({ tipo: "Gasto" })).resolves.toEqual([
            { id_movimiento: 3, monto: 80 },
        ]);
        expect(repo.listarMovimientos).toHaveBeenCalledWith({ tipo: "Gasto" });
    });

    test("rechaza IDs inválidos antes de cambiar el estado del gasto", async () => {
        const repo = { cambiarEstadoGasto: jest.fn() };
        const service = serviceModule.crearFinanzasService(repo);

        await expect(service.cambiarEstadoGasto(0, "Pagado")).rejects.toThrow();
        expect(repo.cambiarEstadoGasto).not.toHaveBeenCalled();
    });
});
