const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { lbpResponse } = require('../utils/xml');
const { sendXml } = require('../utils/respond');

// Upload storage
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

// Tags
router.get('/tags.xml', (req, res) => {
    return sendXml(res, lbpResponse('<tags total="0"/>'));
});

// Profanity filters
router.get('/profanity_filters.xml', (req, res) => {
    return sendXml(res, lbpResponse('<profanity_filters total="0"/>'));
});

// Content URLs
router.get('/content_urls.xml', (req, res) => {
    return sendXml(res, lbpResponse(`
<content_urls total="1" server_uuid="rework">
    <content_url
        formats="FAR4"
        name="http://localhost:3000/upload"
    />
</content_urls>
<magic_moment scea="true" scee="true" sceasia="true" scej="true"/>
    `));
});

// Upload endpoint
router.post('/upload', upload.any(), (req, res) => {
    console.log('[upload] files:', req.files);
    console.log('[upload] body:', req.body);
    return sendXml(res, lbpResponse(''));
});

// Favorite players
router.get('/favorite_players.xml', (req, res) => {
    return sendXml(res, lbpResponse('<favorite_players total="0"/>'));
});

// Buddies replicate
router.post('/buddies/replicate.xml', (req, res) => {
    return sendXml(res, lbpResponse(''));
});

// Event create
router.post('/event.xml', (req, res) => {
    return sendXml(res, lbpResponse(''));
});

// Player creation bookmarks
router.get('/tally.xml', (req, res) => {
    return sendXml(res, lbpResponse('<player_creation_bookmarks total="0"/>'));
});

router.get('/achievements.xml', (req, res) => {
    return sendXml(res, lbpResponse('<achievements total="0"/>'));
});

module.exports = router;