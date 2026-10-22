function validarSolicitud({ body, params, query } = {}) {
    return (req, res, next) => {
        const errores = [];

        if (params) {
            const resultado = params.safeParse(req.params);
            if (resultado.success) {
                req.validatedParams = resultado.data;
            }
            else errores.push(...resultado.error.issues.map((issue) => ({
                campo: `params.${issue.path.join(".")}`,
                mensaje: issue.message
            })));
        }

        if (query) {
            const resultado = query.safeParse(req.query);
            if (resultado.success) req.validatedQuery = resultado.data;
            else errores.push(...resultado.error.issues.map((issue) => ({
                campo: `query.${issue.path.join(".")}`,
                mensaje: issue.message
            })));
        }

        if (body) {
            const resultado = body.safeParse(req.body);
            if (resultado.success) req.body = resultado.data;
            else errores.push(...resultado.error.issues.map((issue) => ({
                campo: `body.${issue.path.join(".")}`,
                mensaje: issue.message
            })));
        }

        if (errores.length) {
            return res.status(400).json({
                success: false,
                mensaje: "La solicitud contiene datos no válidos.",
                errores
            });
        }

        return next();
    };
}

module.exports = validarSolicitud;
