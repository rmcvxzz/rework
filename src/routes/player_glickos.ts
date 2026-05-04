import express, { Request, Response, Router } from 'express';
import { lbpResponse } from '../utils/xml';
import { sendXml } from '../utils/respond';

const router: Router = express.Router();

router.get('/bulk_fetch.xml', (req: Request, res: Response) => {
    return sendXml(res, lbpResponse('<player_glickos total="0"/>'));
});

export default router;