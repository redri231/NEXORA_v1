jest.mock("../../src/config/database", () => ({ query: jest.fn() }));

const service = require("../../src/services/reportes.service");
const pool = require("../../src/config/database");

describe("reportesService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("devuelve filas del reporte de usuarios", async () => {
        const filas = [{ id_usuario: 2, username: "ana" }];
        pool.query.mockResolvedValue({ rows: filas });

        await expect(service.obtenerUsuariosReporte()).resolves.toEqual(filas);
        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("FROM usuario"));
    });

    test("consulta filas de clientes y leads sin transformar el resultado", async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id_cliente: 3 }] }).mockResolvedValueOnce({ rows: [{ id_lead: 4 }] });

        await expect(service.obtenerClientesReporte()).resolves.toEqual([{ id_cliente: 3 }]);
        await expect(service.obtenerLeadsReporte()).resolves.toEqual([{ id_lead: 4 }]);
        expect(pool.query).toHaveBeenCalledTimes(2);
    });
});
