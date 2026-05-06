# Database 101 — A Practical Guide Using This App's SQLite

This guide teaches relational database fundamentals using the actual schema and seed data of the project. Every SQL example is runnable against `database/app.db` after you seed it. We'll cover what a database is, how rows and tables relate, the SQL you actually write day-to-day, and the pitfalls (security and performance) that bite real apps.

---

## How to follow along

```bash
# 1. Install backend deps (only once)
cd my-api
npm install

# 2. Create the schema and load mock data
npm run seed

# 3. Open a SQL prompt against the DB
cd ../database
sqlite3 app.db
```

If you don't have the `sqlite3` CLI installed, get it from the [SQLite download page](https://www.sqlite.org/download.html), or use a GUI like DB Browser for SQLite.

In the prompt you'll want these settings (paste them in once per session):

```
.headers on
.mode column
.nullvalue NULL
```

To exit: `.quit`. To see all tables: `.tables`. To see one table's columns: `.schema users`.

---

## What is a database?

A **database** is a structured store of related data, plus an engine that lets you query and modify it without writing custom file formats yourself. Every modern app of any size has one. The two big families:

**Relational (SQL).** Data lives in tables of rows and columns with strict types and explicit relationships. You query with SQL — a 50-year-old declarative language. Examples: SQLite (this project), PostgreSQL, MySQL, MariaDB, SQL Server, Oracle.

**Non-relational (NoSQL).** A bag of differently shaped paradigms: document stores (MongoDB), key-value (Redis, DynamoDB), column-family (Cassandra), graph (Neo4j). Looser schemas, often easier to scale horizontally, but you give up some of SQL's safety net.

For 80% of CRUD apps — including this one — a relational DB is the right default. You can always layer Redis or Elasticsearch on top later for caching and search.

### Why SQLite specifically

SQLite is a single-file relational database — your whole DB is `app.db`. No server, no daemon, no network port. It's the most-deployed DB in the world (every iPhone, every Android, most browsers). Trade-offs:

- **Pro:** zero setup, fast for one-machine apps, transactional, full SQL.
- **Con:** one writer at a time (readers are concurrent), no network protocol, no row-level locking. Not the right choice for multi-server backends.

For learning and small apps, SQLite is excellent. The skills transfer almost cleanly to PostgreSQL.

---

## The schema you just seeded

Eight tables. Read this once and refer back to it as you work through SQL examples.

```
users                      ┐
  id, name, email, ...     │
                           │
exercises                  │              user_exercises (log)
  id, name, category, ...  ├─→ id ────→     user_id, exercise_id, performed_on, duration_min
                           │
foods                      │              user_meals (log)
  id, name, calories, ...  ├─→ id ────→     user_id, food_id, eaten_on, servings
                           │
recipes                    │              user_favorite_recipes (M:N)
  id, slug, name, ...      ├─→ id ────→     user_id, recipe_id
                           │
recipe_steps (1:N)         │
  id, recipe_id, step_no,  ┘
  instruction
```

The arrows are **foreign keys** — pointers from one table to another's primary key. We'll dig into them shortly.

---

## Rows, columns, types

A **table** is a named collection of rows. Every row has the same columns. Every column has a declared type.

SQLite types you'll see in this app:

| Type      | Stores                                  | Example                |
|-----------|-----------------------------------------|------------------------|
| `INTEGER` | Whole numbers                           | `1`, `42`, `-7`        |
| `REAL`    | Floating-point numbers                  | `3.14`, `9.8`          |
| `TEXT`    | Strings (UTF-8)                         | `'hello'`              |
| `DATE`    | Date strings `'YYYY-MM-DD'`             | `'2026-05-07'`         |
| `DATETIME`| ISO datetime strings                    | `'2026-05-07 14:22:11'`|
| `BLOB`    | Raw bytes                               | binary data            |

SQLite is unusually loose about types — it's "type affinity" rather than strict typing. PostgreSQL and MySQL enforce them harder. Treat the declared type as a contract you should respect even if SQLite won't fight you.

Try it:

