# CyberSecurity 101 — Lessons From Building This App

This document walks through every security concept we applied to this project, in the order we built them. It's written as a learning reference: each lab starts with the *threat* (what could go wrong), the *concept* (the underlying principle), the *fix* (what we actually changed), and *limits* (where the fix stops protecting you).

---

## Foundational ideas to keep in mind

Three ideas come up in every lab. Get comfortable with them and the rest follows.

**Trust boundary.** The line between code you control and code/data you don't. The browser is untrusted. The network is untrusted. Anything in `req.body` is untrusted. The server is the only thing on your side of the line. *Every security control must live on the trusted side of the boundary it's protecting.*

**Defense in depth.** No single control is perfect, so layer them. If the captcha fails, rate limiting catches it. If rate limiting fails, bcrypt makes brute force expensive. If bcrypt fails, password complexity helps. You design assuming any one layer might break.

**Principle of least privilege.** Give every component the minimum it needs. Allow only one CORS origin. Only the methods you use. Only the headers you accept. Only the role required for an endpoint. Smaller surface = smaller attack window.

A useful framing: when you add a control, ask *"if I deleted this, could an attacker still get the data?"* If yes, the real defense is somewhere else and you should find it.

---

## Lab 1 — Server-Side CAPTCHA Verification

### Threat

The original captcha lived entirely in the browser. The component generated a code, the user typed it, the component compared the strings and called `onVerify(true)`. The backend never saw the captcha. So an attacker could ignore the captcha completely:

```bash
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"bot","email":"bot@bot.com","password":"hunter2"}'
```

That request would have created an account. The captcha was *security theater* — visible to humans, invisible to bots.

### Concept: never trust the client

The browser is on the wrong side of the trust boundary. Anything it does — including "verify" a captcha — can be skipped, faked, or bypassed by sending the request directly. A real bot-prevention check has to live where the attacker can't run code: on the server.

### Fix

Three pieces:

1. **Server issues the challenge.** `GET /api/captcha` generates `{ id, text }`, stores `{text, expiresAt}` in a `Map` keyed by id, and returns it.
2. **Browser only displays.** The Captcha component fetches the challenge and reports the user's typed answer back to the parent via `onChange({ id, answer })`. It does no verification of its own — it can't, because only the server knows the right answer.
3. **Server verifies and consumes.**

```js
function verifyAndConsumeCaptcha(id, answer) {
    if (typeof id !== 'string' || typeof answer !== 'string') return false;
    const challenge = captchaStore.get(id);
    if (!challenge) return false;
    captchaStore.delete(id);                 // burn on every attempt
    if (Date.now() > challenge.expiresAt) return false;
    return challenge.text === answer;
}
```

The `captchaStore.delete(id)` happens *before* the answer check. That makes captchas single-use: an attacker who fetches one challenge gets exactly one guess, regardless of whether they got it right or wrong.

### Limits

- Plain-text captchas are trivially solved by OCR. Real systems render distorted images server-side or use behavioral signals (reCAPTCHA, hCaptcha). The *architecture* in this lab is right; only the challenge type is weak.
- Captcha-solving services exist (~$1 per 1000 solves). That's why captchas pair with rate limiting (Lab 5).
- In-memory storage breaks across multiple API instances. Production uses Redis or a shared store.

### Take-away pattern: single-use, time-limited tokens

The same shape (`store → verify → delete-on-attempt → expire`) shows up everywhere: password-reset links, MFA codes, email verification, OAuth state. Get used to it.

---

## Lab 2 — JWT in an HttpOnly Cookie (instead of localStorage)

### Threat

Login used to do `localStorage.setItem('currentUser', JSON.stringify(data.user))`. Two problems:

1. **It's data, not proof.** The backend has no way to tell whether a request comes from a logged-in user. There's nothing actually protecting any future endpoint.
2. **`localStorage` is XSS-readable.** Any JavaScript that runs on your origin — yours, an injected one, a vulnerable npm dependency — can read it via `localStorage.getItem('currentUser')`. If you ever ship an XSS bug, your auth state walks out the door immediately.

### Concept: where you put the token matters more than the token format

