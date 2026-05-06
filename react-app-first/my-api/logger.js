// Centralized logger.
//
// Structured (JSON) output is the whole point — every log line is a parseable
// object with a fixed shape. That makes "show me every login failure from
// IP X today" a one-line query instead of a regex expedition.
//
// In dev we pipe through pino-pretty for human-readable output. In prod
// (NODE_ENV=production) we keep raw JSON so an aggregator like Loki, Datadog,
// or ELK can ingest it directly.
//
// Redaction lives at the logger level, not at each call site, so an
// accidental req.body.password log line still gets scrubbed before it
// touches disk. NEVER rely on developer discipline to keep secrets out of
// logs — make the logger refuse to write them.

const pino = require('pino');

const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',

    // Anything that matches one of these paths is replaced with '[REDACTED]'.
    // The `*` and `[*]` patterns let us match dynamic keys (cookies, headers).
    redact: {
        paths: [
            'req.headers.cookie',
            'req.headers.authorization',
            'req.body.password',
            'req.body.captchaAnswer',
            'res.headers["set-cookie"]',
            // Defensive: catch the same fields if they show up nested.
            '*.password',
            '*.passwordHash',
            '*.token',
            '*.jwt',
            '*.authorization',
            '*.cookie',
        ],
        censor: '[REDACTED]',
    },

    transport: !isProd ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
            singleLine: false,
        },
    } : undefined,
});

// Audit log helper.
//
// We tag audit events with `kind: 'audit'` so they can be filtered out of
// general application logs (e.g. for shipping to a separate immutable
// audit store, or for retention policy purposes). In a production system
// you'd write these to a separate, append-only stream entirely.
//
// Always pass `req` if you have one — it carries the request id, ip, and
// user-agent that future-you will need for forensics.
function audit(req, payload) {
    const log = (req && req.log) || logger;
    log.info(
        {
            kind: 'audit',
            ip: req?.ip,
            userAgent: req?.headers?.['user-agent'],
            userId: req?.user?.id,
            ...payload,
        },
        payload.event || 'audit'
    );
}

module.exports = { logger, audit };
