jest.mock("bcrypt", () => ({ hash: jest.fn() }));
jest.mock("../../src/models/usuario.model", () => ({
    obtenerTodos: jest.fn(), obtenerPorId: jest.fn(), crear: jest.fn(),
    actualizar: jest.fn(), cambiarEstado: jest.fn(), obtenerRoles: jest.fn(),
}));

const service = require("../../src/services/usuarios.service");
const model = require("../../src/models/usuario.model");
const bcrypt = require("bcrypt");

describe("usuariosService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("hashea la contraseña antes de pasarla al modelo y no la devuelve en el DTO", async () => {
        bcrypt.hash.mockResolvedValue("hash-seguro");
        model.crear.mockResolvedValue({ id_usuario: 3, username: "ana", password_hash: "hash-seguro" });

        const resultado = await service.crear({ username: "ana", password: "clave" });

        expect(bcrypt.hash).toHaveBeenCalledWith("clave", 10);
        expect(model.crear).toHaveBeenCalledWith({ username: "ana", password: "clave" }, "hash-seguro");
        expect(resultado).toEqual({ id_usuario: 3, username: "ana" });
        expect(resultado).not.toHaveProperty("password_hash");
    });

    test("no genera hash si la contraseña no cambia durante una actualización", async () => {
        model.actualizar.mockResolvedValue({ id_usuario: 3, username: "ana" });

        await service.actualizar(3, { username: "ana", password: "  " });

        expect(bcrypt.hash).not.toHaveBeenCalled();
        expect(model.actualizar).toHaveBeenCalledWith(3, { username: "ana", password: "  " }, null);
    });
});
