jest.mock("../../src/models/bitacora.model", () => ({ registrar: jest.fn() }));

const service = require("../../src/services/auditoria.service");
const model = require("../../src/models/bitacora.model");

describe("auditoriaService", () => {
    beforeEach(() => jest.clearAllMocks());

    test("registra la creación de una entidad con usuario, ID y descripción", async () => {
        const req = {
            usuario: { id_usuario: 6 },
            baseUrl: "/api/usuarios",
            route: { path: "/" },
            method: "POST",
            params: {},
            validatedParams: {},
        };

        await service.registrar(req, { data: { id_usuario: 12 }, mensaje: "Usuario creado." });

        expect(model.registrar).toHaveBeenCalledWith({
            accion: "Crear",
            entidad: "usuario",
            idEntidad: 12,
            descripcion: "Usuario creado.",
            idUsuario: 6,
        });
    });

    test("omite el registro si no hay usuario o la ruta no está mapeada", async () => {
        await service.registrar({ baseUrl: "/api/usuarios", method: "POST" }, {});
        await service.registrar({ usuario: { id_usuario: 1 }, baseUrl: "/api/no-map", route: { path: "/" }, method: "POST" }, {});

        expect(model.registrar).not.toHaveBeenCalled();
    });
});
