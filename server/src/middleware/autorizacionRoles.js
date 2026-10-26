const configuracionService = require("../services/configuracion.service");

function normalizar(valor) {
    return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function esLectura(req) { return ["GET", "HEAD", "OPTIONS"].includes(req.method.toUpperCase()); }
function denegar(res, mensaje = "No tienes permisos para realizar esta acción.") {
    return res.status(403).json({ success: false, mensaje });
}

function autorizarModulo(modulo) {
    return async (req, res, next) => {
        const rol = normalizar(req.usuario?.rol);
        const ruta = req.path.replace(/\/$/, "") || "/";
        if (rol === "administrador") return next();
        if (rol === "gerencia") return esLectura(req)
            ? next()
            : denegar(res, "Gerencia tiene acceso de consulta. Las modificaciones corresponden al área responsable o a Administración.");

        if (modulo === "reportes") {
            if (!esLectura(req)) return denegar(res);
            try {
                if (!await configuracionService.tienePermiso(req.usuario?.rol, "reportes", "Ver")) return denegar(res, "Tu rol no tiene permiso para consultar reportes.");
            } catch (error) { return next(error); }
            const segmento = ruta.split("/").filter(Boolean)[0];
            const tiposPorRol = {
                "marketing y ventas": ["Ventas"], operaciones: ["Proyectos", "Productividad"],
                logistica: ["Inventario"], finanzas: ["Finanzas"]
            };
            if (["catalogos", "historial"].includes(segmento)) return tiposPorRol[rol]?.length ? next() : denegar(res, "Tu rol no tiene acceso a reportes.");
            if (["vista-previa", "exportar"].includes(segmento)) return (tiposPorRol[rol] || []).includes(req.query?.tipo) ? next() : denegar(res, "No tienes permisos para generar este reporte.");
            const reportesPorRol = {
                "marketing y ventas": ["clientes", "leads", "cotizaciones", "ventas", "campanias"],
                operaciones: ["usuarios"], logistica: ["inventario"], finanzas: ["finanzas"]
            };
            return (reportesPorRol[rol] || []).includes(segmento) ? next() : denegar(res, "No tienes permisos para consultar este reporte.");
        }

        const accion = esLectura(req) ? "Ver" : req.method === "POST" ? "Crear" : req.method === "DELETE" ? "Eliminar" : "Editar";
        const moduloDb = modulo === "campanias" ? "campanas" : modulo;
        try {
            return await configuracionService.tienePermiso(req.usuario?.rol, moduloDb, accion)
                ? next()
                : denegar(res, "Tu rol no tiene permiso para esta acción en el módulo.");
        } catch (error) { return next(error); }
    };
}

module.exports = { autorizarModulo, normalizar };
