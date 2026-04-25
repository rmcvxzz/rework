const express = require('express');
const router = express.Router();

const { lbpResponse } = require('../utils/xml');
const { createOrGetPlayer } = require('../store/users');
const { sendXml } = require('../utils/respond');

router.post('/login_np.xml', async (req, res) => {
    const { platform, ticket, hmac, console_id } = req.body;

    if (!platform || !ticket || !hmac || !console_id) {
        return res.status(400).send('Missing params');
    }

    try {
        const player = await createOrGetPlayer(console_id);
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        const xml = lbpResponse(`
  <login_data 
    player_id="${player.id}"
    player_name="${player.username}"
    presence="online"
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

router.post('/ping.xml', (req, res) => {
    return sendXml(res, lbpResponse(''));
});

router.post('/set_presence.xml', (req, res) => {
    return sendXml(res, lbpResponse(''));
});

module.exports = router;