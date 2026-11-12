jest.mock("bcrypt", () => ({ compare: jest.fn() }));
jest.mock("../../src/models/auth.model", () => ({
    obtenerUsuarioPorUsername: jest.fn(),
    obtenerUsuarioActivoPorId: jest.fn(),
}));

const service = require("../../src/services/auth.service");
const model = require("../../src/models/auth.model");
const bcrypt = require("bcrypt");

describe("authService", () => {
    const oldSecret = process.env.AUTH_SECRET;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.AUTH_SECRET = "s".repeat(40);
    });

    afterAll(() => {
        if (oldSecret === undefined) delete process.env.AUTH_SECRET;
        else process.env.AUTH_SECRET = oldSecret;
    });

    test("rechaza usuario inexistente o inactivo sin comparar contraseña", async () => {
        model.obtenerUsuarioPorUsername.mockResolvedValue(null);
        await expect(service.iniciarSesion(" ana ", "clave")).resolves.toBeNull();
        expect(model.obtenerUsuarioPorUsername).toHaveBeenCalledWith("ana");
        expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test("crea una sesión firmada y excluye el hash del perfil", async () => {
        model.obtenerUsuarioPorUsername.mockResolvedValue({
            id_usuario: 3,
            username: "ana",
            nombres: "Ana",
            estado: "Activo",
            password_hash: "hash",
        });
        bcrypt.compare.mockResolvedValue(true);

        const sesion = await service.iniciarSesion("ana", "clave");

        expect(sesion.token.split(".")).toHaveLength(3);
        expect(sesion.usuario).toEqual(expect.objectContaining({ id_usuario: 3, username: "ana" }));
        expect(sesion.usuario).not.toHaveProperty("password_hash");

        model.obtenerUsuarioActivoPorId.mockResolvedValue({ id_usuario: 3, username: "ana", estado: "Activo" });
        await expect(service.obtenerSesion(sesion.token)).resolves.toEqual(
            expect.objectContaining({ id_usuario: 3, username: "ana" }),
        );
        expect(model.obtenerUsuarioActivoPorId).toHaveBeenCalledWith("3");
    });

    test("rechaza tokens manipulados sin consultar el modelo", async () => {
        await expect(service.obtenerSesion("token.invalido")).resolves.toBeNull();
        expect(model.obtenerUsuarioActivoPorId).not.toHaveBeenCalled();
    });
});
