const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Upload level
router.post('/', auth, async (req, res) => {
    const { title, data } = req.body;

    const result = await db.query(
        'INSERT INTO levels (title, data, author_id) VALUES ($1, $2, $3) RETURNING id',
        [title, data, req.user.id]
    );

    res.json({ levelId: result.rows[0].id });
});

// Get all levels
router.get('/', async (req, res) => {
    const result = await db.query(
        'SELECT * FROM levels ORDER BY created_at DESC'
    );

    res.json(result.rows);
});

module.exports = router;