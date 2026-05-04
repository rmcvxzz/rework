import express, { Request, Response } from 'express';
import pool from '../db';
import { lbpResponse } from '../utils/xml';
import { sendXml, sendError } from '../utils/respond';

const router = express.Router();

router.get('/tally.xml', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
        const announcements = result.rows;

        const activitiesXml = announcements.map((a: any) => {
            const secondsAgo = Math.floor((Date.now() - a.created_at.getTime()) / 1000);
            return `
        <activity type="system_activity">
            <events>
                <event 
                    topic="system_event"
                    type="announcement"
                    details="${a.details}"
                    creator_username="${a.creator}"
                    creator_id="${a.id}"
                    timestamp="${a.created_at.toISOString()}"
                    seconds_ago="${secondsAgo}"
                    tags=""
                    subject="${a.subject}"
                    image_url=""
                    image_md5=""
                />
            </events>
        </activity>`;
        }).join('');

        return sendXml(res, lbpResponse(`
  <activities 
    total="${announcements.length}"
    row_start="0"
    row_end="${Math.max(announcements.length - 1, 0)}"
    page="1"
    total_pages="1"
  >${activitiesXml}</activities>`));
    } catch (err) {
        console.error('[news] tally error:', err);
        return res.status(500).send('Database error');
    }
});

router.post('/create', async (req: Request, res: Response) => {
    const { subject, details, creator } = req.body;

    if (!subject || !details) {
        return sendError(res, -4, 'Missing subject or details');
    }

    try {
        await pool.query(
            'INSERT INTO announcements (subject, details, creator) VALUES ($1, $2, $3)',
            [subject, details, creator || 'Admin']
        );
        return res.json({ success: true });
    } catch (err) {
        console.error('[news] create error:', err);
        return res.status(500).json({ error: 'Database error' });
    }
});

export default router;