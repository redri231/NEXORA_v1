jest.mock("../../src/models/ventas.model", () => ({
    listar: jest.fn(), obtenerPorId: jest.fn(), cotizacionesDisponibles: jest.fn(),
    proyectos: jest.fn(), resumen: jest.fn(), crear: jest.fn(), cambiarEstado: jest.fn(),
}));

const service = require("../../src/services/ventas.service");
const model = require("../../src/models/ventas.model");

describe("ventasService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("rechaza una venta basada en una cotización no disponible", async () => {
        model.cotizacionesDisponibles.mockResolvedValue([]);

        await expect(service.crear({ id_cotizacion: 7 })).rejects.toMatchObject({ code: "COTIZACION_NO_DISPONIBLE" });
        expect(model.crear).not.toHaveBeenCalled();
    });

    test("rechaza un proyecto que pertenece a otro cliente", async () => {
        model.cotizacionesDisponibles.mockResolvedValue([{ id_cotizacion: 7, id_cliente: 2 }]);
        model.proyectos.mockResolvedValue([{ id_proyecto: 9, id_cliente: 4 }]);

        await expect(service.crear({ id_cotizacion: 7, id_proyecto: 9 })).rejects.toMatchObject({ code: "PROYECTO_INVALIDO" });
        expect(model.crear).not.toHaveBeenCalled();
    });

    test("crea venta si la cotización está disponible y el proyecto corresponde", async () => {
        const datos = { id_cotizacion: 7, id_proyecto: 9 };
        model.cotizacionesDisponibles.mockResolvedValue([{ id_cotizacion: 7, id_cliente: 2 }]);
        model.proyectos.mockResolvedValue([{ id_proyecto: 9, id_cliente: 2, id_cotizacion: 7 }]);
        model.crear.mockResolvedValue({ id_venta: 11, ...datos, secreto: "privado" });

        await expect(service.crear(datos)).resolves.toEqual({ id_venta: 11, ...datos });
    });
});
