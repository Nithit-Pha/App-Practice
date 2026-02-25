const express = require('express');
const cors = require('cors');
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