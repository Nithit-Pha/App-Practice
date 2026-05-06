// Seed mock data into the SQLite database.
//
// Run with:
//   cd my-api
//   npm run seed
//
// Safe to re-run: every INSERT uses OR IGNORE so existing rows are kept.
// To start fresh, delete database/app.db (and the -wal / -shm files) first.

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const DB_DIR = path.join(__dirname, '..', 'database');
const DB_FILE = path.join(DB_DIR, 'app.db');
const SCHEMA_FILE = path.join(DB_DIR, 'schema.sql');

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(SCHEMA_FILE, 'utf8'));

// ---------- Users ----------
// Pre-hashed passwords so logins work straight away.
// Cost factor 10 to keep seeding fast; production would use 12+.
const hash = (pw) => bcrypt.hashSync(pw, 10);

const users = [
    { name: 'Admin',  email: 'admin@demo.com', password: hash('admin1234'), role: 'admin' },
    { name: 'Alice',  email: 'alice@demo.com', password: hash('alice1234'), role: 'user' },
    { name: 'Bob',    email: 'bob@demo.com',   password: hash('bob12345'),  role: 'user' },
    { name: 'Carol',  email: 'carol@demo.com', password: hash('carol1234'), role: 'user' },
    { name: 'Dave',   email: 'dave@demo.com',  password: hash('dave1234'),  role: 'user' },
];

// ---------- Exercises ----------
const exercises = [
    { name: 'Yoga',           category: 'flexibility', calories_per_min: 3.5 },
    { name: 'Running',        category: 'cardio',      calories_per_min: 11.5 },
    { name: 'Swimming',       category: 'cardio',      calories_per_min: 9.8 },
    { name: 'Cycling',        category: 'cardio',      calories_per_min: 8.0 },
    { name: 'Walking',        category: 'cardio',      calories_per_min: 4.0 },
    { name: 'Push-ups',       category: 'strength',    calories_per_min: 7.0 },
    { name: 'Squats',         category: 'strength',    calories_per_min: 7.5 },
    { name: 'Deadlifts',      category: 'strength',    calories_per_min: 8.5 },
    { name: 'Stretching',     category: 'flexibility', calories_per_min: 2.5 },
    { name: 'Tennis',         category: 'sports',      calories_per_min: 8.0 },
];

// ---------- Foods ----------
const foods = [
    { name: 'Pizza slice',        description: 'Cheesy pizza with toppings.',           calories: 285, category: 'snack' },
    { name: 'Mixed salad',        description: 'Fresh leaves with vinaigrette.',        calories: 120, category: 'vegetable' },
    { name: 'Grilled chicken',    description: 'Lean protein, herb-grilled.',           calories: 220, category: 'protein' },
    { name: 'Smoothie bowl',      description: 'Frozen fruit, yogurt, granola.',        calories: 340, category: 'fruit' },
    { name: 'Apple',              description: 'A medium fresh apple.',                 calories: 95,  category: 'fruit' },
    { name: 'Banana',             description: 'A medium banana.',                      calories: 105, category: 'fruit' },
    { name: 'Greek yogurt',       description: 'Plain, unsweetened, 1 cup.',            calories: 130, category: 'dairy' },
    { name: 'Brown rice',         description: 'Cooked, 1 cup.',                        calories: 215, category: 'carb' },
    { name: 'Pasta',              description: 'Cooked, 1 cup.',                        calories: 220, category: 'carb' },
    { name: 'Steak',              description: 'Grilled, 6 oz.',                        calories: 410, category: 'protein' },
    { name: 'Salmon',             description: 'Baked, 6 oz.',                          calories: 350, category: 'protein' },
    { name: 'Chocolate cake',     description: 'A small slice.',                        calories: 380, category: 'dessert' },
    { name: 'Iced coffee',        description: 'Black, no sugar.',                      calories: 5,   category: 'drink' },
    { name: 'Smoothie',           description: 'Banana + berries + milk.',              calories: 250, category: 'drink' },
    { name: 'Boiled eggs',        description: 'Two large.',                            calories: 155, category: 'protein' },
];

