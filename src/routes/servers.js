const express = require('express');
const router = express.Router();

const { lbpResponse } = require('../utils/xml');
const { getAnyUser } = require('../store/users');

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// POST /servers/select.xml
router.post('/select.xml', (req, res) => {
    const { server_type } = req.body;

    if (!server_type) {
        return res.status(400).send('Missing server_type');
    }

    const user = getAnyUser();

    if (!user) {
        return res.status(400).send('No user session found');
    }

    const sessionUUID = generateUUID();

    const address = "192.168.1.10"; // change if using ngrok later
    const port = process.env.PORT || 3000;

    const xml = lbpResponse(`
  <server 
    address="${address}"
    port="${port}"
    server_private_key="dev_key"
    server_type="${server_type}"
    session_uuid="${sessionUUID}"
  >
    <ticket 
      expiration_date="${new Date(Date.now() + 3600000).toISOString()}"
      player_id="${user.id}"
      session_uuid="${sessionUUID}"
      signature="fake_signature"
      username="${user.name}"
    />
  </server>
    `);

    res.set('Content-Type', 'application/xml');
    res.send(xml);
});

module.exports = router;