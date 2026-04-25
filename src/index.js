require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | IP: ${req.ip}`);
    next();
});

const server = require('http').createServer(app);

server.on('connection', (socket) => {
    console.log(`[TCP] ${socket.remoteAddress}:${socket.remotePort}`);
});

app.use((req, res, next) => {
    res.set({
        'Content-Type': 'application/xml',
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=5, max=1000',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    });
    next();
});

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/levels', require('./routes/levels'));
app.use('/session', require('./routes/session'));
app.use('/servers', require('./routes/servers'));
app.use('/news_feed', require('./routes/news'));
app.use('/players', require('./routes/players'));
app.use('/policies', require('./routes/policies'));
app.use('/resources/policies', require('./routes/policies'));
app.use('/resources', require('./routes/policies'));
app.use('/resources', require('./routes/resources'));
app.use('/resources/session', require('./routes/session'));
app.use('/resources', require('./routes/specs'));
app.use('/', require('./routes/misc'));
app.use('/player_glickos', require('./routes/player_glickos'));
app.use('/tracks.xml', require('./routes/tracks'));
app.use('/tracks', require('./routes/tracks'));
app.use('/', require('./routes/misc'));
app.use('/player_creation_bookmarks', require('./routes/misc'));

// root
app.get('/', (req, res) => {
    res.send('Rework LBPK Server Running (HTTP)');
});

// catch-all
app.use((req, res) => {
    console.log(`[UNHANDLED] ${req.method} ${req.url}`);
    res.status(404).send('Not Found');
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Rework Server running at http://localhost:${PORT}`);
});
