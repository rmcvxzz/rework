import express, { Request, Response } from 'express';
import { lbpResponse } from '../utils/xml';
import { createOrGetPlayer } from '../store/users';
import { sendXml } from '../utils/respond';
import { verifyTicket, parseUsername } from '../utils/verifyTicket';

const router = express.Router();

// Define the expected structure of the request body
interface LoginRequestBody {
    platform?: string;
    ticket?: string;
    hmac?: string;
    console_id?: string;
}

// Define the structure of the session data
interface SessionData {
    player_id: string | number;
    username: string;
    platform: string;
    ip_address: string;
    domain: string;
    language_code: string;
    region_code: string;
    timezone: string;
    presence: string;
    console_id: string;
}

router.post('/login_np.xml', async (req: Request<{}, any, LoginRequestBody>, res: Response) => {
    const { platform, ticket, hmac, console_id } = req.body;

    if (!platform || !ticket || !hmac || !console_id) {
        return res.status(400).send('Missing params');
    }

    try {
        const ticketBuf = Buffer.from(ticket, 'base64');

        const valid = verifyTicket(ticketBuf);
        if (!valid) {
            console.warn('[session] invalid ticket rejected');
            return res.status(403).send('Invalid ticket');
        }

        const username = parseUsername(ticketBuf) || 'Player_' + console_id.slice(-4);
        const player = await createOrGetPlayer(console_id, username);
        
        // Handle potential string | string[] type for x-forwarded-for
        const forwardedFor = req.headers['x-forwarded-for'];
        const ip = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) 
            || req.socket.remoteAddress 
            || 'unknown';

        const sessionData: SessionData = {
            player_id: player.id,
            username: player.username,
            platform: platform,
            ip_address: ip,
            domain: 'localhost',
            language_code: 'en-us',
            region_code: 'scea',
            timezone: '-500',
            presence: 'IN_POD',
            console_id: console_id
        };

        const cookieValue = Buffer.from(JSON.stringify(sessionData)).toString('base64');
        res.cookie('playco', cookieValue, { httpOnly: true, path: '/' });

        const xml = lbpResponse(`
  <login_data 
    player_id="${player.id}"
    player_name="${player.username}"
    presence="IN_POD"
    platform="${platform}"
    login_time="${new Date().toISOString()}"
    ip_address="${ip}"
  />`);

        return sendXml(res, xml);
    } catch (err) {
        console.error('[session] login error:', err);
        res.status(500).send('Database error');
    }
});

router.post('/ping.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.post('/set_presence.xml', (req: Request, res: Response) => {
    console.log('[session] set_presence hit, body:', req.body);
    return sendXml(res, lbpResponse(''));
});

export default router;