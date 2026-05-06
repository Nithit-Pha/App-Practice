// Request body schemas. Each describes the exact shape we expect; anything
// outside of it is rejected with a 400 before the handler runs.
//
// "Parse, don't validate" — we don't sprinkle `if (!email)` checks through
// the handlers; the schema is the single source of truth for what's valid.

const { z } = require('zod');

// Reused field-level rules so signup/login agree on what's a valid email,
// password, captcha pair, etc.
const email = z.string().trim().toLowerCase().email().max(254);
// Password rules differ between signup and login on purpose:
//   - signupPassword enforces strength (min 8) so we don't accept weak ones.
//   - loginPassword only checks "not empty / not absurdly long" so old
//     accounts can still log in, AND so we don't leak "password too short"
//     as a distinct error from "wrong password".
const signupPassword = z.string().min(8).max(128);
const loginPassword = z.string().min(1).max(128);
const captchaId = z.string().min(1).max(64);
const captchaAnswer = z.string().min(1).max(32);

const signupBody = z.object({
    name: z.string().trim().min(1).max(100),
    email,
    password: signupPassword,
    captchaId,
    captchaAnswer,
}).strict(); // .strict() rejects unknown fields — e.g. a sneaky `role: "admin"`

const loginBody = z.object({
    email,
    password: loginPassword,
    captchaId,
    captchaAnswer,
}).strict();

const activityIdParam = z.object({
    id: z.coerce.number().int().positive(),
});

const activityUpdateBody = z.object({
    completed: z.boolean(),
}).strict();

// Schema for environment variables. Validating these on startup means a
// missing or malformed JWT_SECRET fails loudly when the server boots,
// not silently on the first login attempt.
const envSchema = z.object({
    PORT: z.coerce.number().int().positive().default(5000),
    ALLOWED_ORIGIN: z.string().url(),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
    JWT_EXPIRES_IN: z.string().default('1h'),
    BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(10),
});

module.exports = {
    signupBody,
    loginBody,
    activityIdParam,
    activityUpdateBody,
    envSchema,
};
