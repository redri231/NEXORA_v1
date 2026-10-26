const model = require("../models/configuracion.model");
const { servicioDTO, empresaDTO } = require("../dto/configuracion.dto");

async function obtenerPanel() {
    const [roles, matriz, areas, servicios, notificaciones, empresa] = await Promise.all([
        model.listarRoles(), model.listarMatrizPermisos(), model.listarAreas(), model.listarServicios(),
        model.listarConfiguracionNotificaciones(), model.obtenerEmpresa()
    ]);
    return { roles, matriz, areas, servicios: servicios.map(servicioDTO), notificaciones, empresa: empresaDTO(empresa) };
}

async function actualizarPermisos(idRol, permisos) {
    return model.actualizarPermisosRol(idRol, [...new Set(permisos)]);
}

async function guardarServicio(datos, id) { return servicioDTO(await model.guardarServicio(datos, id)); }
async function cambiarEstadoServicio(id, estado) { return servicioDTO(await model.cambiarEstadoServicio(id, estado)); }
async function actualizarNotificacion(id, datos) { return model.actualizarNotificacion(id, datos); }
async function guardarEmpresa(datos) { return empresaDTO(await model.guardarEmpresa(datos)); }
async function tienePermiso(rol, modulo, accion) { return model.tienePermiso(rol, modulo, accion); }
async function listarModulosUsuario(rol) { return model.listarModulosUsuario(rol); }

module.exports = { obtenerPanel, actualizarPermisos, guardarServicio, cambiarEstadoServicio, actualizarNotificacion, guardarEmpresa, tienePermiso, listarModulosUsuario };
