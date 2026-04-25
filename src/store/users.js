const pool = require('../db');

async function createOrGetPlayer(consoleId, username) {
    const existing = await pool.query(
        'SELECT * FROM players WHERE console_id = $1',
        [consoleId]
    );

    if (existing.rows.length > 0) {
        await pool.query(
            'UPDATE players SET last_login = NOW() WHERE console_id = $1',
            [consoleId]
        );
        return existing.rows[0];
    }

    const result = await pool.query(
        `INSERT INTO players (username, console_id, created_at, last_login, quote)
         VALUES ($1, $2, NOW(), NOW(), '')
         RETURNING *`,
        [username || 'Player_' + consoleId.slice(-4), consoleId]
    );

    return result.rows[0];
}

async function getPlayerById(id) {
    const result = await pool.query(
        'SELECT * FROM players WHERE id = $1',
        [id]
    );
    return result.rows[0] || null;
}

async function getPlayerByConsoleId(consoleId) {
    const result = await pool.query(
        'SELECT * FROM players WHERE console_id = $1',
        [consoleId]
    );
    return result.rows[0] || null;
}

module.exports = { createOrGetPlayer, getPlayerById, getPlayerByConsoleId };