jest.mock("../../src/services/auth.service", () => ({
    iniciarSesion: jest.fn(),
    obtenerSesion: jest.fn(),
}));
jest.mock("../../src/services/auditoria.service", () => ({ registrar: jest.fn().mockResolvedValue(undefined) }));
jest.mock("../../src/services/configuracion.service", () => ({
    listarModulosUsuario: jest.fn(),
    tienePermiso: jest.fn(),
}));
jest.mock("../../src/services/dashboard.service", () => ({ obtenerResumen: jest.fn() }));
jest.mock("../../src/services/usuarios.service", () => ({ obtenerTodos: jest.fn(), crear: jest.fn() }));
jest.mock("../../src/services/reportesGenerales.service", () => ({ crearVistaPrevia: jest.fn() }));
jest.mock("../../src/services/crm.service", () => ({ obtenerClientes: jest.fn(), crearLead: jest.fn() }));
jest.mock("../../src/services/cotizaciones.service", () => ({ listar: jest.fn() }));
jest.mock("../../src/services/ventas.service", () => ({ listar: jest.fn() }));
jest.mock("../../src/services/campanias.service", () => ({ listar: jest.fn() }));
jest.mock("../../src/services/proyectos.service", () => ({ listar: jest.fn() }));
jest.mock("../../src/services/tareas.service", () => ({ listar: jest.fn() }));
jest.mock("../../src/services/produccion.service", () => ({ listarTablero: jest.fn() }));
jest.mock("../../src/services/logistica.service", () => ({ listarProductos: jest.fn() }));
jest.mock("../../src/services/finanzas.service", () => ({ listarMovimientos: jest.fn() }));
jest.mock("../../src/services/pagos.service", () => ({ listar: jest.fn() }));
jest.mock("../../src/services/direccion.service", () => ({ obtenerResumen: jest.fn() }));
jest.mock("../../src/services/notificaciones.service", () => ({ listar: jest.fn() }));

const request = require("supertest");
const app = require("../../src/app");
const authService = require("../../src/services/auth.service");
const configuracionService = require("../../src/services/configuracion.service");
const servicios = {
    dashboard: require("../../src/services/dashboard.service"),
    usuarios: require("../../src/services/usuarios.service"),
    reportes: require("../../src/services/reportesGenerales.service"),
    crm: require("../../src/services/crm.service"),
    cotizaciones: require("../../src/services/cotizaciones.service"),
    ventas: require("../../src/services/ventas.service"),
    campanias: require("../../src/services/campanias.service"),
    proyectos: require("../../src/services/proyectos.service"),
    tareas: require("../../src/services/tareas.service"),
    produccion: require("../../src/services/produccion.service"),
    logistica: require("../../src/services/logistica.service"),
    finanzas: require("../../src/services/finanzas.service"),
    pagos: require("../../src/services/pagos.service"),
    direccion: require("../../src/services/direccion.service"),
    notificaciones: require("../../src/services/notificaciones.service"),
    configuracion: require("../../src/services/configuracion.service"),
};

const administrador = {
    id_usuario: 1,
    nombres: "Ana",
    apellidos: "Pérez",
    email: "ana@example.com",
    username: "ana",
    estado: "Activo",
    id_rol: 1,
    rol: "Administrador",
};

const rutasDeModulos = [
    ["dashboard", "/api/dashboard/resumen", "obtenerResumen"],
    ["usuarios", "/api/usuarios", "obtenerTodos"],
    ["reportes", "/api/reportes/vista-previa?tipo=Inventario", "crearVistaPrevia"],
    ["crm", "/api/crm/clientes", "obtenerClientes"],
    ["cotizaciones", "/api/cotizaciones", "listar"],
    ["ventas", "/api/ventas", "listar"],
    ["campanias", "/api/campanias", "listar"],
    ["proyectos", "/api/proyectos", "listar"],
    ["tareas", "/api/tareas", "listar"],
    ["produccion", "/api/produccion/ordenes", "listarTablero"],
    ["logistica", "/api/logistica/productos", "listarProductos"],
    ["finanzas", "/api/finanzas/movimientos", "listarMovimientos"],
    ["pagos", "/api/pagos", "listar"],
    ["direccion", "/api/direccion/resumen", "obtenerResumen"],
    ["notificaciones", "/api/notificaciones", "listar"],
    ["configuracion", "/api/configuracion/mis-permisos", "listarModulosUsuario"],
];

describe("integración HTTP de módulos del servidor", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        authService.obtenerSesion.mockResolvedValue(administrador);
        configuracionService.tienePermiso.mockResolvedValue(true);
        configuracionService.listarModulosUsuario.mockResolvedValue(["crm", "ventas"]);
        Object.values(servicios).forEach((service) => {
            Object.values(service).forEach((method) => method.mockResolvedValue([]));
        });
    });

    test.each(rutasDeModulos)("%s atraviesa autenticación, ruta y controlador", async (modulo, ruta, metodo) => {
        const servicio = servicios[modulo];
        const respuestaServicio = [{ modulo }];
        servicio[metodo].mockResolvedValue(respuestaServicio);

        const response = await request(app)
            .get(ruta)
            .set("Authorization", "Bearer token-de-prueba");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ success: true, data: respuestaServicio });
        expect(authService.obtenerSesion).toHaveBeenCalledWith("token-de-prueba");
        expect(servicio[metodo]).toHaveBeenCalledTimes(1);
    });

    test.each(rutasDeModulos)("%s rechaza solicitudes sin sesión", async (modulo, ruta) => {
        const response = await request(app).get(ruta);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(authService.obtenerSesion).not.toHaveBeenCalled();
    });

    test("el POST de CRM valida datos, autentica y devuelve 201", async () => {
        const lead = { id_lead: 20, nombre: "Lead Nexora", estado: "Activo" };
        servicios.crm.crearLead.mockResolvedValue(lead);

        const response = await request(app)
            .post("/api/crm/leads")
            .set("Authorization", "Bearer token-de-prueba")
            .send({ nombre: "Lead Nexora" });

        expect(response.status).toBe(201);
        expect(response.body).toEqual(expect.objectContaining({ success: true, data: lead }));
        expect(servicios.crm.crearLead).toHaveBeenCalledWith(expect.objectContaining({ nombre: "Lead Nexora" }));
    });

    test("una solicitud inválida de CRM termina en 400 antes del servicio", async () => {
        const response = await request(app)
            .post("/api/crm/leads")
            .set("Authorization", "Bearer token-de-prueba")
            .send({ nombre: "", campo_desconocido: true });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(servicios.crm.crearLead).not.toHaveBeenCalled();
    });
});
