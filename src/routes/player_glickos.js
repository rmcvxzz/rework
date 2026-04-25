const express = require('express');
const router = express.Router();
const { lbpResponse } = require('../utils/xml');
const { sendXml } = require('../utils/respond');

router.get('/bulk_fetch.xml', (req, res) => {
    return sendXml(res, lbpResponse('<player_glickos total="0"/>'));
});

module.exports = router;