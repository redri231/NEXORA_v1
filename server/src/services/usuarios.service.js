const bcrypt = require("bcrypt");
const model = require("../models/usuario.model");
const { usuarioDTO, rolDTO } = require("../dto/usuario.dto");

async function obtenerTodos() {
    return (await model.obtenerTodos()).map(usuarioDTO);
}

async function obtenerPorId(id) {
    const usuario = await model.obtenerPorId(id);
    return usuarioDTO(usuario);
}

async function crear(usuario) {
    const passwordHash = await bcrypt.hash(usuario.password, 10);
    return usuarioDTO(await model.crear(usuario, passwordHash));
}

async function actualizar(id, usuario) {
    const passwordHash = usuario.password?.trim()
        ? await bcrypt.hash(usuario.password, 10)
        : null;
    return usuarioDTO(await model.actualizar(id, usuario, passwordHash));
}

async function cambiarEstado(id, estado) {
    return usuarioDTO(await model.cambiarEstado(id, estado));
}

async function obtenerRoles() {
    return (await model.obtenerRoles()).map(rolDTO);
}

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, cambiarEstado, obtenerRoles };