People obsess over JWT vs. session ID. The bigger question is *storage*:

| Storage           | Readable by JS? | Sent automatically? | Survives reload? |
|-------------------|-----------------|---------------------|------------------|
| localStorage      | Yes (XSS risk)  | No (you must add it)| Yes              |
| sessionStorage    | Yes             | No                  | No               |
| Memory only       | No              | No                  | No               |
| Cookie            | Yes (default)   | Yes                 | Yes              |
| **HttpOnly cookie** | **No**        | **Yes**             | **Yes**          |

`HttpOnly` cookies are unreachable from JavaScript — even your own scripts can't read them. That's the line of defense XSS has to cross to steal them.

### JWT basics

A JWT has three base64-url-encoded parts: `header.payload.signature`. The signature is computed with a secret only the server knows.

- **Signed, not encrypted.** The payload is *readable* to anyone holding the token. Don't put secrets in it.
- **Tamper-evident.** Change a single byte and the signature no longer verifies. The token becomes invalid.
- **Stateless.** The server doesn't store anything; it just verifies the signature. This makes JWTs hard to revoke before expiry — see "limits" below.

We sign only `{ sub: user.id, role: user.role }` and rely on a fresh DB lookup in `requireAuth` to get name/email. That way a deleted or demoted user is rejected on their next request.

### Cookie flags

```js
const cookieOptions = {
    httpOnly: true,        // JS cannot read this cookie → XSS can't steal
    sameSite: 'lax',       // CSRF mitigation: not sent on most cross-site requests
    secure: false,         // flip to true behind HTTPS
    path: '/',
    maxAge: 60 * 60 * 1000,
};
```

`SameSite=Lax` is the default in modern browsers. It blocks cross-site POSTs (the typical CSRF shape) while still allowing top-level navigation. With `Strict` you'd lose normal "click a link from another site to log in" UX. `None` is for genuine cross-site scenarios and requires `Secure`.

### CORS + credentials gotcha

To send cookies cross-origin you need *all four*:
- Server: `Access-Control-Allow-Origin: <specific>` (not `*`)
- Server: `Access-Control-Allow-Credentials: true`
- Client: `credentials: 'include'` on `fetch`
- Cookie: a `SameSite` value that allows the request

Forget any one and cookies silently won't be sent. This is one of the most common "why doesn't my login work?" bugs.

### Limits

- Logging out clears the cookie, but the JWT itself is still valid until expiry. Revocation before expiry needs a server-side blocklist or a `tokenVersion` column on the user row.
- Long expiries are a balance: 1 hour means a stolen token is useful for 1 hour. Refresh tokens are a future topic.
- HttpOnly cookies don't defend against CSRF on their own — that's what `SameSite` and (for sensitive operations) anti-CSRF tokens are for.

---

## Lab 3 — Frontend Route Guards (UX, not security)

### Threat? None — this is UX.

`RequireAuth` and `RequireRole` redirect unauthenticated users away from protected pages. **They are not what stops attackers.** The server's `requireAuth` middleware is. If you removed every `<RequireAuth>` from the frontend, the user list still wouldn't leak — `/api/users` would just return 401 to a logged-out browser, and the page would render an error.

### Concept: where each layer's job ends

| Layer    | Job                               | What happens if it's missing                |
|----------|-----------------------------------|---------------------------------------------|
| Frontend | Smooth UX, hide unusable links    | Users see broken pages, but data is safe    |
| Backend  | **Actually protect data**         | Anyone can read anything                    |

Conflating these is one of the most common security mistakes — devs add a `RequireAuth` wrapper to a route, see the redirect work, and assume they're done. They aren't. Always add the server check first; the frontend guard is icing.

### The `state.from` redirect pattern

```jsx
// In RequireAuth: remember where the user was trying to go
return <Navigate to="/login" state={{ from: location }} replace />;

// In Login: after success, send them back there
const redirectTo = location.state?.from?.pathname || '/';
navigate(redirectTo, { replace: true });
```

Without this, deep-link bookmarks always land users on `/` after login, even if they tried to open `/admin/users`. It's a 5-line UX win.

