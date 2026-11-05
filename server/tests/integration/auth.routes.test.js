jest.mock("../../src/services/auth.service", () => ({
    iniciarSesion: jest.fn(),
    obtenerSesion: jest.fn(),
}));

jest.mock("../../src/services/usuarios.service", () => ({
    obtenerTodos: jest.fn(),
}));

jest.mock("../../src/services/configuracion.service", () => ({
    tienePermiso: jest.fn(),
}));

jest.mock("../../src/services/auditoria.service", () => ({
    registrar: jest.fn().mockResolvedValue(undefined),
}));

const request = require("supertest");
const app = require("../../src/app");
const authService = require("../../src/services/auth.service");
const usuariosService = require("../../src/services/usuarios.service");
const configuracionService = require("../../src/services/configuracion.service");

const administrador = {
    id_usuario: 1,
    nombres: "Ana",
    apellidos: "Pérez",
    email: "ana@example.com",
    username: "ana",
    cargo: "Administradora",
    area: "Dirección",
    estado: "Activo",
    id_rol: 1,
    rol: "Administrador",
};

describe("integración de rutas de autenticación", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        authService.iniciarSesion.mockResolvedValue(null);
        authService.obtenerSesion.mockResolvedValue(null);
        usuariosService.obtenerTodos.mockResolvedValue([]);
        configuracionService.tienePermiso.mockResolvedValue(true);
    });

    test("rechaza el inicio de sesión cuando faltan datos obligatorios", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({ username: "" });

        expect(response.status).toBe(400);
        expect(response.body).toEqual(expect.objectContaining({
            success: false,
            errores: expect.any(Array),
        }));
        expect(authService.iniciarSesion).not.toHaveBeenCalled();
    });

    test("responde 401 cuando las credenciales no son válidas", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({ username: "ana", password: "incorrecta" });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(authService.iniciarSesion).toHaveBeenCalledWith("ana", "incorrecta");
    });

    test("devuelve la sesión al iniciar sesión correctamente", async () => {
        const sesion = { token: "token-prueba", usuario: administrador };
        authService.iniciarSesion.mockResolvedValue(sesion);

        const response = await request(app)
            .post("/api/auth/login")
            .send({ username: "ana", password: "correcta" });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ success: true, data: sesion });
    });

    test("responde con un error controlado si falla el servicio de autenticación", async () => {
        authService.iniciarSesion.mockRejectedValue(new Error("Fallo interno de prueba"));

        const response = await request(app)
            .post("/api/auth/login")
            .send({ username: "ana", password: "correcta" });

        expect(response.status).toBe(500);
        expect(response.body).toEqual(expect.objectContaining({
            success: false,
            mensaje: expect.stringContaining("No se pudo iniciar"),
        }));
        expect(JSON.stringify(response.body)).not.toContain("Fallo interno de prueba");
    });

    test("protege la ruta de sesión actual si no se envía token", async () => {
        const response = await request(app).get("/api/auth/me");

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(authService.obtenerSesion).not.toHaveBeenCalled();
    });

    test.each(["token-vencido", "token-malformado"])(
        "rechaza una sesión inválida: %s",
        async (token) => {
            const response = await request(app)
                .get("/api/auth/me")
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(authService.obtenerSesion).toHaveBeenCalledWith(token);
        },
    );

    test("devuelve el perfil para una sesión válida", async () => {
        authService.obtenerSesion.mockResolvedValue(administrador);

        const response = await request(app)
            .get("/api/auth/me")
            .set("Authorization", "Bearer token-valido");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ success: true, data: administrador });
    });
});

describe("integración de rutas protegidas de usuarios", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        authService.obtenerSesion.mockResolvedValue(null);
        usuariosService.obtenerTodos.mockResolvedValue([]);
        configuracionService.tienePermiso.mockResolvedValue(true);
    });

    test("bloquea la ruta si no hay sesión", async () => {
        const response = await request(app).get("/api/usuarios");

        expect(response.status).toBe(401);
        expect(usuariosService.obtenerTodos).not.toHaveBeenCalled();
    });

    test("deniega el acceso si el rol no tiene permiso para el módulo", async () => {
        authService.obtenerSesion.mockResolvedValue({ ...administrador, rol: "Operaciones" });
        configuracionService.tienePermiso.mockResolvedValue(false);

        const response = await request(app)
            .get("/api/usuarios")
            .set("Authorization", "Bearer token-operaciones");

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(usuariosService.obtenerTodos).not.toHaveBeenCalled();
    });

    test("permite el acceso autorizado y responde con los usuarios", async () => {
        const usuarios = [{ id_usuario: 2, username: "luis", rol: "Operaciones" }];
        authService.obtenerSesion.mockResolvedValue(administrador);
        usuariosService.obtenerTodos.mockResolvedValue(usuarios);

        const response = await request(app)
            .get("/api/usuarios")
            .set("Authorization", "Bearer token-admin");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ success: true, data: usuarios });
        expect(usuariosService.obtenerTodos).toHaveBeenCalledTimes(1);
    });

    test("convierte errores del servicio de usuarios en una respuesta controlada", async () => {
        authService.obtenerSesion.mockResolvedValue(administrador);
        usuariosService.obtenerTodos.mockRejectedValue(new Error("Fallo interno de prueba"));

        const response = await request(app)
            .get("/api/usuarios")
            .set("Authorization", "Bearer token-admin");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            success: false,
            mensaje: "Error al obtener usuarios",
        });
        expect(JSON.stringify(response.body)).not.toContain("Fallo interno de prueba");
    });

    test("valida el cuerpo de creación antes de llamar al controlador", async () => {
        authService.obtenerSesion.mockResolvedValue(administrador);

        const response = await request(app)
            .post("/api/usuarios")
            .set("Authorization", "Bearer token-admin")
            .send({ username: "" });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });
});
