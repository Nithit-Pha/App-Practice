// Load environment variables FIRST so everything below can read them.
// dotenv looks for a .env file next to this script.
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

const {
    signupBody,
    loginBody,
    activityIdParam,
    activityUpdateBody,
    envSchema,
} = require('./schemas');

// Validate environment on startup. If something is missing or malformed,
// crash loudly — better than running with broken config and failing on
// the first user request.
const envResult = envSchema.safeParse(process.env);
if (!envResult.success) {
    console.error('[fatal] Invalid environment configuration:');
    for (const issue of envResult.error.issues) {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    console.error('See my-api/.env.example for the required variables.');
    process.exit(1);
}
const env = envResult.data;

const DB_DIR = path.join(__dirname, '..', 'database');
const DB_FILE = path.join(DB_DIR, 'app.db');
const SCHEMA_FILE = path.join(DB_DIR, 'schema.sql');

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(SCHEMA_FILE, 'utf8'));

const app = express();
const PORT = env.PORT;

// ---------- Auth config ----------
// All secrets and tunables come from environment variables (validated above
// by zod). No fallbacks — if JWT_SECRET were missing or weak, we'd already
// have refused to start.
const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;
const BCRYPT_ROUNDS = env.BCRYPT_ROUNDS;
const AUTH_COOKIE = 'auth_token';

// Cookie options that match our threat model:
//   httpOnly   → JavaScript on the page cannot read this cookie. Defeats XSS
//                token theft, which was the whole point of moving off localStorage.
//   sameSite   → 'lax' is enough here (frontend and API share the localhost site).
//                In production with separate domains you'd use 'none' + secure.
//   secure     → only set on https in production. Off for local http dev.
//   maxAge     → matches the JWT expiry so the cookie disappears with the token.
const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // flip to true behind https in production
    path: '/',
    maxAge: 60 * 60 * 1000, // 1 hour
};

// ---------- Security headers (helmet) ----------
// helmet sets a bundle of HTTP response headers that close off whole
// classes of attacks — clickjacking (X-Frame-Options), MIME sniffing
// (X-Content-Type-Options: nosniff), referrer leakage, etc.
//
// We override Cross-Origin-Resource-Policy because helmet's default is
// 'same-origin', which would block the React app at :5173 from reading
// API responses. CORS controls *who* can fetch; CORP controls whether
// the response is allowed to be embedded/read cross-origin at all.
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ---------- CORS (tightened) ----------
// Principle of least privilege:
//   - origin: a single explicit origin (env-overridable for staging/prod).
//   - methods/allowedHeaders: only what we actually use.
//   - credentials: required so the browser sends our auth cookie.
//   - maxAge: cache the preflight response for 10 minutes so the browser
//     doesn't re-OPTIONS every single request.
app.use(cors({
    origin: env.ALLOWED_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    maxAge: 600,
}));

app.use(express.json({ limit: '10kb' })); // cap body size to slow JSON-bomb DoS
app.use(cookieParser());

// ---------- Rate limiting ----------
// Throttle aggressive callers per IP. The captcha makes each attempt
// expensive, but real-world captcha-solving services exist — rate limits
// add a hard ceiling.
//
// IMPORTANT: rate limits != account lockout. Locking accounts after N
// failed logins lets an attacker DoS arbitrary users by typing wrong
// passwords for them. Per-IP throttling is preferable.
//
// In production behind a reverse proxy, you also need:
//   app.set('trust proxy', 1)  // so req.ip reflects the real client
// otherwise every request looks like it comes from the proxy.

const skipPreflight = (req) => req.method === 'OPTIONS';

// Login: highest-value target. 5 attempts per 15 minutes per IP.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,        // emit RateLimit-* headers
    legacyHeaders: false,         // skip legacy X-RateLimit-* headers
    skip: skipPreflight,
    message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

// Signup: slow bot account creation, but legitimate users rarely sign up
// more than once.
const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipPreflight,
    message: { error: 'Too many sign-up attempts. Try again later.' },
});