```sql
SELECT id, name, role, created_at FROM users LIMIT 3;
```

You'll see column headers and three rows.

---

## Primary keys

Every table needs a **primary key** — one or more columns that uniquely identify a row. In this schema we use `INTEGER PRIMARY KEY AUTOINCREMENT` everywhere: SQLite auto-assigns a sequential id when you insert.

Why a synthetic id rather than something like email?
- **Stable.** People change their email; an id never moves.
- **Compact.** A 4-byte int beats a 50-byte email in every join and index.
- **Convention.** Standard practice — most ORMs assume it.

You can have **composite primary keys** (multiple columns together unique) — see `user_favorite_recipes` whose key is `(user_id, recipe_id)`. That single line of schema enforces "a user can't favorite the same recipe twice."

---

## Foreign keys & relationships

A **foreign key** is a column whose value must equal a primary key in another table.

```sql
recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
```

Read this as: "must point to an actual `recipes.id`; if that recipe is deleted, delete this row too."

Three relationship shapes appear in this app:

### One-to-many: recipes → recipe_steps

One recipe has many steps. The `many` side carries the foreign key:

```sql
SELECT r.name, s.step_no, s.instruction
FROM recipes      r
JOIN recipe_steps s ON s.recipe_id = r.id
WHERE r.slug = 'simple-greek-salad'
ORDER BY s.step_no;
```

### Many-to-one (the same thing, looking from the other side)

Many `user_meals` belong to one `food`:

```sql
SELECT um.eaten_on, um.servings, f.name AS food
FROM user_meals um
JOIN foods      f ON f.id = um.food_id
WHERE um.user_id = 2
ORDER BY um.eaten_on DESC;
```

### Many-to-many: users ↔ recipes via favorites

A user can favorite many recipes; a recipe can be favorited by many users. You **always** need a third "join table" for this — `user_favorite_recipes` — with one row per (user, recipe) pair:

```sql
SELECT u.name AS user, r.name AS recipe, fav.favorited_at
FROM user_favorite_recipes fav
JOIN users   u ON u.id = fav.user_id
JOIN recipes r ON r.id = fav.recipe_id
ORDER BY u.name, r.name;
```

### `ON DELETE` actions

When a row pointed at gets deleted, what happens?

| Action      | Effect                                                |
|-------------|-------------------------------------------------------|
| `CASCADE`   | Delete dependent rows too (e.g., delete recipe → its steps go too) |
| `RESTRICT`  | Refuse the parent delete if dependents exist          |
| `SET NULL`  | Keep dependents but blank their FK column             |
| `NO ACTION` | (default) Same as RESTRICT in most engines            |

We chose `CASCADE` for `recipe_steps` (a step is meaningless without its recipe) and `RESTRICT` for `user_meals.food_id` (don't accidentally orphan or corrupt the user's history just because someone deletes a food row).

**Important:** SQLite doesn't enforce foreign keys by default! The line `db.pragma('foreign_keys = ON')` in `server.js` and `seed.js` turns it on. Without that pragma, you'd get foreign-key columns with no enforcement at all. Easy gotcha.

---

## Constraints — schema as documentation

Constraints are rules the database refuses to break. They live in the schema, not in your application code, which makes them impossible to forget.

| Constraint   | What it does                                                  |
|--------------|---------------------------------------------------------------|
| `NOT NULL`   | The column must have a value                                  |
| `UNIQUE`     | No two rows can share this value                              |
| `CHECK (…)`  | Custom expression must evaluate true                          |
| `DEFAULT …`  | Value used when none is supplied                              |
| `PRIMARY KEY`| Implies NOT NULL + UNIQUE                                     |
| `REFERENCES` | Foreign key (covered above)                                   |

Examples from this schema:

```sql
role TEXT NOT NULL DEFAULT 'user'
     CHECK (role IN ('user','admin')),       -- enum-like behaviour
calories INTEGER NOT NULL CHECK (calories >= 0),  -- non-negative
servings REAL NOT NULL DEFAULT 1.0 CHECK (servings > 0),  -- strictly positive
UNIQUE (recipe_id, step_no),                 -- composite uniqueness
```

