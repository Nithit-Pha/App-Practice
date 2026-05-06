-- =============================================================
-- Schema for the "Want to be healthy?" app.
--
-- Every CREATE uses IF NOT EXISTS so this file is safe to re-run.
-- Foreign keys are enforced by the server (db.pragma('foreign_keys = ON')).
--
-- Design notes:
--   * Surrogate INTEGER PRIMARY KEYs everywhere — simple, stable, fast.
--   * Lookup tables (exercises, foods, recipes) are seeded once; user
--     tables (user_exercises, user_meals, ...) hold per-user logs that
--     point to the lookups via foreign keys.
--   * Indexes target the columns we filter / join on most often.
-- =============================================================

-- ---------- Users ----------
CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,                          -- bcrypt hash
    role       TEXT    NOT NULL DEFAULT 'user'
                       CHECK (role IN ('user','admin')),  -- only two roles allowed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ---------- Catalogue: exercises ----------
CREATE TABLE IF NOT EXISTS exercises (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL UNIQUE,
    category        TEXT    NOT NULL
                            CHECK (category IN ('cardio','strength','flexibility','sports')),
    calories_per_min REAL   NOT NULL CHECK (calories_per_min > 0)
);

-- ---------- Catalogue: foods ----------
CREATE TABLE IF NOT EXISTS foods (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL UNIQUE,
    description TEXT,
    calories    INTEGER NOT NULL CHECK (calories >= 0),  -- per serving
    category    TEXT    NOT NULL
                        CHECK (category IN ('protein','carb','vegetable','fruit','dairy','snack','dessert','drink'))
);

-- ---------- Catalogue: recipes ----------
CREATE TABLE IF NOT EXISTS recipes (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    slug      TEXT    NOT NULL UNIQUE,            -- URL-friendly id, e.g. "hainanese-chicken-rice"
    name      TEXT    NOT NULL,
    summary   TEXT    NOT NULL,
    image_url TEXT,
    difficulty TEXT   NOT NULL DEFAULT 'easy'
                      CHECK (difficulty IN ('easy','medium','hard')),
    minutes   INTEGER NOT NULL CHECK (minutes > 0)
);
CREATE INDEX IF NOT EXISTS idx_recipes_slug ON recipes(slug);

-- ---------- Catalogue: recipe steps (one-to-many to recipes) ----------
CREATE TABLE IF NOT EXISTS recipe_steps (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id   INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    step_no     INTEGER NOT NULL,
    instruction TEXT    NOT NULL,
    UNIQUE (recipe_id, step_no)                    -- step numbers are unique per recipe
);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe ON recipe_steps(recipe_id);

-- ---------- User log: exercises performed ----------
CREATE TABLE IF NOT EXISTS user_exercises (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    exercise_id   INTEGER NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    performed_on  DATE    NOT NULL,
    duration_min  INTEGER NOT NULL CHECK (duration_min > 0)
);
CREATE INDEX IF NOT EXISTS idx_user_exercises_user_date ON user_exercises(user_id, performed_on);

-- ---------- User log: meals eaten ----------
CREATE TABLE IF NOT EXISTS user_meals (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    food_id   INTEGER NOT NULL REFERENCES foods(id) ON DELETE RESTRICT,
    eaten_on  DATE    NOT NULL,
    servings  REAL    NOT NULL DEFAULT 1.0 CHECK (servings > 0)
);
CREATE INDEX IF NOT EXISTS idx_user_meals_user_date ON user_meals(user_id, eaten_on);

-- ---------- Many-to-many: user favorites recipes ----------
CREATE TABLE IF NOT EXISTS user_favorite_recipes (
    user_id    INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    recipe_id  INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    favorited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, recipe_id)               -- composite key prevents duplicates
);