// Captcha is fetched on every login/signup page load and on every failed
// attempt — needs a higher ceiling, but still bounded.
const captchaLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipPreflight,
});

// Generic limiter for everything else as a safety net.
const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipPreflight,
});
app.use(generalLimiter);

// ---------- Auth helpers ----------
function signAuthToken(user) {
    // Keep the payload small — just what we need to authorize requests.
    // Never put the password hash, full user object, or anything sensitive here.
    return jwt.sign(
        { sub: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

function setAuthCookie(res, token) {
    res.cookie(AUTH_COOKIE, token, cookieOptions);
}

function clearAuthCookie(res) {
    res.clearCookie(AUTH_COOKIE, { ...cookieOptions, maxAge: 0 });
}

// Middleware: verify the cookie, look up the fresh user, attach to req.
// Doing a DB lookup on every authed request is fine for this app and lets
// us pick up role changes immediately. For high-traffic apps you'd cache
// or rely on the token claims plus periodic re-issue.
function requireAuth(req, res, next) {
    const token = req.cookies[AUTH_COOKIE];
    if (!token) return res.status(401).json({ error: 'Not authenticated.' });
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = db
            .prepare('SELECT id, name, email, role FROM users WHERE id = ?')
            .get(payload.sub);
        if (!user) return res.status(401).json({ error: 'User no longer exists.' });
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired session.' });
    }
}

// Middleware: require a specific role on top of requireAuth.
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ error: 'Forbidden.' });
        }
        next();
    };
}

// ---------- Validation middleware ----------
// `validate({ body, params })` returns Express middleware that runs each
// supplied schema against the matching part of the request. On success,
// req.body / req.params are REPLACED with the parsed values — meaning the
// handler sees the trimmed/coerced/typed data, not the raw input.
//
// On failure we return 400 with field-level error messages. We deliberately
// surface zod's messages here because they describe shape problems, not
// secrets or internal state. If your schema ever validates secret data,
// swap this for a generic "Invalid request" string.
function validate(schemas) {
    return (req, res, next) => {
        for (const key of ['body', 'params', 'query']) {
            if (!schemas[key]) continue;
            const result = schemas[key].safeParse(req[key]);
            if (!result.success) {
                return res.status(400).json({
                    error: 'Invalid request.',
                    details: result.error.issues.map((i) => ({
                        path: [key, ...i.path].join('.'),
                        message: i.message,
                    })),
                });
            }
            req[key] = result.data;
        }
        next();
    };
}

// Temporary "Database"
let activities = [
    { id: 1, name: "Yoga", completed: false },
    { id: 2, name: "Breakfast", completed: false }
];

// ---------- CAPTCHA: server-side challenge store ----------
// In-memory; for production use Redis or another shared store so multiple
// API instances can verify each other's challenges.
const captchaStore = new Map(); // id -> { text, expiresAt }
const CAPTCHA_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CAPTCHA_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function randomCaptchaText(len = 6) {
    let out = '';
    for (let i = 0; i < len; i++) {
        out += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
    }
    return out;
}

function issueCaptcha() {
    const id = crypto.randomBytes(8).toString('hex');
    const text = randomCaptchaText();
    captchaStore.set(id, { text, expiresAt: Date.now() + CAPTCHA_TTL_MS });
    return { id, text };
}

// Single-use: the challenge is destroyed on every verification attempt,
// success or failure. This prevents brute-forcing one captcha repeatedly.
function verifyAndConsumeCaptcha(id, answer) {
    if (typeof id !== 'string' || typeof answer !== 'string') return false;
    const challenge = captchaStore.get(id);
    if (!challenge) return false;
    captchaStore.delete(id);
    if (Date.now() > challenge.expiresAt) return false;
    return challenge.text === answer;
}

// Periodic sweep so expired challenges don't pile up in memory.
setInterval(() => {
    const now = Date.now();
    for (const [id, c] of captchaStore.entries()) {
        if (now > c.expiresAt) captchaStore.delete(id);
    }
}, 60 * 1000).unref();

