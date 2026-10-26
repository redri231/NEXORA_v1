const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: [
    'password',
    'password_hash',
    'req.headers.authorization',
    'req.headers.cookie'
  ]
});

module.exports = logger;