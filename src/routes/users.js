const express = require('express');
const router = express.Router();
const { getPlayerById } = require('../store/users');

router.get('/:id', async (req, res) => {
    try {
        const player = await getPlayerById(req.params.id);
        if (!player) return res.status(404).json({ error: 'Not found' });
        res.json(player);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;