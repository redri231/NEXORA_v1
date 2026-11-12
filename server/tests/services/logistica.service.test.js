jest.mock("../../src/models/logistica.model", () => ({
    listarProductos: jest.fn(), obtenerProducto: jest.fn(), guardarProducto: jest.fn(),
    listarProveedores: jest.fn(), guardarProveedor: jest.fn(), cambiarProveedorEstado: jest.fn(),
    catalogos: jest.fn(), resumen: jest.fn(), listarMovimientos: jest.fn(), registrarMovimiento: jest.fn(),
    listarSolicitudes: jest.fn(), cambiarSolicitud: jest.fn(),
}));

const service = require("../../src/services/logistica.service");
const model = require("../../src/models/logistica.model");

describe("logisticaService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("valida el usuario actor antes de registrar un movimiento", async () => {
        expect(() => service.registrarMovimiento({ id_producto: 1 }, "0")).toThrow();
        expect(model.registrarMovimiento).not.toHaveBeenCalled();
    });

    test("normaliza IDs al cambiar el estado de una solicitud", async () => {
        model.cambiarSolicitud.mockResolvedValue({ id_solicitud: 9, estado: "Aprobada" });

        await expect(service.cambiarSolicitud("9", "Aprobada", "4"))
            .resolves.toEqual({ id_solicitud: 9, estado: "Aprobada" });
        expect(model.cambiarSolicitud).toHaveBeenCalledWith(9, "Aprobada", 4);
    });
});
