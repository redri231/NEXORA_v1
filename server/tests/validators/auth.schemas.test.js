const { loginSchema } = require("../../src/validators/auth.schemas");

describe("loginSchema", () => {
    test("acepta credenciales válidas y normaliza espacios del usuario", () => {
        const resultado = loginSchema.safeParse({ username: "  ana  ", password: "secreto" });

        expect(resultado.success).toBe(true);
        expect(resultado.data).toEqual({ username: "ana", password: "secreto" });
    });

    test.each([
        [{ username: "", password: "secreto" }, "rechaza un usuario vacío"],
        [{ username: "ana" }, "rechaza una contraseña ausente"],
        [{ username: "ana", password: "" }, "rechaza una contraseña vacía"],
        [{ username: "ana", password: "secreto", extra: true }, "rechaza propiedades no permitidas"],
    ])("%s: %s", (entrada) => {
        expect(loginSchema.safeParse(entrada).success).toBe(false);
    });
});
