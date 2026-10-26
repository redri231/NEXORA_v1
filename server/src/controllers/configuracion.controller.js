const logger = require("../config/logger");
const service = require("../services/configuracion.service");

function responderError(res, error, mensaje) {
    logger.error({ err: error }, `${mensaje}:`);
    if (error.code === "23505") return res.status(409).json({ success: false, mensaje: "Ya existe un registro con ese nombre." });
    if (error.code === "PERMISOS_INVALIDOS") return res.status(400).json({ success: false, mensaje: error.message });
    if (error.code === "ROL_PROTEGIDO") return res.status(400).json({ success: false, mensaje: error.message });
    return res.status(500).json({ success: false, mensaje });
}

async function panel(_req, res) {
    try { return res.json({ success: true, data: await service.obtenerPanel() }); }
    catch (error) { return responderError(res, error, "No se pudo cargar Configuración."); }
}

async function misPermisos(req, res) {
    try { return res.json({ success: true, data: await service.listarModulosUsuario(req.usuario.rol) }); }
    catch (error) { return responderError(res, error, "No se pudieron cargar los permisos."); }
}

async function permisosRol(req, res) {
    try {
        const actualizado = await service.actualizarPermisos(req.validatedParams.id, req.body.permisos);
        return actualizado ? res.json({ success: true, mensaje: "Permisos actualizados." }) : res.status(404).json({ success: false, mensaje: "Rol no encontrado." });
    } catch (error) { return responderError(res, error, "No se pudieron actualizar los permisos."); }
}

async function crearServicio(req, res) {
    try { return res.status(201).json({ success: true, data: await service.guardarServicio(req.body) }); }
    catch (error) { return responderError(res, error, "No se pudo crear el servicio."); }
}

async function actualizarServicio(req, res) {
    try {
        const data = await service.guardarServicio(req.body, req.validatedParams.id);
        return data ? res.json({ success: true, data }) : res.status(404).json({ success: false, mensaje: "Servicio no encontrado." });
    } catch (error) { return responderError(res, error, "No se pudo actualizar el servicio."); }
}

async function estadoServicio(req, res) {
    try {
        const data = await service.cambiarEstadoServicio(req.validatedParams.id, req.body.estado);
        return data ? res.json({ success: true, data }) : res.status(404).json({ success: false, mensaje: "Servicio no encontrado." });
    } catch (error) { return responderError(res, error, "No se pudo actualizar el servicio."); }
}

async function notificacion(req, res) {
    try {
        const data = await service.actualizarNotificacion(req.validatedParams.id, req.body);
        return data ? res.json({ success: true, data }) : res.status(404).json({ success: false, mensaje: "Configuración de alerta no encontrada." });
    } catch (error) { return responderError(res, error, "No se pudo actualizar la alerta."); }
}

async function guardarEmpresa(req, res) {
    try { return res.json({ success: true, data: await service.guardarEmpresa(req.body) }); }
    catch (error) { return responderError(res, error, "No se pudieron guardar los datos de la empresa."); }
}

module.exports = { panel, misPermisos, permisosRol, crearServicio, actualizarServicio, estadoServicio, notificacion, guardarEmpresa };
