const { z } = require("zod");

const numericId = z.union([z.string().regex(/^\d+$/), z.number().int()]).transform(Number);
const id = numericId.pipe(z.number().int().positive().safe());
const idRole = numericId.pipe(z.number().int().positive().max(2147483647));
const optionalText = (max) => z.preprocess(
    (value) => value === "" ? null : value,
    z.string().trim().max(max).nullable().optional()
);
const requiredText = (max) => z.string().trim().min(1).max(max);
const email = optionalText(120).refine(
    (value) => value == null || z.string().email().safeParse(value).success,
    "Debe ser un correo electrónico válido."
);

module.exports = { z, id, idRole, optionalText, requiredText, email };