### The `loading` state

While `AuthProvider` is asking `/api/me`, the user object is briefly `null` even though they may be logged in. If you don't gate guards on `loading`, every page reload flashes a redirect to `/login`. This is *the* classic React auth bug.

```jsx
if (loading) return <p>Checking session…</p>;
if (!user) return <Navigate to="/login" ... />;
```

---

## Lab 4 — Security Headers (helmet) and Tightened CORS

### Threat

Without security headers, browsers fall back to permissive defaults. That opens the door to:

- **Clickjacking** — your site embedded in an invisible iframe on an attacker's page, with overlays that trick users into clicking buttons in your app.
- **MIME sniffing** — browsers "guessing" that a JSON response is actually a script and executing it. Real attack vector when combined with file uploads.
- **Referrer leakage** — full URLs (including query parameters that might contain tokens) sent to third-party links.

Plus the original CORS config (`cors()` with no args before Lab 2) was wide open, and the post-Lab-2 config still allowed any HTTP method, any header, and re-handled preflight on every request.

### Concept: defense in depth via headers

Browsers honor a set of HTTP response headers that close off whole classes of attacks. None of them on its own saves you, but together they remove dozens of low-effort attack paths. `helmet` is the standard middleware for setting them.

Key headers it sets:

- `X-Content-Type-Options: nosniff` — disables MIME guessing.
- `X-Frame-Options: SAMEORIGIN` — your pages can't be iframed by other sites (clickjacking defense).
- `Strict-Transport-Security` — once on HTTPS, browser refuses to ever downgrade.
- `Referrer-Policy` — limits what URL info leaks via the `Referer` header.
- `Cross-Origin-Resource-Policy` — controls whether responses can be read cross-origin.

### CORS vs CORP — they're not the same

This trips a lot of people up:

- **CORS** controls *who can send* cross-origin requests and read the response.
- **CORP** is a server-side opt-in that controls whether the response is *allowed to be* read cross-origin at all.

helmet's default `CORP: same-origin` blocks the React app at `:5173` from reading API responses at `:5000`, even though CORS is configured to allow it. Override with `crossOriginResourcePolicy: { policy: 'cross-origin' }` so both layers agree.

### CORS hardening (least privilege)

```js
app.use(cors({
    origin: env.ALLOWED_ORIGIN,           // one specific origin
    credentials: true,                    // allow cookies
    methods: ['GET','POST','PUT','DELETE'],  // not whatever the browser asks for
    allowedHeaders: ['Content-Type'],     // only what we use
    maxAge: 600,                          // cache preflight 10 min
}));
```

`maxAge` is also a perf win: without it the browser re-sends an `OPTIONS` preflight before every request.

### Body size cap

```js
app.use(express.json({ limit: '10kb' }));
```

Without a limit, an attacker can `POST` a 1GB JSON body and chew up server memory. One line, big payoff.

---

## Lab 5 — Rate Limiting

### Threat

Without rate limits, an attacker can hit `/api/login` thousands of times per second. The captcha (Lab 1) makes each attempt expensive but not infinitely so — solving services cost about $1 per 1000 captchas. So unlimited attempts plus paid solving = brute force succeeds eventually.

### Concept: throttle, don't lock

There are two common throttling strategies:

| Strategy              | How it works                              | Downside                           |
|-----------------------|-------------------------------------------|------------------------------------|
| **Per-IP rate limit** | Cap requests per IP per time window       | NAT/mobile = many users one IP     |
| **Account lockout**   | Disable account after N failed logins     | **Attackers can DoS your users**   |

Account lockout sounds reasonable but lets an attacker lock a known account by deliberately failing logins for it. *Per-IP throttling punishes the attacker, not the victim.*

Real systems use both, plus per-credential-pair counters and adaptive scoring (introduce a captcha after suspicious behaviour, escalate to delays, etc.). Your captcha is already that next layer.

### What 429 looks like

```js
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,    // RateLimit-Remaining, RateLimit-Reset
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',  // don't count CORS preflights
    message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});
```

The `RateLimit-Remaining` header counts down with each request — useful for clients that want to back off gracefully.

