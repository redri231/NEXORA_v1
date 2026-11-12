jest.mock("../../src/models/notificaciones.model", () => ({
    listarUsuariosActivos: jest.fn(),
    listarConfiguracionesCanales: jest.fn(),
    sincronizar: jest.fn(),
    listarActivas: jest.fn(),
    marcarLeida: jest.fn(),
    marcarTodasLeidas: jest.fn(),
}));

jest.mock("../../src/services/direccion.service", () => ({
    obtenerResumen: jest.fn(),
}));

const notificacionesService = require("../../src/services/notificaciones.service");
const notificacionesModel = require("../../src/models/notificaciones.model");
const direccionService = require("../../src/services/direccion.service");

describe("notificacionesService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        direccionService.obtenerResumen.mockResolvedValue({ alertas: [] });
        notificacionesModel.listarUsuariosActivos.mockResolvedValue([]);
        notificacionesModel.listarConfiguracionesCanales.mockResolvedValue([]);
        notificacionesModel.sincronizar.mockResolvedValue(undefined);
        notificacionesModel.listarActivas.mockResolvedValue([{
            id_notificacion: 12,
            clave_evento: "gerencial:tarea:7",
            tipo: "Tarea vencida",
            nivel: "critico",
            titulo: "Tarea vencida",
            mensaje: "Hay una tarea vencida",
            ruta: "/tareas",
            activa: true,
            fecha_creacion: "2026-11-01",
            fecha_lectura: null,
        }]);
    });

    test("sincroniza alertas antes de listar y adapta el resultado al DTO", async () => {
        const resultado = await notificacionesService.listar(5);

        expect(direccionService.obtenerResumen).toHaveBeenCalledTimes(1);
        expect(notificacionesModel.sincronizar).toHaveBeenCalledWith([]);
        expect(notificacionesModel.listarActivas).toHaveBeenCalledWith(5);
        expect(resultado).toEqual([expect.objectContaining({
            id: 12,
            leida: false,
            clave_evento: "gerencial:tarea:7",
        })]);
    });

    test("traduce el resultado al marcar una notificación como leída", async () => {
        notificacionesModel.marcarLeida.mockResolvedValue({ id_notificacion: 12 });
        expect(await notificacionesService.marcarLeida(12, 5)).toBe(true);

        notificacionesModel.marcarLeida.mockResolvedValue(null);
        expect(await notificacionesService.marcarLeida(99, 5)).toBe(false);
    });

    test("delega el marcado de todas las notificaciones al modelo", async () => {
        notificacionesModel.marcarTodasLeidas.mockResolvedValue(3);

        await expect(notificacionesService.marcarTodasLeidas(5)).resolves.toBe(3);
        expect(notificacionesModel.marcarTodasLeidas).toHaveBeenCalledWith(5);
    });
});
