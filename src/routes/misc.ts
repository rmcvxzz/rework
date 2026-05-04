import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import pool from '../db';
import { lbpResponse } from '../utils/xml';
import { sendXml } from '../utils/respond';
import { createOrGetPlayer } from '../store/users';
import { verifyTicket, parseUsername } from '../utils/verifyTicket';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '_' + file.fieldname);
    }
});
const upload = multer({ storage });


router.get('/policy.view.xml', (req: Request, res: Response) => {
    const policy_type = (req.query.policy_type as string) || 'EULA';
    const policyName = policy_type === 'PRIVACY' ? 'Rework Privacy Policy' : 'Rework Participation Agreement';
    const policyText = `Welcome to Rework! You might wanna change this later.&lt;br&gt;&lt;br&gt;This project is not affiliated/associated with Sony/United Front Games in any way. I (rmcvxzz) am hereby not responsible for the damages that you caused by using my project.`;
    return sendXml(res, lbpResponse(`<policy id="21" is_accepted="false" name="${policyName}">${policyText}</policy>`));
});

router.post('/policy.accept.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});


router.post('/session.login_np.xml', async (req: Request, res: Response) => {
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
        const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

        const sessionData = {
            player_id: player.id,
            username: player.username,
            platform,
            ip_address: ip,
            domain: 'localhost',
            language_code: 'en-us',
            region_code: 'scea',
            timezone: '-500',
            presence: 'ONLINE',
            console_id
        };

        const cookieValue = Buffer.from(JSON.stringify(sessionData)).toString('base64');
        console.log('[login] setting cookie for player:', player.id, player.username);
        console.log('[login] cookie value:', cookieValue.substring(0, 50) + '...');

        res.cookie('playco', cookieValue, { httpOnly: true, path: '/' });

        return sendXml(res, lbpResponse(`
  <login_data 
    player_id="${player.id}"
    player_name="${player.username}"
    presence="ONLINE"
    platform="${platform}"
    login_time="${new Date().toISOString()}"
    ip_address="${ip}"
    player_profile_url="/players/${player.id}/info.xml"
  />`));
    } catch (err) {
        console.error('[session] login error:', err);
        return res.status(500).send('Database error');
    }
});

router.post('/session.ping.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.post('/session.set_presence.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.patch('/preferences.update.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.get('/player.to_id.xml', async (req: Request, res: Response) => {
    const { username } = req.query;
    try {
        const result = await pool.query('SELECT id FROM players WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(404).send('Not found');
        return sendXml(res, lbpResponse(`<player id="${result.rows[0].id}"/>`));
    } catch (err) {
        return res.status(500).send('Database error');
    }
});

router.get('/player_glickos.bulk_fetch.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<player_glickos total="0"/>'));
});

router.put('/player_avatars.update.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.get('/tag.list.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<tags total="0"/>'));
});

router.get('/profanity_filter.list.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<profanity_filters total="0"/>'));
});

router.get('/content_url.list.xml', (req: Request, res: Response) => {
    console.log('[content_urls] hit');
    return sendXml(res, lbpResponse(`
<content_urls total="1" server_uuid="rework">
    <content_url formats="FAR4" name="http://localhost:3000/api/v1/upload"/>
</content_urls>
<magic_moment scea="true" scee="true" sceasia="true" scej="true"/>`));
});

router.post('/upload', upload.any(), (req: Request, res: Response) => {
    console.log('[upload] files:', (req.files as Express.Multer.File[])?.map(f => f.filename));
    return sendXml(res, lbpResponse(''));
});

