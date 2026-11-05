const {
    crearUsuarioSchema,
    actualizarUsuarioSchema,
    idParamsSchema,
} = require("../../src/validators/usuarios.schemas");

const usuarioValido = {
    nombres: "Ana María",
    apellidos: "Pérez Ruiz",
    email: "ana@example.com",
    username: "ana",
    password: "secreto",
    cargo: "Analista",
    area: "Operaciones",
    estado: "Activo",
    id_rol: "2",
};

describe("schemas de usuarios", () => {
    test("valida un usuario nuevo y convierte id_rol a número", () => {
        const resultado = crearUsuarioSchema.safeParse(usuarioValido);

        expect(resultado.success).toBe(true);
        expect(resultado.data.id_rol).toBe(2);
    });

    test("rechaza correo inválido y propiedades inesperadas", () => {
        expect(crearUsuarioSchema.safeParse({ ...usuarioValido, email: "correo-invalido" }).success).toBe(false);
        expect(crearUsuarioSchema.safeParse({ ...usuarioValido, administrador: true }).success).toBe(false);
    });

    test("permite omitir contraseña al actualizar y convierte el id de ruta", () => {
        const { password, ...datosSinPassword } = usuarioValido;
        const actualizado = actualizarUsuarioSchema.safeParse({ ...datosSinPassword, password: "" });
        const params = idParamsSchema.safeParse({ id: "12" });

        expect(actualizado.success).toBe(true);
        expect(actualizado.data.password).toBeUndefined();
        expect(params).toEqual({ success: true, data: { id: 12 } });
    });

    test.each(["0", "-1", "texto"]) ("rechaza id de ruta inválido: %s", (id) => {
        expect(idParamsSchema.safeParse({ id }).success).toBe(false);
    });
});
