const express = require('express');
const router = express.Router();
const pool = require('../db');
const { lbpResponse } = require('../utils/xml');
const { sendXml } = require('../utils/respond');

router.get('/:id/info.xml', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM players WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).send('Player not found');
        }

        const player = result.rows[0];

        const xml = lbpResponse(`
  <player
    id="${player.id}"
    username="${player.username}"
    hearts="0"
    presence="online"
    player_creation_quota="100"
    created_at="${player.created_at.toISOString()}"
    updated_at="${player.last_login ? player.last_login.toISOString() : player.created_at.toISOString()}"
    quote="${player.quote || ''}"
    city=""
    state=""
    province=""
    country="ID"
    hearted_by_me="false"
    total_tracks="0"
    rank="0"
    points="0"
    online_races="0"
    online_wins="0"
    online_finished="0"
    online_forfeit="0"
    online_disconnected="0"
    win_streak="0"
    longest_win_streak="0"
    online_races_this_week="0"
    online_wins_this_week="0"
    online_finished_this_week="0"
    online_races_last_week="0"
    online_wins_last_week="0"
    online_finished_last_week="0"
  />
        `);

        res.set('Content-Type', 'application/xml');
        res.send(xml);

    } catch (err) {
        console.error(err);
        res.status(500).send('Database error');
    }
});

router.get('/to_id.xml', async (req, res) => {
    const { username } = req.query;
    try {
        const result = await pool.query(
            'SELECT id FROM players WHERE username = $1',
            [username]
        );
        if (result.rows.length === 0) return res.status(404).send('Not found');
        return sendXml(res, lbpResponse(`<player id="${result.rows[0].id}"/>`));
    } catch (err) {
        res.status(500).send('Database error');
    }
});

module.exports = router;