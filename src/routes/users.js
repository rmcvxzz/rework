const express = require('express');
const router = express.Router();
const db = require('../db');

// Get user profile
router.get('/:id', async (req, res) => {
    const result = await db.query(
        'SELECT id, username, created_at FROM users WHERE id = $1',
        [req.params.id]
    );

    res.json(result.rows[0]);
});

module.exports = router;