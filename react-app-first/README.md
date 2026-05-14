# React App First — Learning Sandbox

A small full-stack project I built to learn three things in parallel: modern frontend with React/TypeScript, web app security, and relational databases. Everything in here is intentional practice rather than production code.

## What I'm learning

### TypeScript & React (frontend)

Learning by building a multi-page app with auth, route guards, and a real API.

- React 19 hooks (`useState`, `useEffect`, `useContext`)
- React Router — routes, `Navigate`, `useLocation`, route guards
- Component composition, props, controlled forms
- Context API for global auth state (`AuthContext`)
- Vite + ESLint tooling
- (Currently JavaScript / JSX — TypeScript migration is next.)

### Cybersecurity

Hardening the API one layer at a time. Each fix is documented as a "lab" in [CyberSecurity101.md](./CyberSecurity101.md).

- Server-side CAPTCHA (never trust client-only checks)
- JWT in `HttpOnly` cookies instead of `localStorage` (XSS defense)
- Auth middleware + role-based access (`requireAuth`, `requireRole`)
- Frontend route guards as UX (not security)
- `helmet` security headers + tightened CORS
- Rate limiting on login / signup / captcha (`express-rate-limit`)
- Input validation with `zod` + mass-assignment defense (`.strict()`)
- Secrets in `.env`, validated on startup
- Structured logging (`pino`) + audit trail of auth events
- `npm audit` for dependency CVEs, OWASP ZAP for dynamic scanning

### Database

Practicing SQL and schema design against a real domain (users, exercises, foods, recipes, logs). Full write-up in [Database101.md](./Database101.md).

- Schema design: primary keys, foreign keys, `CHECK` / `NOT NULL` / `UNIQUE`
- Relationships: 1-to-many (recipe → steps), many-to-many (favorites)
- SQL: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `JOIN`, `GROUP BY`, aggregates
- Indexes, `EXPLAIN QUERY PLAN`, normalization
- Transactions and ACID
- Parameterized queries (SQL injection prevention)
- Common pitfalls: N+1 queries, missing indexes

## Quick start

```bash
# Backend (terminal #1)
cd my-api
npm install
npm run seed       # populate mock data
npm start          # API on :5000

# Frontend (terminal #2, from project root)
npm install
npm run dev        # app on :5173
```

Demo logins are in `my-api/seed.js` (try `admin@demo.com` for admin features).

## Stack

- **Frontend** — React 19, Vite, React Router
- **Backend** — Node + Express 5, SQLite (`better-sqlite3`)
- **Auth** — bcryptjs + jsonwebtoken + HttpOnly cookies + zod
- **Security** — helmet, express-rate-limit, server-side captcha
- **Logging** — pino + pino-http

## What's next (future learning)

Things to add when I'm ready to push each track further.

### TypeScript & React

- Migrate the whole app to TypeScript (start with `.jsx → .tsx`, add `tsconfig.json`)
- Add tests with Vitest + React Testing Library
- Server-state library (TanStack Query) instead of raw `fetch`
- Forms with `react-hook-form` + `zod` (share schemas with the backend)
- Accessibility audit (axe-core, keyboard nav, ARIA)
- Storybook for component-level dev

### Cybersecurity

- HTTPS locally with `mkcert`, then HSTS in prod
- CSRF tokens for state-changing requests (defense beyond `SameSite=Lax`)
- Refresh tokens + server-side revocation (true logout-all-devices)
- Content Security Policy on the frontend bundle
- 2FA / MFA on login (TOTP via `otplib`)
- Password reset flow (single-use, time-limited token — same pattern as captcha)
- Sentry / error tracking for unhandled exceptions
- Ship logs off the box (Loki + Grafana, or a hosted aggregator)
- GitHub Actions: `npm audit` on every PR + ZAP baseline scan

### Database

- Migrations tool (Knex / `node-pg-migrate`) instead of editing `schema.sql`
- Move from SQLite to PostgreSQL (real types, JSONB, full-text search)
- Window functions, CTEs, views — and recursive CTEs for hierarchical data
- Backup + restore drill (proven, not assumed)
- Try an ORM (Prisma, Drizzle, or Kysely) and compare to raw SQL
- Add a search index (FTS5 in SQLite, or Postgres `tsvector`)
