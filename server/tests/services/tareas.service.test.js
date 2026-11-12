jest.mock("../../src/models/tareas.model", () => ({
    listar: jest.fn(), obtenerPorId: jest.fn(), catalogos: jest.fn(), crear: jest.fn(),
    actualizar: jest.fn(), cambiarEstado: jest.fn(),
}));

const service = require("../../src/services/tareas.service");
const model = require("../../src/models/tareas.model");

describe("tareasService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("mapea una tarea al DTO y excluye campos no públicos", async () => {
        model.obtenerPorId.mockResolvedValue({ id_tarea: 2, titulo: "Revisión", password: "privado" });

        await expect(service.obtener("2")).resolves.toEqual({ id_tarea: 2, titulo: "Revisión" });
        expect(model.obtenerPorId).toHaveBeenCalledWith(2);
    });

    test("rechaza un ID inválido antes de modificar una tarea", async () => {
        await expect(service.actualizar(0, { titulo: "Nueva" })).rejects.toThrow();
        expect(model.actualizar).not.toHaveBeenCalled();
    });
});
