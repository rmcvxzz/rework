import pool from '../db';

interface Player {
    id: number;
    username: string;
    console_id: string;
    quote: string;
    created_at: Date;
    last_login: Date;
}

export async function createOrGetPlayer(consoleId: string, username?: string): Promise<Player> {
    const existing = await pool.query(
        'SELECT * FROM players WHERE console_id = $1',
        [consoleId]
    );

    if (existing.rows.length > 0) {
        await pool.query(
            'UPDATE players SET last_login = NOW() WHERE console_id = $1',
            [consoleId]
        );
        return existing.rows[0] as Player;
    }

    const result = await pool.query(
        `INSERT INTO players (username, console_id, created_at, last_login, quote)
         VALUES ($1, $2, NOW(), NOW(), '')
         RETURNING *`,
        [username || 'Player_' + consoleId.slice(-4), consoleId]
    );

    return result.rows[0] as Player;
}

export async function getPlayerById(id: number): Promise<Player | null> {
    const result = await pool.query(
        'SELECT * FROM players WHERE id = $1',
        [id]
    );
    return result.rows[0] as Player || null;
}

export async function getPlayerByConsoleId(consoleId: string): Promise<Player | null> {
    const result = await pool.query(
        'SELECT * FROM players WHERE console_id = $1',
        [consoleId]
    );
    return result.rows[0] as Player || null;
}