### Reverse proxy gotcha

By default `req.ip` is the *direct* connection. Behind a reverse proxy (nginx, Cloudflare, an ELB), every request looks like it comes from the proxy's IP, so all users share a single rate limit and trip 429s. The fix: `app.set('trust proxy', 1)` so Express reads the real client IP from `X-Forwarded-For`.

### Layered budgets

| Endpoint        | Limit              | Why                                    |
|-----------------|--------------------|----------------------------------------|
| `/api/login`    | 5 / 15 min / IP    | Highest-value brute-force target       |
| `/api/signup`   | 5 / 1 hour / IP    | Slow bot account creation              |
| `/api/captcha`  | 30 / 1 min / IP    | Hit on every page load — needs headroom|
| Everything else | 120 / 1 min / IP   | Safety net                             |

---

## Lab 6 — Input Validation with zod

### Threat

The original handlers trusted everything in `req.body`. Bad shape (missing fields, wrong types, oversized strings) either crashed handlers, hit the database, or — in the worst case — added unintended fields to records. We'd already seen this with the `role` field: the client sent `role: "admin"`, the server happily wrote it.

### Concept: parse, don't validate

Validation says "is this OK?" and returns a boolean. *Parsing* takes untrusted input and produces typed, transformed data — or rejects it. Once parsed, the rest of your code can assume `email` is a trimmed lowercase string and `id` is a positive integer. No defensive checks inside business logic.

```js
const signupBody = z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(8).max(128),
    captchaId: z.string().min(1).max(64),
    captchaAnswer: z.string().min(1).max(32),
}).strict();
```

### `.strict()` is mass-assignment defense

Without `.strict()`, zod silently drops unknown fields. With it, an unknown field is an error. So a request with a sneaky `role: "admin"` is rejected with 400 before any DB write. Combined with the hardcoded `userRole = 'user'` in the handler, that's two independent layers stopping the same attack — defense in depth.

### A `validate()` middleware

```js
function validate(schemas) {
    return (req, res, next) => {
        for (const key of ['body','params','query']) {
            if (!schemas[key]) continue;
            const result = schemas[key].safeParse(req[key]);
            if (!result.success) return res.status(400).json({ error: 'Invalid request.', details: ... });
            req[key] = result.data;     // replace with parsed/typed value
        }
        next();
    };
}
```

Note that `req.body` gets *replaced* with the parsed value. That means downstream handlers see the trimmed/coerced/validated data, not the raw input.

### Don't leak through error messages

Login uses a *looser* password schema than signup:

- Signup password: `z.string().min(8).max(128)` — strength enforced at registration.
- Login password: `z.string().min(1).max(128)` — only checks "not empty."

Why? Because if login returns "password too short" for some attempts and "wrong password" for others, an attacker learns that the password they tried is at least the wrong length — useful for narrowing brute force. Same generic 401 for all login failures.

Same idea applies to the classic *username enumeration* mistake: returning "no such email" vs. "wrong password" tells attackers which emails are real. Always return an identical error.

---

## Lab 7 — Secrets via `.env`

### Threat

Hardcoded secrets in source code are leaked secrets. Once a secret hits git, it's compromised forever — even if you delete it in a later commit, git history keeps it. Teams have leaked production database credentials, AWS keys, and JWT signing secrets this way. Routine.

We had this exact problem: `JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-CHANGE-ME'`. Forgetting to set the env var meant signing every JWT with a known string — anyone could forge tokens for any user.

### Concept: 12-factor config

> *"Strict separation of config from code."*

Config = anything that varies between environments (dev, staging, prod). Database URLs, secrets, port numbers, feature flags. They live in environment variables, never in source.

The `.env` file is a dev convenience: you keep your local config there, dotenv loads it on startup, and it's gitignored so it never escapes your machine.

### `.env.example` is the contract

`.env.example` is committed and documents every variable the app needs. Anyone cloning the repo runs `cp .env.example .env`, fills in real values, and is good to go. Without an example file, new devs hit "why doesn't this start?" and may end up committing their `.env` out of frustration.

### Validate config on startup

