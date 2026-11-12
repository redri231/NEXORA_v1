jest.mock("../../src/models/configuracion.model", () => ({
    listarRoles: jest.fn(), listarMatrizPermisos: jest.fn(), listarAreas: jest.fn(),
    listarServicios: jest.fn(), listarConfiguracionNotificaciones: jest.fn(), obtenerEmpresa: jest.fn(),
    actualizarPermisosRol: jest.fn(), guardarServicio: jest.fn(), cambiarEstadoServicio: jest.fn(),
    actualizarNotificacion: jest.fn(), guardarEmpresa: jest.fn(), tienePermiso: jest.fn(), listarModulosUsuario: jest.fn(),
}));

const service = require("../../src/services/configuracion.service");
const model = require("../../src/models/configuracion.model");

describe("configuracionService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("elimina IDs repetidos antes de actualizar permisos", async () => {
        model.actualizarPermisosRol.mockResolvedValue({ success: true });

        await service.actualizarPermisos(2, [1, 1, 3]);

        expect(model.actualizarPermisosRol).toHaveBeenCalledWith(2, [1, 3]);
    });

    test("delega la consulta de permisos y módulos por rol", async () => {
        model.tienePermiso.mockResolvedValue(true);
        model.listarModulosUsuario.mockResolvedValue(["crm"]);

        await expect(service.tienePermiso("Marketing", "crm", "Ver")).resolves.toBe(true);
        await expect(service.listarModulosUsuario("Marketing")).resolves.toEqual(["crm"]);
    });
});
