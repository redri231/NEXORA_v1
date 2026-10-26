require("dotenv").config({ quiet: true });

const pino = require("pino");

const logger = pino({
  name: "nexora-api",
  level: process.env.LOG_LEVEL || "info",
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "password",
      "password_hash",
      "token",
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.password_hash",
      "req.body.token",
    ],
    censor: "[REDACTED]",
  },
});

module.exports = logger;
