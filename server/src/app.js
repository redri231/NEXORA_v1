const express = require("express");
const cors = require("cors");
const path = require("path");

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
const requerirAutenticacion = require("./middleware/autenticacion");

const app = express();

app.use(cors());

app.use(express.json());


// ==========================================
// ARCHIVOS DEL CLIENTE
// ==========================================

const clientPath = path.join(__dirname, "../../client");

app.use(express.static(clientPath));


// ==========================================
// API
// ==========================================

app.use("/api/auth", authRoutes);

app.use("/api/usuarios", requerirAutenticacion, usuariosRoutes);

app.use("/api/reportes", requerirAutenticacion, reportesRoutes);

app.use("/api/crm", requerirAutenticacion, crmRoutes);

app.use("/api/cotizaciones", requerirAutenticacion, cotizacionesRoutes);

app.use("/api/ventas", requerirAutenticacion, ventasRoutes);

app.use("/api/campanias", requerirAutenticacion, campaniasRoutes);

app.use("/api/proyectos", requerirAutenticacion, proyectosRoutes);

app.use("/api/tareas", requerirAutenticacion, tareasRoutes);

app.use("/api/produccion", requerirAutenticacion, produccionRoutes);

app.use("/api/logistica", requerirAutenticacion, logisticaRoutes);


// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(clientPath, "index.html")
    );

});

app.use((err, req, res, next) => {
  logger.error({ err }, 'Error interno del servidor');
  res.status(500).json({
    mensaje: 'Error interno del servidor'
  });
});


module.exports = app;