Try inserting an invalid role and SQLite will refuse:

```sql
INSERT INTO users (name, email, password, role)
VALUES ('Eve', 'eve@x.com', 'x', 'superadmin');
-- → CHECK constraint failed: role
```

That's a security win on top of correctness — the role-escalation we patched earlier in the application code is *also* blocked at the database level. Defense in depth.

---

## CRUD — the four basic statements

### SELECT (Read)

```sql
-- Everything (don't do this on big tables in production)
SELECT * FROM exercises;

-- Specific columns
SELECT name, calories_per_min FROM exercises;

-- Filtered
SELECT name FROM exercises WHERE category = 'cardio';

-- Sorted, limited
SELECT name, calories_per_min
FROM exercises
ORDER BY calories_per_min DESC
LIMIT 3;
```

Common WHERE operators: `=`, `!=` (or `<>`), `<`, `>`, `<=`, `>=`, `LIKE 'pat%'`, `IN (1,2,3)`, `BETWEEN a AND b`, `IS NULL`, `IS NOT NULL`. Combine with `AND` / `OR`. Use parentheses to be explicit:

```sql
SELECT name FROM foods
WHERE category = 'fruit'
   OR (category = 'snack' AND calories < 200);
```

### INSERT (Create)

```sql
INSERT INTO exercises (name, category, calories_per_min)
VALUES ('Rowing', 'cardio', 7.0);

-- Multiple rows in one statement (faster than many INSERTs)
INSERT INTO foods (name, calories, category) VALUES
    ('Orange', 60, 'fruit'),
    ('Pear',   100, 'fruit');
```

`OR IGNORE` skips rows that would violate UNIQUE constraints — handy for idempotent seeds:

```sql
INSERT OR IGNORE INTO foods (name, calories, category) VALUES ('Apple', 95, 'fruit');
```

### UPDATE (Update)

```sql
UPDATE foods SET calories = 100 WHERE name = 'Apple';
```

