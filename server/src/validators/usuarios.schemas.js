const { z, id, idRole, requiredText } = require("./shared.schemas");

const estado = z.enum(["Activo", "Inactivo"]);
const password = z.preprocess(
    (value) => value === "" ? undefined : value,
    z.string().min(1).optional()
);

const crearUsuarioSchema = z.object({
    nombres: requiredText(80),
    apellidos: requiredText(80),
    email: z.string().trim().min(1).max(120).email(),
    username: requiredText(40),
    password: z.string().min(1),
    cargo: requiredText(60),
    area: requiredText(60),
    estado: estado.optional(),
    id_rol: idRole
}).strict();

const actualizarUsuarioSchema = crearUsuarioSchema.extend({ password, estado });
const idParamsSchema = z.object({ id });

module.exports = { crearUsuarioSchema, actualizarUsuarioSchema, idParamsSchema };
