import { Response } from 'express';
import { lbpError } from './error';

export function sendXml(res: Response, xml: string, status: number = 200): Response {
    return res
        .status(status)
        .set('Content-Type', 'application/xml')
        .send(xml);
}

export function sendError(res: Response, id: number, message: string, status: number = 400): Response {
    return res
        .status(status)
        .set('Content-Type', 'application/xml')
        .send(lbpError(id, message));
}