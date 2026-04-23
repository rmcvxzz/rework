const express = require('express');
const router = express.Router();
const { lbpResponse } = require('../utils/xml');

router.get('/tally.xml', (req, res) => {

    const createdAt = new Date("2026-04-23T05:41:53.105Z");
    const secondsAgo = Math.floor((Date.now() - createdAt.getTime()) / 1000);
    const timestamp = createdAt.toISOString();

    const xml = lbpResponse(`
  <activities total="1" row_start="0" row_end="1" page="1" total_pages="1">
    <activity type="system_activity">
      <events>
        <event 
          topic="system_event"
          type="announcement"
          details="Welcome to Rework! This is a custom LittleBigPlanet Karting server made by rmcvxzz."
          creator_username="Rework"
          creator_id="1"
          timestamp="${timestamp}"
          seconds_ago="${secondsAgo}"
          tags=""
          subject="Welcome!"
          image_url=""
          image_md5=""
        />
      </events>
    </activity>
  </activities>
    `);

    res.set('Content-Type', 'application/xml');
    res.send(xml);
});

module.exports = router;