router.get('/news_feed.tally.xml', async (req: Request, res: Response) => {
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
  <activities total="${announcements.length}" row_start="0" row_end="${Math.max(announcements.length - 1, 0)}" page="1" total_pages="1">
    ${activitiesXml}
  </activities>`));
    } catch (err) {
        console.error('[news] error:', err);
        return res.status(500).send('Database error');
    }
});

router.get('/player_creation_bookmark.tally.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<player_creation_bookmarks total="0"/>'));
});

router.post('/player_creation_bookmark.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.delete('/player_creation_bookmark.remove.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.get('/achievement.list.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<achievements total="0"/>'));
});

router.post('/buddy.replicate.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.get('/favorite_player.list.xml', (req: Request, res: Response) => {
    console.log('[favorite_players] hit, query:', req.query);
    return sendXml(res, lbpResponse(`
<favorite_players total="0" row_start="0" row_end="0" page="1" total_pages="0">
</favorite_players>`));
});

router.get('/view.xml', async (req: Request, res: Response) => {
    console.log('[player_profile] hit, query:', req.query);

    let playerId: number = 1;
    try {
        const cookie = req.cookies?.playco;
        if (cookie) {
            const session = JSON.parse(Buffer.from(cookie, 'base64').toString());
            playerId = session.player_id;
        }
    } catch (e) {}

    try {
        const result = await pool.query('SELECT * FROM players WHERE id = $1', [playerId]);
        const player = result.rows[0];
        const trackCount = await pool.query('SELECT COUNT(*) FROM tracks WHERE player_id = $1', [playerId]);
        const totalTracks = parseInt(trackCount.rows[0].count);

        return sendXml(res, lbpResponse(`
<player_profile 
    player_id="${player.id}" 
    username="${player.username}" 
    quote="${player.quote || ''}" 
    country="ID" 
    hearts="0" 
    online_races="0" 
    online_wins="0" 
    online_finished="0" 
    total_tracks="${totalTracks}" 
    rank="0" 
    points="0"/>`));
    } catch (err) {
        console.error('[player_profile] error:', err);
        return res.status(500).send('Database error');
    }
});

router.get('/favorite_player_creations.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<favorite_player_creations total="0"/>'));
});

router.post('/favorite_player_creation.create.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.delete('/favorite_player_creation.destroy.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.post('/event.create.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.post('/server.select.xml', (req: Request, res: Response) => {
    const { server_type } = req.body;
    console.log('[server.select] type:', server_type?.replace('\x00', ''));
    setTimeout(() => {}, 60000);
});

router.get('/privacy_setting.show.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<privacy_setting value="0"/>'));
});

router.post('/player_creations.verify.xml', (req: Request, res: Response) => {
    console.log('[verify] body:', req.body);
    return sendXml(res, lbpResponse(`
<player_creations total="1">
    <player_creation id="0" type="TRACK" suggested_action="ADD"/>
</player_creations>`));
});

router.get('/player_creation_rating.view.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<player_creation_rating total="0"/>'));
});

router.get('/player_creation_review.list.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<player_creation_reviews total="0"/>'));
});

router.post('/track.download.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.get('/track.friends_published.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<player_creations total="0"/>'));
});

router.get('/track.profile.xml', async (req: Request, res: Response) => {
    const { id } = req.query;
    if (!id) return sendXml(res, lbpResponse('<player_creation/>'));
    try {
        const result = await pool.query('SELECT * FROM tracks WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).send('Not found');
        return sendXml(res, lbpResponse(`<player_creation id="${result.rows[0].id}" name="${result.rows[0].name}"/>`));
    } catch (err) {
        return res.status(500).send('Database error');
    }
});

router.get('/sub_leaderboard.around_me.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<sub_leaderboard total="0"/>'));
});

router.get('/sub_leaderboard.friends_view.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<sub_leaderboard total="0"/>'));
});

router.post('/single_player_game.create_finish_and_post_stats.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.get('/planet.profile.xml', async (req: Request, res: Response) => {
    console.log('[planet.profile] hit, query:', req.query);

    let playerId: number = req.query.player_id ? parseInt(req.query.player_id as string) : 1;
    try {
        const cookie = req.cookies?.playco;
        if (cookie) {
            const session = JSON.parse(Buffer.from(cookie, 'base64').toString());
            if (!req.query.player_id) playerId = session.player_id;
        }
    } catch (e) {}

    try {
        const playerResult = await pool.query('SELECT * FROM players WHERE id = $1', [playerId]);
        if (playerResult.rows.length === 0) return res.status(404).send('Not found');
        const player = playerResult.rows[0];

        const planetResult = await pool.query('SELECT * FROM planets WHERE player_id = $1', [playerId]);
        const planet = planetResult.rows[0];
        const trackCount = await pool.query('SELECT COUNT(*) FROM tracks WHERE player_id = $1', [playerId]);
        const totalTracks = parseInt(trackCount.rows[0].count);

        return sendXml(res, lbpResponse(`
<planet
    id="${planet?.id || playerId}"
    player_id="${player.id}"
    username="${player.username}"
    total_tracks="${totalTracks}"
    hearts="0"
    quote="${player.quote || ''}"
    country="ID"
/>`));
    } catch (err) {
        console.error('[planet.profile] error:', err);
        return res.status(500).send('Database error');
    }
});

router.get('/planet.show.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<planet/>'));
});

router.post('/planet.xml', upload.any(), async (req: Request, res: Response) => {
    console.log('[planet] upload hit');

    let playerId: number = 1;
    try {
        const cookie = req.cookies?.playco;
        if (cookie) {
            const session = JSON.parse(Buffer.from(cookie, 'base64').toString());
            playerId = session.player_id;
        }
    } catch (e) {}

    try {
        const result = await pool.query('SELECT id FROM planets WHERE player_id = $1', [playerId]);
        const planetId = result.rows[0]?.id || playerId;
        return sendXml(res, lbpResponse(`<planet id="${planetId}"/>`));
    } catch (err) {
        console.error('[planet] error:', err);
        return sendXml(res, lbpResponse(`<planet id="${playerId}"/>`));
    }
});

router.get('/profile.xml', async (req: Request, res: Response) => {
    console.log('[planet/profile] hit, query:', req.query);

    const playerId: number = req.query.player_id ? parseInt(req.query.player_id as string) : 1;

    try {
        const playerResult = await pool.query('SELECT * FROM players WHERE id = $1', [playerId]);
        if (playerResult.rows.length === 0) return res.status(404).send('Not found');
        const player = playerResult.rows[0];

        const planetResult = await pool.query('SELECT * FROM planets WHERE player_id = $1', [playerId]);
        if (planetResult.rows.length === 0) {
            return res.send(`<?xml version="1.0" encoding="UTF-8"?><result><status><id>-620</id><message>No player creation exists for the given ID</message></status><response/></result>`);
        }
        const planet = planetResult.rows[0];
        const trackCount = await pool.query('SELECT COUNT(*) FROM tracks WHERE player_id = $1', [playerId]);
        const totalTracks = parseInt(trackCount.rows[0].count);

        return sendXml(res, lbpResponse(`
<planet
    id="${planet.id}"
    player_id="${player.id}"
    username="${player.username}"
    total_tracks="${totalTracks}"
    hearts="0"
    quote="${player.quote || ''}"
    country="ID"
/>`));
    } catch (err) {
        console.error('[planet/profile] error:', err);
        return res.status(500).send('Database error');
    }
});

router.get('/', async (req: Request, res: Response) => {
    const playerId: number = req.query.player_id ? parseInt(req.query.player_id as string) : 1;
    try {
        const result = await pool.query('SELECT * FROM planets WHERE player_id = $1', [playerId]);
        if (result.rows.length === 0) {
            return res.send(`<?xml version="1.0" encoding="UTF-8"?><result><status><id>-620</id><message>No player creation exists for the given ID</message></status><response/></result>`);
        }
        return sendXml(res, lbpResponse(`<planet id="${result.rows[0].id}"/>`));
    } catch (err) {
        return res.status(500).send('Database error');
    }
});

router.get('/photo.search.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<photos total="0"/>'));
});

router.get('/photos/search.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<photos total="0"/>'));
});

router.get('/player_comments.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<player_comments total="0"/>'));
});

router.get('/player_creation_reviews/by_player.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<player_creation_reviews total="0"/>'));
});

router.get('/activity_log.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<activity_log total="0"/>'));
});

router.get('/:id/primary_128x128.png', (req: Request, res: Response) => {
    res.set('Content-Type', 'image/png');
    res.status(404).send();
});

router.get('/:id/preview_image_128x128.png', (req: Request, res: Response) => {
    res.status(404).send();
});

router.post('/verify.xml', (req: Request, res: Response) => {
    console.log('[verify] body:', req.body);
    return sendXml(res, lbpResponse('<player_creations total="0"/>'));
});

router.get('/skill_level.list.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<skill_levels total="0"/>'));
});

router.get('/player_creation.mine.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<player_creations total="0"/>'));
});

router.get('/player_metric.show.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<player_metric/>'));
});

router.put('/player_metric.update.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.get('/player_spotlight.list.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<player_spotlights total="0"/>'));
});

router.get('/player.skill_levels.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<skill_levels total="0"/>'));
});

router.get('/announcement.list.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<announcements total="0"/>'));
});

router.get('/content_update.latest.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<content_update/>'));
});

router.get('/leaderboard.view.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<leaderboard total="0"/>'));
});

router.get('/leaderboard.friends_view.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<leaderboard total="0"/>'));
});

router.get('/leaderboard.player_stats.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<leaderboard/>'));
});

router.get('/mail_message.list.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<mail_messages total="0"/>'));
});

router.get('/mail_message.show.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<mail_message/>'));
});

router.post('/mail_message.create.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.delete('/mail_message.destroy.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.post('/favorite_player.create.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.delete('/favorite_player.remove.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.post('/player_complaint.create.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.post('/player_creation_complaint.create.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.post('/player_creation_rating.create.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.get('/player_creation_rating.list.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<player_creation_ratings total="0"/>'));
});

router.put('/player_profile.update.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

router.post('/session.logout.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse(''));
});

export default router;