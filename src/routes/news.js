const express = require('express');
const router = express.Router();
const { lbpResponse } = require('../utils/xml');
const { sendXml, sendError } = require('../utils/respond');

// in-memory announcements (for now)
const announcements = [
    {
        id: 1,
        subject: 'Welcome!',
        details: 'Welcome to Rework! This is a custom LittleBigPlanet Karting server made by rmcvxzz.',
        creator: 'rmcvxzz',
        createdAt: new Date("2026-04-23T05:41:53.105Z")
    }
];

// GET /news_feed/tally.xml
router.get('/tally.xml', (req, res) => {

    const activitiesXml = announcements.map(a => {
        const secondsAgo = Math.floor((Date.now() - a.createdAt.getTime()) / 1000);

        return `
        <activity type="system_activity">
            <events>
                <event 
                    topic="system_event"
                    type="announcement"
                    details="${a.details}"
                    creator_username="${a.creator}"
                    creator_id="${a.id}"
                    timestamp="${a.createdAt.toISOString()}"
                    seconds_ago="${secondsAgo}"
                    tags=""
                    subject="${a.subject}"
                    image_url=""
                    image_md5=""
                />
            </events>
        </activity>
        `;
    }).join('');

    const xml = lbpResponse(`
  <activities 
    total="${announcements.length}"
    row_start="0"
    row_end="${announcements.length - 1}"
    page="1"
    total_pages="1"
  >
    ${activitiesXml}
  </activities>
    `);

    return sendXml(res, xml);
});


// OPTIONAL: add announcements via POST
router.post('/create', (req, res) => {
    const { subject, details } = req.body;

    if (!subject || !details) {
        return sendError(res, -4, 'Missing subject or details');
    }

    announcements.unshift({
        id: announcements.length + 1,
        subject,
        details,
        creator: 'Admin',
        createdAt: new Date()
    });

    return res.json({ success: true });
});

module.exports = router;