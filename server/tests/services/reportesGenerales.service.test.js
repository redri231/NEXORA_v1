jest.mock("../../src/models/reportes.model", () => ({
    catalogos: jest.fn(),
    obtenerVentas: jest.fn(), obtenerProyectos: jest.fn(), obtenerInventario: jest.fn(),
    obtenerFinanzas: jest.fn(), obtenerProductividad: jest.fn(), registrarGenerado: jest.fn(), listarGenerados: jest.fn(),
}));

const service = require("../../src/services/reportesGenerales.service");
const model = require("../../src/models/reportes.model");

describe("reportesGeneralesService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("calcula totales de inventario para la vista previa", async () => {
        model.obtenerInventario.mockResolvedValue([
            { codigo: "A", stock_actual: 4, estado_stock: "Stock bajo" },
            { codigo: "B", stock_actual: "6", estado_stock: "Normal" },
        ]);

        const resultado = await service.crearVistaPrevia({ tipo: "Inventario" });

        expect(resultado.tipo).toBe("Inventario");
        expect(resultado.totales).toEqual({ productos: 2, stock_total: 10, stock_bajo: 1 });
        expect(resultado.generado).toBeNull();
        expect(model.registrarGenerado).not.toHaveBeenCalled();
    });

    test("calcula cumplimiento y carga del reporte de productividad", async () => {
        model.obtenerProductividad.mockResolvedValue([{
            nombre: "Ana", tareas: 4, tareas_completadas: 3, tareas_pendientes: 1,
            tareas_activas_actuales: 6, urgentes_activas_actuales: 2,
        }]);

        const resultado = await service.crearVistaPrevia({ tipo: "Productividad" });

        expect(resultado.filas[0]).toEqual(expect.objectContaining({ cumplimiento: 75, carga_pct: 88 }));
        expect(resultado.totales).toEqual(expect.objectContaining({ personas: 1, cumplimiento: 75 }));
    });
});
