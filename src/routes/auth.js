const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Register
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    const hash = await bcrypt.hash(password, 10);

    try {
        const result = await db.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
            [username, hash]
        );

        res.json({ userId: result.rows[0].id });
    } catch (err) {
        res.status(400).json({ error: 'User exists' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const result = await db.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
    );

    if (result.rows.length === 0)
        return res.status(404).json({ error: 'User not found' });

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
        return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET
    );

    res.json({ token });
});

module.exports = router;