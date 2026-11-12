jest.mock("../../src/models/direccion.model", () => ({
    obtenerEquipo: jest.fn(),
    obtenerAlertasGerenciales: jest.fn(),
}));

const direccionService = require("../../src/services/direccion.service");
const direccionModel = require("../../src/models/direccion.model");

describe("direccionService.obtenerResumen", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        direccionModel.obtenerAlertasGerenciales.mockResolvedValue({
            proyectos: [], ordenes: [], productos: [], pagos: [], ventasPorFacturar: [],
            cotizaciones: [], campaniasBajoRendimiento: [], campaniasPorFinalizar: [],
        });
    });

    test("calcula carga, productividad, totales y alertas del equipo", async () => {
        direccionModel.obtenerEquipo.mockResolvedValue([{
            id_usuario: 6,
            nombres: "Ana",
            apellidos: "Pérez",
            tareas_activas: "7",
            tareas_completadas: "5",
            tareas_asignadas: "10",
            tareas_urgentes_activas: "2",
            tareas_vencidas: "1",
            tareas_urgentes_vencidas: "1",
            tareas_proximas: "0",
        }]);

        const resultado = await direccionService.obtenerResumen({ soloEquipo: true });

        expect(resultado.resumen).toEqual(expect.objectContaining({
            personal_activo: 1,
            tareas_activas: 7,
            tareas_vencidas: 1,
            productividad_equipo: 50,
            capacidad_puntos: 8,
        }));
        expect(resultado.equipo[0]).toEqual(expect.objectContaining({
            id_usuario: 6,
            carga_puntos: 8,
            carga_pct: 100,
            productividad_pct: 50,
        }));
        expect(resultado.alertas.map((alerta) => alerta.nivel)).toEqual(["critico", "advertencia"]);
        expect(direccionModel.obtenerAlertasGerenciales).not.toHaveBeenCalled();
    });

    test("devuelve ceros de productividad cuando no existen tareas asignadas", async () => {
        direccionModel.obtenerEquipo.mockResolvedValue([{
            id_usuario: 7, nombres: "Luis", apellidos: "Rojas", tareas_asignadas: 0,
        }]);

        const resultado = await direccionService.obtenerResumen({ soloEquipo: true });

        expect(resultado.equipo[0].productividad_pct).toBe(0);
        expect(resultado.resumen.productividad_equipo).toBe(0);
    });
});
