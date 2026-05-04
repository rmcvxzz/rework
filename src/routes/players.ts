import express, { Request, Response } from 'express';
import pool from '../db';
import { lbpResponse } from '../utils/xml';
import { sendXml } from '../utils/respond';

const router = express.Router();

router.get('/:id/info.xml', async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log('[players] fetching id:', id);

    try {
        const playerResult = await pool.query('SELECT * FROM players WHERE id = $1', [id]);
        if (playerResult.rows.length === 0) return res.status(404).send('Player not found');

        const player = playerResult.rows[0];
        const trackCount = await pool.query('SELECT COUNT(*) FROM tracks WHERE player_id = $1', [id]);
        const totalTracks = parseInt(trackCount.rows[0].count);

        const xml = lbpResponse(`
  <player
    id="${player.id}"
    username="${player.username}"
    hearts="0"
    presence="ONLINE"
    player_creation_quota="100"
    created_at="${player.created_at.toISOString()}"
    updated_at="${player.last_login ? player.last_login.toISOString() : player.created_at.toISOString()}"
    quote="${player.quote || ''}"
    city="" state="" province="" country="ID"
    hearted_by_me="false"
    total_tracks="${totalTracks}"
    rank="0"
    points="0"
    online_races="0" online_wins="0" online_finished="0"
    online_forfeit="0" online_disconnected="0"
    win_streak="0" longest_win_streak="0"
    online_races_this_week="0" online_wins_this_week="0"
    online_finished_this_week="0"
    online_races_last_week="0" online_wins_last_week="0"
    online_finished_last_week="0"
  />`);

        return sendXml(res, xml);
    } catch (err) {
        console.error('[players] error:', err);
        return res.status(500).send('Database error');
    }
});

router.get('/to_id.xml', async (req: Request, res: Response) => {
    const { username } = req.query;
    try {
        const result = await pool.query('SELECT id FROM players WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(404).send('Not found');
        return sendXml(res, lbpResponse(`<player id="${result.rows[0].id}"/>`));
    } catch (err) {
        return res.status(500).send('Database error');
    }
});

router.get('/player.to_id.xml', async (req: Request, res: Response) => {
    const { username } = req.query;
    console.log('[player.to_id] looking up:', username);
    try {
        const result = await pool.query('SELECT id FROM players WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            console.log('[player.to_id] not found:', username);
            return res.status(404).send('Not found');
        }
        return sendXml(res, lbpResponse(`<player id="${result.rows[0].id}"/>`));
    } catch (err) {
        return res.status(500).send('Database error');
    }
});

export default router;