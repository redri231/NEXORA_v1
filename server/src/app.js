
const express = require("express");
const cors = require("cors");

const usuariosRoutes = require("./routes/usuarios.routes");
const reportesRoutes = require("./routes/reportes.routes");
const crmRoutes = require("./routes/crm.routes");
const authRoutes = require("./routes/auth.routes");
const cotizacionesRoutes = require("./routes/cotizaciones.routes");
const ventasRoutes = require("./routes/ventas.routes");
const campaniasRoutes = require("./routes/campanias.routes");
const proyectosRoutes = require("./routes/proyectos.routes");
const tareasRoutes = require("./routes/tareas.routes");
const produccionRoutes = require("./routes/produccion.routes");
const logisticaRoutes = require("./routes/logistica.routes");
const finanzasRoutes = require("./routes/finanzas.routes");
const pagosRoutes = require("./routes/pagos.routes");
const direccionRoutes = require("./routes/direccion.routes");
const notificacionesRoutes = require("./routes/notificaciones.routes");
const configuracionRoutes = require("./routes/configuracion.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const requerirAutenticacion = require("./middleware/autenticacion");
const { autorizarModulo } = require("./middleware/autorizacionRoles");
const registrarActividad = require("./middleware/registrarActividad");

const logger = require("./config/logger");
const pinoHttp = require("pino-http");

const app = express();

// ==========================================
// CORS
// ==========================================

const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({
    origin: frontendURL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
}));

// ==========================================
// MIDDLEWARES
// ==========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(pinoHttp({
    logger,
    autoLogging: {
        ignore: (req) => !req.url.startsWith("/api/"),
    },
    customProps(req) {
        return req.usuario?.id_usuario
            ? { usuarioId: req.usuario.id_usuario }
            : {};
    },
    customLogLevel(_req, res, error) {
        if (error || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
    },
    serializers: {
        req(req) {
            return {
                id: req.id,
                method: req.method,
                url: req.url.split("?")[0],
                remoteAddress: req.remoteAddress,
            };
        },
        res(res) {
            return {
                statusCode: res.statusCode
            };
        },
    },
}));

app.use(registrarActividad);

// ==========================================
// API
// ==========================================

app.use("/api/auth", authRoutes);

app.use(
    "/api/dashboard",
    requerirAutenticacion,
    autorizarModulo("dashboard"),
    dashboardRoutes
);

app.use(
    "/api/usuarios",
    requerirAutenticacion,
    autorizarModulo("usuarios"),
    usuariosRoutes
);

app.use(
    "/api/reportes",
    requerirAutenticacion,
    autorizarModulo("reportes"),
    reportesRoutes
);

app.use(
    "/api/crm",
    requerirAutenticacion,
    autorizarModulo("crm"),
    crmRoutes
);

app.use(
    "/api/cotizaciones",
    requerirAutenticacion,
    autorizarModulo("cotizaciones"),
    cotizacionesRoutes
);

app.use(
    "/api/ventas",
    requerirAutenticacion,
    autorizarModulo("ventas"),
    ventasRoutes
);

app.use(
    "/api/campanias",
    requerirAutenticacion,
    autorizarModulo("campanias"),
    campaniasRoutes
);

app.use(
    "/api/proyectos",
    requerirAutenticacion,
    autorizarModulo("proyectos"),
    proyectosRoutes
);

app.use(
    "/api/tareas",
    requerirAutenticacion,
    autorizarModulo("tareas"),
    tareasRoutes
);

app.use(
    "/api/produccion",
    requerirAutenticacion,
    autorizarModulo("produccion"),
    produccionRoutes
);

app.use(
    "/api/logistica",
    requerirAutenticacion,
    autorizarModulo("logistica"),
    logisticaRoutes
);

app.use(
    "/api/finanzas",
    requerirAutenticacion,
    autorizarModulo("finanzas"),
    finanzasRoutes
);

app.use(
    "/api/pagos",
    requerirAutenticacion,
    autorizarModulo("pagos"),
    pagosRoutes
);

app.use(
    "/api/direccion",
    requerirAutenticacion,
    autorizarModulo("direccion"),
    direccionRoutes
);

app.use(
    "/api/notificaciones",
    requerirAutenticacion,
    notificacionesRoutes
);

app.use(
    "/api/configuracion",
    requerirAutenticacion,
    configuracionRoutes
);

// ==========================================
// RUTA PRINCIPAL DEL BACKEND
// ==========================================

app.get("/", (req, res) => {
    res.status(200).json({
        mensaje: "NEXORA API funcionando correctamente",
        estado: "OK",
        entorno: process.env.NODE_ENV || "development"
    });
});

// ==========================================
// RUTA NO ENCONTRADA
// ==========================================

app.use((req, res) => {
    res.status(404).json({
        mensaje: "Ruta no encontrada"
    });
});

// ==========================================
// MANEJO GLOBAL DE ERRORES
// ==========================================

app.use((err, req, res, next) => {
    logger.error(
        {
            err,
            method: req.method,
            url: req.originalUrl.split("?")[0]
        },
        "Error interno del servidor"
    );

    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        mensaje: err.status && err.status < 500
            ? err.message
            : "Error interno del servidor"
    });
});

module.exports = app;
