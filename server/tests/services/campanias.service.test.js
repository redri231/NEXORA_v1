jest.mock("../../src/models/campanias.model", () => ({
    listar: jest.fn(),
    obtenerPorId: jest.fn(),
    guardar: jest.fn(),
    cambiarEstado: jest.fn(),
    registrarIndicador: jest.fn(),
    clientes: jest.fn(), usuarios: jest.fn(), proyectos: jest.fn(),
    listarProductosMaterial: jest.fn(), listarSolicitudesMaterial: jest.fn(),
    crearSolicitudMaterial: jest.fn(), marcarFinalizadas: jest.fn(), resumenRoi: jest.fn(),
}));

const service = require("../../src/services/campanias.service");
const model = require("../../src/models/campanias.model");

describe("campaniasService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("mapea campañas al DTO de salida", async () => {
        model.listar.mockResolvedValue([{ id_campania: 7, nombre: "Verano", secreto: "oculto" }]);

        await expect(service.listar({ estado: "Activa" })).resolves.toEqual([
            { id_campania: 7, nombre: "Verano" },
        ]);
        expect(model.listar).toHaveBeenCalledWith({ estado: "Activa" });
    });

    test("valida el ID antes de consultar el modelo", async () => {
        await expect(service.obtenerPorId("0")).rejects.toThrow();
        expect(model.obtenerPorId).not.toHaveBeenCalled();
    });
});