**Always include a WHERE clause.** Without one, you update every row. (`UPDATE users SET role = 'admin'` would make every user an admin. Don't.)

A safe habit: write the SELECT first to see what you'd touch, then change `SELECT *` to `UPDATE ... SET ...`:

```sql
SELECT id, role FROM users WHERE email = 'bob@demo.com';
UPDATE users SET role = 'admin' WHERE email = 'bob@demo.com';
```

### DELETE (Delete)

```sql
DELETE FROM user_meals WHERE id = 12;
DELETE FROM user_meals;       -- ⚠ deletes EVERY row. WHERE clause matters.
```

Same warning as UPDATE — always include WHERE unless you really mean it.

---

## JOINs

A **join** combines rows from two tables based on a related column. By far the most common is `INNER JOIN` (often just written `JOIN`).

```sql
-- Each meal eaten today, with the food name and per-serving calories
SELECT um.eaten_on, u.name AS who, f.name AS food, um.servings, f.calories
FROM user_meals um
JOIN users u ON u.id = um.user_id
JOIN foods f ON f.id = um.food_id
WHERE um.eaten_on = DATE('now');
```

Variants:

| Type         | Returns                                                     |
|--------------|--------------------------------------------------------------|
| `INNER JOIN` | Only rows that match in both tables                          |
| `LEFT JOIN`  | All rows from left, matching from right (or NULL)            |
| `RIGHT JOIN` | All rows from right (not supported in SQLite — flip it)      |
| `CROSS JOIN` | Cartesian product (rare, often a bug)                        |

`LEFT JOIN` is essential for "show me every X, with their Y if any":

```sql
-- Every user, plus how many times they've favorited a recipe.
SELECT u.name, COUNT(fav.recipe_id) AS favorites_count
FROM users u
LEFT JOIN user_favorite_recipes fav ON fav.user_id = u.id
GROUP BY u.id, u.name
ORDER BY favorites_count DESC;
```

If you used `INNER JOIN` here, users with zero favorites would simply disappear from the result. `LEFT JOIN` keeps them at zero.

---

## Aggregates and GROUP BY

Aggregate functions reduce many rows to one. The big five: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`.

```sql
-- How many exercises in each category?
SELECT category, COUNT(*) AS n
FROM exercises
GROUP BY category;

-- Total calories Alice has eaten today
SELECT SUM(f.calories * um.servings) AS total_calories
FROM user_meals um
JOIN foods f ON f.id = um.food_id
JOIN users u ON u.id = um.user_id
WHERE u.email = 'alice@demo.com'
  AND um.eaten_on = DATE('now');

-- Calories burned per user per day, sorted
SELECT u.name,
       um.eaten_on,
       SUM(f.calories * um.servings) AS calories_in
FROM user_meals um
JOIN foods f ON f.id = um.food_id
JOIN users u ON u.id = um.user_id
GROUP BY u.id, um.eaten_on
ORDER BY um.eaten_on DESC, calories_in DESC;
```

Rule of thumb: every column in a `SELECT` with `GROUP BY` must either be in the `GROUP BY`, or be wrapped in an aggregate function. Otherwise you're asking the DB which row's value to pick from a group, and the answer is undefined.

`HAVING` filters groups (after aggregation), `WHERE` filters rows (before):

```sql
-- Categories with more than two exercises
SELECT category, COUNT(*) AS n
FROM exercises
GROUP BY category
HAVING n > 2;
```

---

## Transactions — all-or-nothing

A **transaction** groups multiple statements so they succeed together or fail together. Crucial whenever a logical operation needs more than one statement.

```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
-- or ROLLBACK; if you want to undo
```

If the second UPDATE fails (or the server crashes between them), you don't want money to vanish. Transactions guarantee that.

Transactions are **ACID**:
- **Atomic** — all or nothing.
- **Consistent** — constraints hold before and after.
- **Isolated** — concurrent transactions don't see each other's half-done state.
- **Durable** — once committed, survives a crash.

In the seed script we wrap all the inserts in `db.transaction(() => { ... })`. That's better-sqlite3's API for `BEGIN/COMMIT`. It also makes the seed *much* faster — committing once instead of 100+ times.

---

## Indexes — the speed dial

Without indexes, the database has to read every row to answer `WHERE email = '…'`. With an index on `email`, it does an O(log n) lookup.

```sql
CREATE INDEX idx_users_email ON users(email);
```

Rule of thumb: index columns you frequently:
- Filter on (`WHERE email = ?`)
- Join on (any FK)
- Sort on (`ORDER BY created_at`)
- Use in `GROUP BY`

But not every column. Indexes cost write time and disk space. Indexing every column makes inserts and updates slow, and tools like `EXPLAIN` will reveal that the optimizer ignores half of them anyway.

You can ask SQLite which index it'll use:

```sql
EXPLAIN QUERY PLAN
SELECT id FROM users WHERE email = 'alice@demo.com';
-- → "SEARCH users USING INDEX idx_users_email"  (good)
```

If you see `SCAN` instead of `SEARCH`, the query is doing a full table scan and adding an index would help.

A common multi-column index pattern is `idx_user_exercises_user_date(user_id, performed_on)` — useful for "show me a user's exercises within a date range" because the leading column filters the user, and the trailing column lets the engine read directly in date order.

---

## Normalization (briefly)

Why split things into many tables instead of one big spreadsheet? Because duplication breeds bugs.

- **1NF:** every cell holds one atomic value (no `"yoga, swimming, running"` lists).
- **2NF:** every non-key column depends on the *whole* primary key (relevant only with composite PKs).
- **3NF:** no column depends on a non-key column. (If a row stores `food_calories` next to `food_id`, you've duplicated calories — a single update has two places to fail.)

Practical version: when the same fact (calories of an apple, name of a recipe) shows up in many rows, factor it into its own table and reference it. Your schema already does this — `user_meals` stores `food_id`, not the food's name and calories.

There are cases where you deliberately denormalize for performance (read-heavy analytics). Default to normalized, denormalize when measurements show you need to.

---

## How the app actually talks to SQLite

In `server.js` and `seed.js` we use **better-sqlite3**, a synchronous SQLite driver. Three patterns:

```js
// 1. Compile a statement once, execute many times — efficient and SAFE.
const stmt = db.prepare('SELECT id, name FROM users WHERE email = ?');

// 2. Run statements that don't return rows
stmt.run('alice@demo.com');             // INSERT/UPDATE/DELETE
const result = insertExercise.run('Rowing', 'cardio', 7.0);
console.log(result.lastInsertRowid);    // generated id
console.log(result.changes);            // # rows affected

// 3. Read rows
const oneRow = stmt.get('alice@demo.com');   // single row or undefined
const allRows = stmt.all();                  // array of rows
```

The `?` placeholder is **the** safety device of SQL. Each `?` becomes a parameter that the driver passes separately from the query text. The user's input *cannot* break out of its slot. That's how parameterized queries make SQL injection impossible.

---

## The big security pitfall: SQL injection

The wrong way:

```js
const email = req.body.email;
const sql = `SELECT id FROM users WHERE email = '${email}'`;  // ⚠
db.prepare(sql).get();
```

Now an attacker types `' OR '1'='1` as their email and the query becomes:

```sql
SELECT id FROM users WHERE email = '' OR '1'='1'
```

Returns every user. Or worse: `'; DROP TABLE users; --`. This kind of bug has destroyed entire production systems.

The right way (what your code already does):

```js
db.prepare('SELECT id FROM users WHERE email = ?').get(email);
```

The `?` is **not** string interpolation. The driver sends the SQL and the parameter on different channels. The string `' OR '1'='1` is treated as a single email value to compare against — never as SQL.

**Never concatenate user input into SQL.** Ever. This is the most important sentence in this document.

(Side note: column names and table names *can't* be parameterized — they're part of the SQL syntax. If you ever need a dynamic column name, validate it against an allow-list of known columns before splicing it into the query.)

---

## The big performance pitfall: N+1 queries

Naive code:

```js
const users = db.prepare('SELECT id, name FROM users').all();
for (const u of users) {
    u.favorites = db.prepare(
        'SELECT recipe_id FROM user_favorite_recipes WHERE user_id = ?'
    ).all(u.id);
}
```

For 1 user that's 2 queries. For 1000 users that's 1001 queries — the "1+N" pattern. With network latency between app and DB this becomes seconds of dead time.

The fix is one JOIN:

```sql
SELECT u.id, u.name, fav.recipe_id
FROM users u
LEFT JOIN user_favorite_recipes fav ON fav.user_id = u.id;
```

…then reshape in the app. ORMs frequently introduce this bug invisibly — every popular ORM has a "preload / include / eager-load" feature precisely to avoid it.

---

## A handful of useful date/time tricks

SQLite stores dates as text. Functions you'll reach for:

```sql
SELECT DATE('now');                  -- today, e.g. '2026-05-07'
SELECT DATE('now', '-7 days');       -- a week ago
SELECT strftime('%Y-%m', eaten_on) AS month FROM user_meals;

-- All meals in the last 7 days
SELECT * FROM user_meals WHERE eaten_on >= DATE('now', '-7 days');

-- Daily total calories per user, last 7 days
SELECT u.name, um.eaten_on, SUM(f.calories * um.servings) AS calories
FROM user_meals um
JOIN foods f ON f.id = um.food_id
JOIN users u ON u.id = um.user_id
WHERE um.eaten_on >= DATE('now', '-7 days')
GROUP BY u.id, um.eaten_on
ORDER BY u.name, um.eaten_on;
```

---

## Try it yourself — practice queries

After `npm run seed`, open `sqlite3 app.db` and try these. Each one targets a concept above.

1. **List every user** sorted by created_at descending.
2. **Find every recipe** with `difficulty = 'easy'`.
3. **For each user**, count how many exercises they've logged. Use LEFT JOIN so users with zero are included.
4. **Total calories burned per user** in the last 7 days. (Hint: `JOIN exercises` and multiply `duration_min * calories_per_min`.)
5. **Top 3 most-favorited recipes** — JOIN `recipes` with `user_favorite_recipes`, GROUP BY recipe, COUNT, ORDER, LIMIT.
6. **Foods nobody has eaten yet.** (Hint: `LEFT JOIN user_meals` and filter `WHERE user_meals.id IS NULL`.)
7. **Per-recipe step counts** — quick sanity-check on the `recipe_steps` table.

Sample answer for #4 to get you started:

```sql
SELECT u.name,
       SUM(ue.duration_min * e.calories_per_min) AS calories_burned
FROM users u
JOIN user_exercises ue ON ue.user_id = u.id
JOIN exercises      e  ON e.id = ue.exercise_id
WHERE ue.performed_on >= DATE('now', '-7 days')
GROUP BY u.id, u.name
ORDER BY calories_burned DESC;
```

---

## Backups, migrations, and operational reality

A few things to know once your DB has *real* data:

- **Backups.** For SQLite: just copy the `.db` file when nothing is writing. Or use `sqlite3 app.db ".backup backup.db"` for a hot copy. Schedule it; one corrupted file ruins your day.
- **Migrations.** Schema changes after launch can't be done by editing `schema.sql`. You write a *migration* — a versioned SQL script that transforms data — and a tool runs them in order. Popular tools: `node-pg-migrate`, `knex`, `prisma migrate`, `sqlx` (Rust). For a tiny app you can roll your own with a `schema_migrations` table.
- **Don't store binaries in your DB.** Profile pictures, recipe images: put them on disk or S3 and store the URL. Databases are slow at large blobs.
- **Connection pooling.** Real (server-based) databases need pools — opening a fresh DB connection per request is costly. SQLite is the exception; one in-process connection is fine.
- **Read replicas / sharding.** Once one DB can't keep up, you scale: replicas for reads, partitioning for writes. Postgres supports this natively. SQLite famously doesn't — it's the "swap me out when the time comes" choice.

---

## Quick reference cheat sheet

```sql
-- Inspect
.tables                    -- list tables (sqlite cli)
.schema users              -- show one table's schema
EXPLAIN QUERY PLAN <q>     -- how will SQLite run this?

-- Read
SELECT col FROM t WHERE c = ? ORDER BY col DESC LIMIT 10;
SELECT a, COUNT(*) FROM t GROUP BY a HAVING COUNT(*) > 2;
SELECT a.x, b.y FROM a JOIN b ON b.a_id = a.id;
SELECT a.x, b.y FROM a LEFT JOIN b ON b.a_id = a.id;

-- Write
INSERT INTO t (c1, c2) VALUES (?, ?);
INSERT OR IGNORE INTO t (c1) VALUES (?);
UPDATE t SET c1 = ? WHERE id = ?;
DELETE FROM t WHERE id = ?;

-- Schema
CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
ALTER TABLE t ADD COLUMN c TEXT;
CREATE INDEX idx_t_name ON t(name);
DROP TABLE t;

-- Transactions
BEGIN;  ... ;  COMMIT;       -- or ROLLBACK
```

---

## Where to go from here

Once these click:

- **Window functions** — `ROW_NUMBER() OVER (PARTITION BY …)` for "rank within a group" queries.
- **Common Table Expressions (CTEs)** — `WITH foo AS (SELECT …) SELECT … FROM foo`. Makes complex queries readable. Recursive CTEs handle hierarchies.
- **Views** — saved queries you can `SELECT` from like a table.
- **Triggers** — code the DB runs automatically on INSERT/UPDATE/DELETE. Useful, easy to overuse.
- **Stored procedures** — function-like routines living in the DB. Less common in "modern" stacks; the app does business logic instead.
- **PostgreSQL** — when you're ready for the real-world default. JSONB columns, full-text search, generated columns, partitioning.

For interactive practice beyond this app: the [SQL Murder Mystery](https://mystery.knightlab.com/) and [PostgreSQL exercises](https://pgexercises.com/) are both excellent.
