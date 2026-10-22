const { z, requiredText } = require("./shared.schemas");

const loginSchema = z.object({
    username: requiredText(40),
    password: z.string().min(1)
}).strict();

module.exports = { loginSchema };
