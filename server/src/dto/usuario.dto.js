function seleccionar(origen, campos) {
    if (!origen) return null;
    return Object.fromEntries(campos
        .filter((campo) => origen[campo] !== undefined)
        .map((campo) => [campo, origen[campo]]));
}

const usuarioCampos = [
    "id_usuario", "nombres", "apellidos", "email", "username", "cargo",
    "area", "estado", "fecha_registro", "id_rol", "rol"
];

function usuarioDTO(usuario) {
    return seleccionar(usuario, usuarioCampos);
}

function rolDTO(rol) {
    return seleccionar(rol, ["id_rol", "nombre"]);
}

module.exports = { usuarioDTO, rolDTO };
