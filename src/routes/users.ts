import express, { Request, Response } from 'express';
import { getPlayerById } from '../store/users';

const router = express.Router();

router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
    try {
        // Convert the string parameter to a number
        const playerId = Number(req.params.id);

        // Optional: Check if the ID is actually a valid number
        if (isNaN(playerId)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const player = await getPlayerById(playerId);

        if (!player) {
            return res.status(404).json({ error: 'Not found' });
        }

        return res.json(player);
    } catch (err) {
        console.error(`[players] Error fetching player:`, err);
        return res.status(500).json({ error: 'Database error' });
    }
});

export default router;