const model = require("../models/dashboard.model");
const configuracionModel = require("../models/configuracion.model");
const { dashboardDTO } = require("../dto/dashboard.dto");

function normalizar(valor) { return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase(); }

async function obtenerResumen(usuario) {
    const rol = normalizar(usuario.rol);
    const modulos = await configuracionModel.listarModulosUsuario(usuario.rol);
    const accesos = new Set(modulos.map(normalizar));
    const tiene = (...nombres) => accesos.has("*") || nombres.some((nombre) => accesos.has(normalizar(nombre)));
    const indicadores = {};
    const graficos = {};
    const consultas = [];

    if (tiene("crm")) {
        consultas.push((async () => {
            indicadores.clientes = await model.indicadoresClientes();
            indicadores.leads = await model.indicadoresLeads();
            graficos.clientes_mes = await model.clientesPorMes();
        })());
    }
    if (tiene("cotizaciones")) consultas.push(model.indicadoresCotizaciones().then((data) => { indicadores.cotizaciones = data; }));
    if (tiene("proyectos")) {
        consultas.push((async () => {
            indicadores.proyectos = await model.indicadoresProyectos();
            graficos.proyectos_estado = await model.proyectosPorEstado();
        })());
    }
    if (tiene("tareas", "rrhh")) {
        consultas.push((async () => {
            indicadores.tareas = await model.indicadoresTareas();
            graficos.tareas_colaborador = await model.tareasPorColaborador();
        })());
    }
    if (tiene("campanas", "campanias")) consultas.push(model.rendimientoCampanias().then((data) => { indicadores.campanias = data; graficos.campanias_roi = data.rendimiento; }));
    if (tiene("finanzas")) consultas.push(model.finanzas().then((data) => { indicadores.finanzas = data.resumen; graficos.ingresos_gastos = data.serie; }));
    if (tiene("logistica")) consultas.push(model.inventario().then((data) => { indicadores.inventario = data; }));

    const esGerencia = ["administrador", "gerencia"].includes(rol);
    let actividad = [];
    consultas.push(model.actividadReciente(usuario, esGerencia).then((data) => { actividad = data; }));
    await Promise.all(consultas);
    return dashboardDTO({ modulos: [...accesos], indicadores, graficos, actividad });
}

module.exports = { obtenerResumen };
