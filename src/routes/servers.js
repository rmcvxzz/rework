const express = require('express');
const router = express.Router();

/*
const { lbpResponse } = require('../utils/xml');
const { getAnyUser } = require('../store/users');

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
*/

// POST /servers/select.xml
router.post('/select.xml', (req, res) => {
    console.log('[LBPK] server.select.xml hit — stalling connection');

    // log request for debugging
    console.log('Body:', req.body);

    setTimeout(() => {
        console.log('[LBPK] server.select.xml timed out (intentional)');
        // still do nothing
    }, 31000);
});

module.exports = router;