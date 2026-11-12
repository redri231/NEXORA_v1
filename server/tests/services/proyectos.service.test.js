jest.mock("../../src/models/proyectos.model", () => ({
    listar: jest.fn(), obtenerPorId: jest.fn(), guardar: jest.fn(), catalogos: jest.fn(),
    cambiarEstado: jest.fn(), marcarAtrasados: jest.fn(), resumen: jest.fn(),
}));

const service = require("../../src/services/proyectos.service");
const model = require("../../src/models/proyectos.model");

describe("proyectosService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("convierte el ID antes de consultar el proyecto", async () => {
        model.obtenerPorId.mockResolvedValue({ id_proyecto: 4, nombre: "Portal", interno: true });

        await expect(service.obtener("4")).resolves.toEqual({ id_proyecto: 4, nombre: "Portal" });
        expect(model.obtenerPorId).toHaveBeenCalledWith(4);
    });

    test("devuelve null cuando el modelo no encuentra el proyecto", async () => {
        model.obtenerPorId.mockResolvedValue(null);

        await expect(service.obtener(4)).resolves.toBeNull();
    });
});
