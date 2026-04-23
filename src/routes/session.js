const express = require('express');
const router = express.Router();

const { lbpResponse } = require('../utils/xml');
const { createUser } = require('../store/users');

// POST /session/login_np.xml
router.post('/login_np.xml', (req, res) => {
    const { platform, ticket, hmac, console_id } = req.body;

    // Basic validation
    if (!platform || !ticket || !hmac || !console_id) {
        return res.status(400).send('Missing params');
    }

    // Create or fetch user from shared store
    const user = createUser(console_id);

    const xml = lbpResponse(`
  <login_data 
    player_id="${user.id}"
    player_name="${user.name}"
    presence="online"
    platform="${platform}"
    login_time="${new Date().toISOString()}"
    ip_address="${req.headers['x-forwarded-for'] || req.socket.remoteAddress}"
  />
    `);

    res.set('Content-Type', 'application/xml');
    res.send(xml);
});

// POST /session/ping.xml
router.post('/ping.xml', (req, res) => {
    const xml = lbpResponse(``);
    res.set('Content-Type', 'application/xml');
    res.send(xml);
});

module.exports = router;