// Issue a fresh challenge to the client.
app.get('/api/captcha', captchaLimiter, (req, res) => {
    const { id, text } = issueCaptcha();
    // NOTE: we send `text` here only because this app shows the captcha as
    // plain text. A stronger version would render it as an image on the
    // server and only send the image bytes — keeping the answer secret.
    res.json({ id, text });
});

// 1. GET: Fetch all activities
app.get('/api/activities', (req, res) => {
    res.json(activities);
});


// 2. PUT: Update an activity status (e.g., Checking a box)
// validate() coerces id from string → number and checks `completed` is a
// real boolean (not "true", not 1). Handler can trust both.
app.put(
    '/api/activities/:id',
    validate({ params: activityIdParam, body: activityUpdateBody }),
    (req, res) => {
        const { id } = req.params;
        const { completed } = req.body;

        activities = activities.map(act =>
            act.id === id ? { ...act, completed } : act
        );

        res.json({ message: 'Status updated!', id });
    }
);

// ---------- Auth: Sign up ----------
// Schema does the shape/length/email checks. .strict() rejects unknown
// fields — so even if a client tries to sneak `role: "admin"` into the
// body, the request is rejected with 400 before any DB write happens.
// (We also still hardcode userRole='user' below as defense in depth.)
app.post('/api/signup', signupLimiter, validate({ body: signupBody }), (req, res) => {
    const { name, email, password, captchaId, captchaAnswer } = req.body;

    if (!verifyAndConsumeCaptcha(captchaId, captchaAnswer)) {
        return res.status(400).json({ error: 'Captcha verification failed. Please try again.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
        return res.status(409).json({ error: 'Email is already registered.' });
    }

    const hashed = bcrypt.hashSync(password, BCRYPT_ROUNDS);
    const userRole = 'user'; // always default; never trust the client

    const result = db
        .prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
        .run(name, email, hashed, userRole);

    res.status(201).json({
        message: 'Account created.',
        user: { id: result.lastInsertRowid, name, email, role: userRole }
    });
});

// ---------- Auth: Log in ----------
app.post('/api/login', loginLimiter, validate({ body: loginBody }), (req, res) => {
    const { email, password, captchaId, captchaAnswer } = req.body;

    if (!verifyAndConsumeCaptcha(captchaId, captchaAnswer)) {
        return res.status(400).json({ error: 'Captcha verification failed. Please try again.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Issue a session: signed JWT in an HttpOnly cookie. The client never
    // sees the token directly — the browser sends it back automatically on
    // each request to this origin.
    const token = signAuthToken(user);
    setAuthCookie(res, token);

    res.json({
        message: 'Login successful.',
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
});

// ---------- Auth: who am I? ----------
// The frontend calls this on app load to find out whether the cookie is
// still valid and who it belongs to.
app.get('/api/me', requireAuth, (req, res) => {
    res.json({ user: req.user });
});

// ---------- Auth: log out ----------
// Clears the cookie. The JWT itself is still technically valid until expiry,
// but the browser no longer holds it. For revocation before expiry you'd
// need a token blocklist — a future lab.
app.post('/api/logout', (req, res) => {
    clearAuthCookie(res);
    res.json({ message: 'Logged out.' });
});

// ---------- Auth: list users (admin only) ----------
// Now protected: requires a valid auth cookie AND the admin role. Hitting
// this without logging in returns 401; hitting it as a normal user returns 403.
app.get('/api/users', requireAuth, requireRole('admin'), (req, res) => {
    const rows = db
        .prepare('SELECT id, name, email, role, created_at FROM users ORDER BY id DESC')
        .all();
    res.json(rows);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

/*
app.put('/api/activities/:id', (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;

    // Add this line:
    console.log(` Activity ${id} was updated to: ${completed}`);

    res.json({ message: "Status updated!", id });
});
*/
