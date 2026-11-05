const validarSolicitud = require("../../src/middleware/validarSolicitud");
const { loginSchema } = require("../../src/validators/auth.schemas");
const { idParamsSchema } = require("../../src/validators/usuarios.schemas");

function crearResponse() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
}

describe("validarSolicitud", () => {
    test("normaliza body y params y continúa cuando son válidos", () => {
        const req = { body: { username: "  ana ", password: "clave" }, params: { id: "5" } };
        const res = crearResponse();
        const next = jest.fn();

        validarSolicitud({ body: loginSchema, params: idParamsSchema })(req, res, next);

        expect(req.body.username).toBe("ana");
        expect(req.validatedParams).toEqual({ id: 5 });
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    test("responde 400 con errores y no continúa si hay datos inválidos", () => {
        const req = { body: { username: "", password: "" }, params: { id: "0" } };
        const res = crearResponse();
        const next = jest.fn();

        validarSolicitud({ body: loginSchema, params: idParamsSchema })(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            errores: expect.arrayContaining([
                expect.objectContaining({ campo: expect.stringMatching(/^(body|params)\./) }),
            ]),
        }));
        expect(next).not.toHaveBeenCalled();
    });
});
