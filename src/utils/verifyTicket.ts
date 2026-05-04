import crypto from 'crypto';
import elliptic from 'elliptic';

const ec = new elliptic.ec('p224');

const KEY_X = 'b07bc0f0addb97657e9f389039e8d2b9c97dc2a31d3042e7d0479b93';
const KEY_Y = 'd81c42b0abdf6c42191a31e31f93342f8f033bd529c2c57fdb5a0a7d';

const pubKey = ec.keyFromPublic({ x: KEY_X, y: KEY_Y }, 'hex');

interface TicketSection {
    type: number;
    offset: number;
    dataOffset: number;
    size: number;
    data: Buffer;
}

function parseTicketSections(buf: Buffer): TicketSection[] {
    const sections: TicketSection[] = [];
    let offset = 8;

    while (offset < buf.length) {
        if (offset + 4 > buf.length) break;
        const sectionType = buf.readUInt16BE(offset);
        const sectionSize = buf.readUInt16BE(offset + 2);
        if (sectionSize === 0) break;
        sections.push({
            type: sectionType,
            offset,
            dataOffset: offset + 4,
            size: sectionSize,
            data: buf.slice(offset + 4, offset + 4 + sectionSize)
        });
        offset += 4 + sectionSize;
    }
    return sections;
}

export function verifyTicket(ticketBuffer: Buffer): boolean {
    try {
        const sections = parseTicketSections(ticketBuffer);
        console.log('[ticket] sections:', sections.map(s => `type=0x${s.type.toString(16)} size=${s.size}`));

        const sigSection = sections.find(s => s.type === 0x3002);
        if (!sigSection) {
            console.error('[ticket] no signature section found');
            return false;
        }

        const bodySection = sections.find(s => s.type === 0x3000);
        if (!bodySection) {
            console.error('[ticket] no body section found');
            return false;
        }

        if (sigSection.data.toString('ascii').includes('RPCN')) {
            console.log('[ticket] RPCN unsigned ticket — skipping verification');
            return true;
        }

        const derSig = sigSection.data.slice(12);

        let pos = 2;
        const rLen = derSig[pos + 1];
        const r = derSig.slice(pos + 2, pos + 2 + rLen).toString('hex');
        pos = pos + 2 + rLen;
        const sLen = derSig[pos + 1];
        const s = derSig.slice(pos + 2, pos + 2 + sLen).toString('hex');

        const message = ticketBuffer.slice(bodySection.offset, bodySection.offset + 4 + bodySection.size);
        const hash = crypto.createHash('sha224').update(message).digest();

        console.log('[ticket] r:', r);
        console.log('[ticket] s:', s);
        console.log('[ticket] hash:', hash.toString('hex'));
        console.log('[ticket] message length:', message.length);

        const result = ec.verify(hash, { r, s }, pubKey);
        console.log('[ticket] verify result:', result);
        return result;
    } catch (err: any) {
        console.error('[ticket] verification error:', err.message);
        return false;
    }
}

export function parseUsername(ticketBuffer: Buffer): string | null {
    try {
        const sections = parseTicketSections(ticketBuffer);
        const bodySection = sections.find(s => s.type === 0x3000);
        if (bodySection) {
            const usernameBytes = bodySection.data.slice(4, 4 + 16);
            const nullIdx = usernameBytes.indexOf(0);
            const username = usernameBytes.slice(0, nullIdx === -1 ? 16 : nullIdx).toString('utf8');
            console.log('[ticket] parsed username:', username);
            return username;
        }
        return null;
    } catch (e) {
        return null;
    }
}