```js
const envResult = envSchema.safeParse(process.env);
if (!envResult.success) {
    console.error('[fatal] Invalid environment configuration:');
    for (const issue of envResult.error.issues) {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
}
```

This is a 12-factor principle: fail loudly at boot time, not silently at first user request. If `JWT_SECRET` is missing, you find out the second you `npm start`, not when a user tries to log in three days into prod.

The schema also coerces strings to numbers (`PORT`), enforces minimums (`JWT_SECRET` ≥ 32 chars), and provides defaults (`BCRYPT_ROUNDS = 10`).

### Never commit your `.env`

`.gitignore` includes `.env`, `.env.local`, etc. If you ever realize a secret was committed, treat it as compromised: rotate the secret immediately, then clean it from history (BFG Repo-Cleaner, `git filter-repo`).

### Real-world expansion

For production you'd graduate from a `.env` file to a managed secrets service: AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager, Doppler, 1Password CLI. The principle is the same — secrets stay out of code — but you also get rotation, access auditing, and short-lived credentials.

---

## OWASP Top 10 — what we covered

The OWASP Top 10 is the canonical list of common web vulnerabilities. Quick map of the categories these labs touch:

| OWASP Category                        | Where we addressed it                                 |
|---------------------------------------|--------------------------------------------------------|
| A01 Broken Access Control             | Lab 2/3 — `requireAuth`, `requireRole`, frontend guards|
| A02 Cryptographic Failures            | Lab 2/7 — bcrypt, JWT secret strength, env management  |
| A03 Injection                         | (Already protected by parameterized queries; Lab 6 adds shape validation)|
| A04 Insecure Design                   | Lab 6 — `.strict()`, role hardcoding, separate password rules per endpoint|
| A05 Security Misconfiguration         | Lab 4/7 — helmet, tight CORS, env validation           |
| A07 Identification & Auth Failures    | Lab 1/2/5 — captcha, JWT, rate limiting                |
| A09 Security Logging and Monitoring   | *Not yet covered* — see "what's missing" below         |

---

## What's still missing (further reading)

Things we haven't done yet, in roughly priority order:

- **Logging & monitoring.** You can't detect what you can't see. At minimum: log auth events (login success/failure, signup, role changes), with timestamps and IP. Not the password.
- **Refresh token / revocation.** Logging out leaves the JWT technically valid until expiry. Real revocation needs server-side state (a token version on the user, or a blocklist).
- **HTTPS / TLS.** Mandatory in production. Free certs via Let's Encrypt; locally, `mkcert` gives you trusted localhost certs.
- **Dependency scanning.** `npm audit` is the basic check. Snyk / GitHub Dependabot run continuously and open PRs.
- **CSRF tokens for state-changing requests.** `SameSite=Lax` covers most cases, but for high-value actions (delete account, change password) use anti-CSRF tokens too.
- **Content Security Policy on the frontend.** helmet sets one on API responses but it's mostly inert there. The React app itself should ship a CSP that restricts script sources.
- **Audit your dependencies' transitives.** Most npm supply-chain attacks come through dependencies-of-dependencies. `npm ls`, lockfile review, careful upgrades.
- **Penetration testing.** OWASP ZAP and Burp Suite let you actively probe your app. Start with ZAP's automated scan against your local app — you'll get a report listing what to fix.

---

## A useful checklist when adding any new endpoint

Whenever you add a route, ask:

1. **Authentication.** Who can call this? `requireAuth`?
2. **Authorization.** Within authenticated users, who's allowed? `requireRole`?
3. **Input shape.** zod schema with `.strict()`?
4. **Rate limit.** Is this brute-forceable or expensive?
5. **Error messages.** Do they leak info (existence of users, password length, role hints)?
6. **Side effects.** Does it write to the DB, send email, charge money? Idempotency, audit log?
7. **Output shape.** Are you returning more fields than the caller needs? (Don't leak password hashes, internal flags, other users' data.)
8. **Logging.** Will you be able to tell if this endpoint is being abused tomorrow?

If you can answer all eight on autopilot, you've internalized 90% of practical web security.