// ---------- Recipes ----------
const recipes = [
    {
        slug: 'hainanese-chicken-rice',
        name: 'Hainanese Chicken Rice (Kao Man Kai)',
        summary: 'Tender poached chicken on fragrant rice with a tangy ginger-chili sauce.',
        image_url: '/assets/kao_man_kai.jpg',
        difficulty: 'medium',
        minutes: 75,
        steps: [
            'Boil chicken broth with coriander roots, garlic, pepper, ginger, sugar, soy sauce, and salt for 15 min.',
            'Add the chicken; simmer until cooked, about 30 minutes.',
            'Plunge cooked chicken into ice water; rest 10 min, then drain.',
            'Sauté garlic and ginger; add raw rice and stir to coat.',
            'Transfer rice to a rice cooker with the chicken broth and cook.',
            'Mix sliced ginger, chili, soybean paste, soy sauce, lime juice, and sugar for the dipping sauce.',
            'Slice the chicken, plate over rice, serve with sauce and broth.',
        ],
    },
    {
        slug: 'simple-greek-salad',
        name: 'Simple Greek Salad',
        summary: 'Tomato, cucumber, olives, feta, oregano, olive oil. 10 minutes flat.',
        image_url: null,
        difficulty: 'easy',
        minutes: 10,
        steps: [
            'Chop tomatoes and cucumbers into bite-sized pieces.',
            'Toss with red onion slices, kalamata olives, and oregano.',
            'Top with cubed feta. Drizzle olive oil and a splash of red wine vinegar.',
            'Season with salt and pepper. Serve immediately.',
        ],
    },
    {
        slug: 'overnight-oats',
        name: 'Overnight Oats',
        summary: 'Mix at night, ready in the morning. Healthy and hands-off.',
        image_url: null,
        difficulty: 'easy',
        minutes: 5,
        steps: [
            'Combine 1/2 cup oats, 1/2 cup milk, 1/4 cup yogurt, and 1 tbsp chia seeds in a jar.',
            'Stir in honey or maple syrup to taste.',
            'Refrigerate overnight.',
            'In the morning, top with sliced fruit and nuts.',
        ],
    },
];

// ---------- User logs (relative to today) ----------
// Use sqlite-friendly date strings (YYYY-MM-DD).
const today = new Date();
const dayOffset = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
};

// Helper that picks a small varied workout/meal pattern for each user.
function planFor(userIdx) {
    const exercisePicks = [
        // [exerciseName, daysAgo, durationMin]
        ['Yoga',       0, 30],
        ['Running',    1, 25],
        ['Swimming',   2, 40],
        ['Walking',    3, 60],
        ['Push-ups',   3, 15],
        ['Cycling',    5, 45],
    ];
    const mealPicks = [
        // [foodName, daysAgo, servings]
        ['Greek yogurt',     0, 1],
        ['Apple',            0, 2],
        ['Grilled chicken',  0, 1],
        ['Brown rice',       0, 1],
        ['Mixed salad',      1, 1],
        ['Smoothie',         1, 1],
        ['Pasta',            2, 1.5],
        ['Salmon',           2, 1],
        ['Pizza slice',      3, 2],
        ['Chocolate cake',   3, 1],
    ];
    // Each user gets a slightly different slice for variety.
    return {
        exercises: exercisePicks.slice(userIdx % 3, (userIdx % 3) + 4),
        meals:     mealPicks.slice(userIdx % 4, (userIdx % 4) + 6),
    };
}

// ---------- Seeding (transaction = atomic; either all rows insert or none) ----------
const insertUser = db.prepare(
    'INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
);
const insertExercise = db.prepare(
    'INSERT OR IGNORE INTO exercises (name, category, calories_per_min) VALUES (?, ?, ?)'
);
const insertFood = db.prepare(
    'INSERT OR IGNORE INTO foods (name, description, calories, category) VALUES (?, ?, ?, ?)'
);
const insertRecipe = db.prepare(
    'INSERT OR IGNORE INTO recipes (slug, name, summary, image_url, difficulty, minutes) VALUES (?, ?, ?, ?, ?, ?)'
);
const insertStep = db.prepare(
    'INSERT OR IGNORE INTO recipe_steps (recipe_id, step_no, instruction) VALUES (?, ?, ?)'
);
const insertUserExercise = db.prepare(
    'INSERT INTO user_exercises (user_id, exercise_id, performed_on, duration_min) VALUES (?, ?, ?, ?)'
);
const insertUserMeal = db.prepare(
    'INSERT INTO user_meals (user_id, food_id, eaten_on, servings) VALUES (?, ?, ?, ?)'
);
const insertFavorite = db.prepare(
    'INSERT OR IGNORE INTO user_favorite_recipes (user_id, recipe_id) VALUES (?, ?)'
);

