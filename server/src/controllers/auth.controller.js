const authService = require("../services/auth.service");

async function iniciarSesion(req, res) {
    try {
        const { username, password } = req.body || {};
        if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
            return res.status(400).json({ success: false, mensaje: "Ingresa tu usuario y contraseña." });
        }

        const sesion = await authService.iniciarSesion(username, password);
        if (!sesion) {
            return res.status(401).json({ success: false, mensaje: "Usuario o contraseña incorrectos, o cuenta inactiva." });
        }

        return res.json({ success: true, data: sesion });
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        return res.status(500).json({ success: false, mensaje: "No se pudo iniciar sesión." });
    }
}

async function obtenerSesion(req, res) {
    return res.json({ success: true, data: req.usuario });
}

module.exports = { iniciarSesion, obtenerSesion };
