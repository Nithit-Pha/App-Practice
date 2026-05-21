# React App First — Learning Sandbox

A small full-stack project I built to learn four things in parallel: modern frontend with React/TypeScript, web app security, relational databases, and chatbots / LLMs. Everything in here is intentional practice rather than production code.

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

### Chatbot & LLMs (planned)

Building an in-app assistant that answers questions about recipes, suggests workouts, and explains the app's own data — and learning the underlying mechanics, not just the API call.

**App integration:**

- Streaming chat UI in React (SSE / `fetch` streams, message history)
- LLM API integration (OpenAI / Anthropic) — and local models via Ollama
- Tool / function calling (let the bot query the foods, recipes, logs)
- Per-user conversation context + rate limits + cost guardrails
- Safety: prompt-injection defenses, PII redaction, refusal patterns

**LLM fundamentals & training:**

- How LLMs work: tokens, context windows, sampling (temperature, top-p)
- Pre-training vs. fine-tuning vs. prompting vs. RAG (when to use which)
- Embeddings + vector search (pgvector, SQLite-vec, Pinecone)
- Retrieval-Augmented Generation (RAG) using the app's own DB as the knowledge base
- Fine-tuning small open models: LoRA / QLoRA on Hugging Face
- Eval: golden-set Q&A, regression on prompt changes (not "feels better")
- Hallucinations: detection, citation, grounded generation
- Cost & latency tradeoffs (model size, caching, batching, streaming)

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

### Chatbot & LLMs

Concrete milestones, roughly easiest → hardest:

- **v0** — call an LLM API from the backend, render the reply in a chat page
- **v1** — stream tokens with SSE so the reply renders word-by-word
- **v2** — RAG over the app's data: embed every recipe + food, store vectors, retrieve top-k for each user question
- **v3** — tool calling: let the model run pre-defined safe queries (`get_user_calories_today`, `search_recipes`) instead of asking the model to hallucinate them
- **v4** — fine-tune a small open model (Llama 3 8B, Mistral) on app-specific Q&A using LoRA on a free Colab GPU
- **v5** — eval harness: golden questions + expected answers, fail the CI build if accuracy regresses
- **v6** — run a local model with Ollama in dev for zero-cost iteration; switch to a hosted model only for prod
- **Safety / ops:** prompt-injection test corpus, output moderation, audit logs of every prompt + response, per-user rate + cost cap
