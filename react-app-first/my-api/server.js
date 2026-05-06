const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const DB_DIR = path.join(__dirname, '..', 'database');
const DB_FILE = path.join(DB_DIR, 'app.db');
const SCHEMA_FILE = path.join(DB_DIR, 'schema.sql');

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(SCHEMA_FILE, 'utf8'));

const app = express();
const PORT = 5000;

// Middleware
app.use(cors()); // Allows React to connect
app.use(express.json()); // Lets Node read JSON data

// Temporary "Database"
let activities = [
    { id: 1, name: "Yoga", completed: false },
    { id: 2, name: "Breakfast", completed: false }
];

// 1. GET: Fetch all activities
app.get('/api/activities', (req, res) => {
    res.json(activities);
});


// 2. PUT: Update an activity status (e.g., Checking a box)
app.put('/api/activities/:id', (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;

    activities = activities.map(act =>
        act.id === parseInt(id) ? { ...act, completed } : act
    );

    res.json({ message: "Status updated!", id });
});

// ---------- Auth: Sign up ----------
app.post('/api/signup', (req, res) => {
    // NOTE: `role` is intentionally NOT read from req.body.
    // Roles are assigned only by an admin via a separate endpoint.
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
        return res.status(409).json({ error: 'Email is already registered.' });
    }

    const hashed = bcrypt.hashSync(password, 10);
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
app.post('/api/login', (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({
        message: 'Login successful.',
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
});

// ---------- Auth: list users (debug helper, no passwords) ----------
app.get('/api/users', (req, res) => {
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
