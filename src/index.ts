import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import cookieParser from 'cookie-parser';
import { WebSocketServer, WebSocket } from 'ws';

import usersRouter from './routes/users';
import miscRouter from './routes/misc';
import specsRouter from './routes/specs';
import resourcesRouter from './routes/resources';
import playersRouter from './routes/players';
import tracksRouter from './routes/tracks';
import sessionRouter from './routes/session';
import playerGlickosRouter from './routes/player_glickos';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | IP: ${req.ip}`);
    next();
});

const server = http.createServer(app);

server.on('connection', (socket) => {
    console.log(`[TCP] ${socket.remoteAddress}:${socket.remotePort}`);
});

const wss = new WebSocketServer({ server, path: '/api/Gateway' });

interface GatewayMessage {
    Type: string;
    From: string;
    To: string;
    Content: string;
}

const bombdServers = new Map<string, WebSocket>();

wss.on('connection', (ws: WebSocket, req) => {
    const serverId = req.headers['server_id'] as string;
    console.log(`[Gateway] Bombd connected: ${serverId}`);
    if (serverId) bombdServers.set(serverId, ws);

    ws.on('message', (data) => {
        try {
            const message: GatewayMessage = JSON.parse(data.toString());
            console.log(`[Gateway] ${message.Type} from ${message.From}`);
            handleGatewayMessage(ws, message);
        } catch (err) {
            console.error('[Gateway] Failed to parse message:', err);
        }
    });

    ws.on('close', () => {
        console.log(`[Gateway] Bombd disconnected: ${serverId}`);
        if (serverId) bombdServers.delete(serverId);
    });
});

function handleGatewayMessage(ws: WebSocket, message: GatewayMessage) {
    switch (message.Type) {
        case 'ServerInfo':
            console.log('[Gateway] Bombd server registered:', message.Content);
            break;
        case 'EventStarted':
            console.log('[Gateway] Event started:', message.Content);
            break;
        case 'EventFinished':
            console.log('[Gateway] Event finished:', message.Content);
            break;
        case 'UpdatePlayerCount':
        case 'PlayerQuit':
        case 'PlayerUpdated':
            break;
        default:
            console.log('[Gateway] Unknown message type:', message.Type);
            ws.send(JSON.stringify({
                From: 'API',
                To: message.From,
                Type: `${message.Type}Error`,
                Content: `Unknown message type ${message.Type}`
            }));
    }
}

export { bombdServers };

app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith('/api') && !req.path.endsWith('.xml')) return next();
    res.set({
        'Content-Type': 'application/xml',
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=5, max=1000',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    });
    next();
});

app.use('/api/users', usersRouter);
app.use('/api/v1', miscRouter);
app.use('/resources', specsRouter);
app.use('/resources', resourcesRouter);
app.use('/players', playersRouter);
app.use('/tracks.xml', tracksRouter);
app.use('/tracks', tracksRouter);
app.use('/session', sessionRouter);
app.use('/resources/session', sessionRouter);
app.use('/player_glickos', playerGlickosRouter);
app.use('/player_profile', miscRouter);
app.use('/player_creations', miscRouter);
app.use('/player_comments.xml', miscRouter);
app.use('/player_creation_reviews', miscRouter);
app.use('/activity_log.xml', miscRouter);
app.use('/player_avatars', miscRouter);
app.use('/planet.xml', miscRouter);
app.use('/photos', miscRouter);
app.use('/favorite_players.xml', miscRouter);
app.use('/favorite_player_creations.xml', miscRouter);
app.use('/planet', miscRouter);
app.use('/', miscRouter);

app.use((req: Request, res: Response) => {
    console.log(`[UNHANDLED] ${req.method} ${req.url}`);
    res.status(404).send('Not Found');
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Rework Server running at http://localhost:${PORT}`);
});