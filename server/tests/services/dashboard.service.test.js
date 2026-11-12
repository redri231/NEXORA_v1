jest.mock("../../src/models/dashboard.model", () => ({
    indicadoresClientes: jest.fn().mockResolvedValue({ total: 4 }),
    indicadoresLeads: jest.fn().mockResolvedValue({ total: 2 }),
    clientesPorMes: jest.fn().mockResolvedValue([]),
    indicadoresCotizaciones: jest.fn(),
    indicadoresProyectos: jest.fn(),
    proyectosPorEstado: jest.fn(),
    indicadoresTareas: jest.fn(),
    tareasPorColaborador: jest.fn(),
    rendimientoCampanias: jest.fn(),
    finanzas: jest.fn(),
    inventario: jest.fn(),
    actividadReciente: jest.fn().mockResolvedValue([]),
}));

jest.mock("../../src/models/configuracion.model", () => ({
    listarModulosUsuario: jest.fn(),
}));

const dashboardService = require("../../src/services/dashboard.service");
const dashboardModel = require("../../src/models/dashboard.model");
const configuracionModel = require("../../src/models/configuracion.model");

describe("dashboardService.obtenerResumen", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        configuracionModel.listarModulosUsuario.mockResolvedValue([" CRM "]);
        dashboardModel.actividadReciente.mockResolvedValue([
            { id_bitacora: 8, accion: "crear", entidad: "cliente", fecha_hora: "2026-11-01", usuario: null },
        ]);
    });

    test("consulta solo indicadores de módulos autorizados y normaliza el resultado", async () => {
        const usuario = { id_usuario: 1, rol: "Geréncia" };
        const resultado = await dashboardService.obtenerResumen(usuario);

        expect(configuracionModel.listarModulosUsuario).toHaveBeenCalledWith("Geréncia");
        expect(dashboardModel.indicadoresClientes).toHaveBeenCalledTimes(1);
        expect(dashboardModel.indicadoresLeads).toHaveBeenCalledTimes(1);
        expect(dashboardModel.indicadoresCotizaciones).not.toHaveBeenCalled();
        expect(dashboardModel.actividadReciente).toHaveBeenCalledWith(usuario, true);
        expect(resultado.indicadores).toEqual({ clientes: { total: 4 }, leads: { total: 2 } });
        expect(resultado.actividad[0]).toEqual(expect.objectContaining({
            id: 8,
            usuario: "Usuario desactivado",
        }));
    });
});
