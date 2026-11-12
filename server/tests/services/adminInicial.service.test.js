jest.mock("../../src/services/usuarios.service", () => ({
    obtenerTodos: jest.fn(),
    crear: jest.fn(),
}));
jest.mock("../../src/config/logger", () => ({ info: jest.fn(), error: jest.fn() }));

const service = require("../../src/services/adminInicial.service");
const usuariosService = require("../../src/services/usuarios.service");

describe("adminInicialService", () => {
    const claves = ["ADMIN_INITIAL_PASSWORD", "ADMIN_INITIAL_EMAIL", "ADMIN_INITIAL_USERNAME", "ADMIN_INITIAL_ROLE_ID"];
    const envAntes = Object.fromEntries(claves.map((key) => [key, process.env[key]]));

    beforeEach(() => {
        jest.clearAllMocks();
        delete process.env.ADMIN_INITIAL_PASSWORD;
        delete process.env.ADMIN_INITIAL_EMAIL;
        delete process.env.ADMIN_INITIAL_USERNAME;
        delete process.env.ADMIN_INITIAL_ROLE_ID;
    });

    afterAll(() => {
        claves.forEach((key) => {
            if (envAntes[key] === undefined) delete process.env[key];
            else process.env[key] = envAntes[key];
        });
    });

    test("no crea otra cuenta cuando ya existen usuarios", async () => {
        usuariosService.obtenerTodos.mockResolvedValue([{ id_usuario: 1 }]);

        await expect(service.crearAdminInicial()).resolves.toBeUndefined();
        expect(usuariosService.crear).not.toHaveBeenCalled();
    });

    test("documenta error si no hay contraseña configurada", async () => {
        usuariosService.obtenerTodos.mockResolvedValue([]);

        await expect(service.crearAdminInicial()).rejects.toThrow("ADMIN_INITIAL_PASSWORD");
        expect(usuariosService.crear).not.toHaveBeenCalled();
    });
});
