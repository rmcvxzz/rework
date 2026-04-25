const express = require('express');
const router = express.Router();
const pool = require('../db');
const { lbpResponse } = require('../utils/xml');
const { sendXml } = require('../utils/respond');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '_' + file.originalname);
    }
});
const upload = multer({ storage });

function trackXml(t) {
    return `<player_creation
        ai="${t.ai}"
        associated_item_ids="${t.associated_item_ids || ''}"
        auto_reset="${t.auto_reset}"
        battle_friendly_fire="${t.battle_friendly_fire}"
        battle_kill_count="${t.battle_kill_count}"
        battle_time_limit="${t.battle_time_limit}"
        coolness="${t.coolness}"
        created_at="${t.created_at.toISOString()}"
        description="${t.description || ''}"
        difficulty="${t.difficulty}"
        dlc_keys="${t.dlc_keys || ''}"
        downloads="${t.downloads}"
        downloads_last_week="${t.downloads_last_week}"
        downloads_this_week="${t.downloads_this_week}"
        first_published="${t.first_published.toISOString()}"
        hearts="${t.hearts}"
        id="${t.id}"
        is_remixable="${t.is_remixable}"
        is_team_pick="${t.is_team_pick}"
        last_published="${t.last_published.toISOString()}"
        level_mode="${t.level_mode}"
        longest_drift="${t.longest_drift}"
        longest_hang_time="${t.longest_hang_time}"
        name="${t.name}"
        num_laps="${t.num_laps}"
        num_racers="${t.num_racers}"
        max_humans="${t.max_humans}"
        platform="${t.platform}"
        player_creation_type="${t.player_creation_type}"
        player_id="${t.player_id}"
        race_type="${t.race_type}"
        races_finished="${t.races_finished}"
        races_started="${t.races_started}"
        races_started_this_month="${t.races_started_this_month}"
        races_started_this_week="${t.races_started_this_week}"
        races_won="${t.races_won}"
        rank="${t.rank}"
        rating_down="${t.rating_down}"
        rating_up="${t.rating_up}"
        scoreboard_mode="${t.scoreboard_mode}"
        speed="${t.speed}"
        tags="${t.tags || ''}"
        track_theme="${t.track_theme}"
        unique_racer_count="${t.unique_racer_count}"
        updated_at="${t.updated_at.toISOString()}"
        user_tags="${t.user_tags || ''}"
        username="${t.username}"
        version="${t.version}"
        views="${t.views}"
        views_last_week="${t.views_last_week}"
        views_this_week="${t.views_this_week}"
        votes="${t.votes}"
        weapon_set="${t.weapon_set || ''}"
    />`;
}

// GET /tracks.xml
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.per_page) || 30;
        const offset = (page - 1) * perPage;
        const sortColumn = req.query.sort_column || 'created_at';
        const sortOrder = req.query.sort_order === 'asc' ? 'ASC' : 'DESC';
        const keyword = req.query.keyword;

        const validSortColumns = [
            'rating_up', 'hearts', 'races_started', 'coolness', 'created_at',
            'races_started_this_week', 'races_started_this_month',
            'hearts_this_week', 'hearts_this_month',
            'rating_up_this_week', 'rating_up_this_month'
        ];
        const safeSort = validSortColumns.includes(sortColumn) ? sortColumn : 'created_at';

        let where = [];
        let params = [];

        if (keyword) {
            params.push(`%${keyword}%`);
            where.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
        }

        if (req.query['filters[player_id]']) {
            params.push(req.query['filters[player_id]']);
            where.push(`player_id = $${params.length}`);
        }

        if (req.query['filters[race_type]']) {
            params.push(req.query['filters[race_type]']);
            where.push(`race_type = $${params.length}`);
        }

        const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM tracks ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / perPage);

        params.push(perPage);
        params.push(offset);

        const result = await pool.query(
            `SELECT * FROM tracks ${whereClause} ORDER BY ${safeSort} ${sortOrder} LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        const tracksXml = result.rows.map(trackXml).join('\n');

        const xml = lbpResponse(`
  <player_creations
    page="${page}"
    row_start="${offset}"
    row_end="${offset + result.rows.length - 1}"
    total="${total}"
    total_pages="${totalPages}"
  >
    ${tracksXml}
  </player_creations>`);

        return sendXml(res, xml);
    } catch (err) {
        console.error('[tracks] list error:', err);
        res.status(500).send('Database error');
    }
});

// GET /tracks/:id.xml
router.get('/:id.xml', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tracks WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).send('Not found');
        return sendXml(res, lbpResponse(trackXml(result.rows[0])));
    } catch (err) {
        console.error('[tracks] get error:', err);
        res.status(500).send('Database error');
    }
});

router.post('/', upload.fields([
    { name: 'player_creation[data]' },
    { name: 'player_creation[preview]' }
]), async (req, res) => {
    try {
        const p = req.body;
        const playerId = 1; // TODO: get from session

        const result = await pool.query(
            `INSERT INTO tracks (
                name, description, player_id, username, platform,
                player_creation_type, race_type, difficulty, speed,
                num_laps, num_racers, max_humans, track_theme, level_mode,
                scoreboard_mode, weapon_set, tags, user_tags, dlc_keys,
                associated_item_ids, ai, auto_reset, is_remixable,
                battle_friendly_fire, battle_kill_count, battle_time_limit,
                longest_drift, longest_hang_time, version
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29
            ) RETURNING id`,
            [
                p['player_creation[name]'] || 'Unnamed Track',
                p['player_creation[description]'] || '',
                playerId,
                'rmcvxzz', // TODO: from session
                p['player_creation[platform]'] || 'PS3',
                p['player_creation[player_creation_type]'] || 'TRACK',
                p['player_creation[race_type]'] || 'RACE',
                p['player_creation[difficulty]'] || 'EASY',
                p['player_creation[speed]'] || 'FAST',
                p['player_creation[num_laps]'] || 3,
                p['player_creation[num_racers]'] || 4,
                p['player_creation[max_humans]'] || 4,
                p['player_creation[track_theme]'] || 0,
                p['player_creation[level_mode]'] || 0,
                p['player_creation[scoreboard_mode]'] || 0,
                p['player_creation[weapon_set]'] || '',
                p['player_creation[tags]'] || '',
                p['player_creation[user_tags]'] || '',
                p['player_creation[dlc_keys]'] || '',
                p['player_creation[associated_item_ids]'] || '',
                p['player_creation[ai]'] === 'true',
                p['player_creation[auto_reset]'] === 'true',
                p['player_creation[is_remixable]'] !== 'false',
                p['player_creation[battle_friendly_fire]'] === 'true',
                p['player_creation[battle_kill_count]'] || 0,
                p['player_creation[battle_time_limit]'] || 0,
                p['player_creation[longest_drift]'] || 0,
                p['player_creation[longest_hang_time]'] || 0,
                1
            ]
        );

        const trackId = result.rows[0].id;
        console.log(`[tracks] created track id=${trackId}`);

        return sendXml(res, lbpResponse(`<player_creation id="${trackId}"/>`));
    } catch (err) {
        console.error('[tracks] create error:', err);
        res.status(500).send('Database error');
    }
});

module.exports = router;