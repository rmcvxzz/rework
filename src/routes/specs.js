const express = require('express');
const router = express.Router();
const path = require('path');

const SPEC_FILES = [
    'policy.accept.xml',
    'session.login_np.xml',
    'player_glicko.bulk_fetch.xml',
    'buddy.replicate.xml',
    'content_url.list.xml',
    'tag.list.xml',        
    'profanity_filter.list.xml', 
    'server.select.xml',
    'achievement.list.xml',
    'session.set_presence.xml',
    'player.to_id.xml',
    'favorite_player.list.xml',
    'privacy_setting.show.xml',
    'session.ping.xml',
    'news_feed.tally.xml',
    'event.create.xml',
    'player_creation_bookmark.tally.xml',
    'achievement.list.xml',
    'track.create.xml'
];

SPEC_FILES.forEach(file => {
    router.get(`/${file}`, (req, res) => {
        const filePath = path.join(process.cwd(), 'src', 'templates', file);
        res.set('Content-Type', 'text/xml');
        res.sendFile(filePath);
    });
});

module.exports = router;