const idOfUser     = db.prepare('SELECT id FROM users     WHERE email = ?');
const idOfExercise = db.prepare('SELECT id FROM exercises WHERE name  = ?');
const idOfFood     = db.prepare('SELECT id FROM foods     WHERE name  = ?');
const idOfRecipe   = db.prepare('SELECT id FROM recipes   WHERE slug  = ?');

const seed = db.transaction(() => {
    // Users
    for (const u of users) insertUser.run(u.name, u.email, u.password, u.role);

    // Exercises
    for (const e of exercises) insertExercise.run(e.name, e.category, e.calories_per_min);

    // Foods
    for (const f of foods) insertFood.run(f.name, f.description, f.calories, f.category);

    // Recipes + steps
    for (const r of recipes) {
        insertRecipe.run(r.slug, r.name, r.summary, r.image_url, r.difficulty, r.minutes);
        const recipeId = idOfRecipe.get(r.slug).id;
        r.steps.forEach((instruction, idx) =>
            insertStep.run(recipeId, idx + 1, instruction)
        );
    }

    // Per-user exercise + meal logs.
    // We re-run the user logs every time the script runs; if you want clean
    // logs, delete app.db before running. Otherwise duplicates accumulate.
    users.forEach((u, idx) => {
        const userId = idOfUser.get(u.email).id;
        const plan = planFor(idx);
        for (const [exName, daysAgo, mins] of plan.exercises) {
            const exId = idOfExercise.get(exName).id;
            insertUserExercise.run(userId, exId, dayOffset(daysAgo), mins);
        }
        for (const [foodName, daysAgo, servings] of plan.meals) {
            const foodId = idOfFood.get(foodName).id;
            insertUserMeal.run(userId, foodId, dayOffset(daysAgo), servings);
        }
    });

    // Favorites: alice → all recipes; bob → first two; carol → first only.
    const allRecipeIds = recipes.map((r) => idOfRecipe.get(r.slug).id);
    const alice = idOfUser.get('alice@demo.com').id;
    const bob   = idOfUser.get('bob@demo.com').id;
    const carol = idOfUser.get('carol@demo.com').id;
    for (const rid of allRecipeIds) insertFavorite.run(alice, rid);
    for (const rid of allRecipeIds.slice(0, 2)) insertFavorite.run(bob, rid);
    insertFavorite.run(carol, allRecipeIds[0]);
});

seed();

// ---------- Summary ----------
const counts = {
    users:                 db.prepare('SELECT COUNT(*) c FROM users').get().c,
    exercises:             db.prepare('SELECT COUNT(*) c FROM exercises').get().c,
    foods:                 db.prepare('SELECT COUNT(*) c FROM foods').get().c,
    recipes:               db.prepare('SELECT COUNT(*) c FROM recipes').get().c,
    recipe_steps:          db.prepare('SELECT COUNT(*) c FROM recipe_steps').get().c,
    user_exercises:        db.prepare('SELECT COUNT(*) c FROM user_exercises').get().c,
    user_meals:            db.prepare('SELECT COUNT(*) c FROM user_meals').get().c,
    user_favorite_recipes: db.prepare('SELECT COUNT(*) c FROM user_favorite_recipes').get().c,
};
console.log('Seeded. Row counts:');
console.table(counts);

// SECURITY HABIT: never print credentials to stdout.
// Even for demo passwords, treat your terminal output as permanently
// logged (scrollback, asciinema recordings, container stdout that ships
// to CloudWatch/Loki/Datadog, CI logs, screen-shares...). Print enough
// to confirm the seed worked — emails and roles — but not the secrets.
//
// If someone needs the demo passwords, they open seed.js. The hashes
// are in the DB; the plaintext only ever lives in source.
console.log('\nSeeded users (passwords are defined in seed.js — read the source):');
console.table(users.map((u) => ({ email: u.email, role: u.role })));
