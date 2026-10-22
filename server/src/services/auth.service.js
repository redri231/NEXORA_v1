const bcrypt = require("bcrypt");
const crypto = require("crypto");
const authModel = require("../models/auth.model");
const { usuarioDTO } = require("../dto/usuario.dto");

const DURACION_TOKEN_SEGUNDOS = 8 * 60 * 60;

function obtenerSecreto() {
    const secret = process.env.AUTH_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error("AUTH_SECRET debe estar configurado con al menos 32 caracteres.");
    }

    return secret;
}

function validarConfiguracion() {
    if (!process.env.AUTH_SECRET && process.env.NODE_ENV !== "production") {
        process.env.AUTH_SECRET = crypto.randomBytes(48).toString("base64url");
        console.warn("AUTH_SECRET no está configurado; se generó uno temporal para desarrollo. Las sesiones vencerán al reiniciar el servidor.");
    }

    obtenerSecreto();
}

function firma(contenido) {
    return crypto
        .createHmac("sha256", obtenerSecreto())
        .update(contenido)
        .digest("base64url");
}

function crearToken(idUsuario) {
    const ahora = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(JSON.stringify({
        sub: String(idUsuario),
        iat: ahora,
        exp: ahora + DURACION_TOKEN_SEGUNDOS
    })).toString("base64url");

    const contenido = `v1.${payload}`;
    return `${contenido}.${firma(contenido)}`;
}

function verificarToken(token) {
    try {
        const [version, payload, firmaRecibida, extra] = token.split(".");
        if (version !== "v1" || !payload || !firmaRecibida || extra) return null;

        const contenido = `${version}.${payload}`;
        const firmaEsperada = Buffer.from(firma(contenido));
        const firmaActual = Buffer.from(firmaRecibida);

        if (firmaEsperada.length !== firmaActual.length ||
            !crypto.timingSafeEqual(firmaEsperada, firmaActual)) return null;

        const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        if (!claims.sub || !Number.isInteger(claims.exp) || claims.exp <= Math.floor(Date.now() / 1000)) return null;

        return claims;
    } catch {
        return null;
    }
}

async function iniciarSesion(username, password) {
    const usuario = await authModel.obtenerUsuarioPorUsername(String(username || "").trim());

    if (!usuario || usuario.estado !== "Activo") return null;

    const passwordValida = await bcrypt.compare(String(password || ""), usuario.password_hash);
    if (!passwordValida) return null;

    const { password_hash, ...perfil } = usuario;
    return { token: crearToken(usuario.id_usuario), usuario: usuarioDTO(perfil) };
}

async function obtenerSesion(token) {
    const claims = verificarToken(token);
    if (!claims) return null;

    return usuarioDTO(await authModel.obtenerUsuarioActivoPorId(claims.sub));
}

module.exports = { iniciarSesion, obtenerSesion, validarConfiguracion };
