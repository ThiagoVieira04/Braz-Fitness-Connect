import { handleUpload } from '@vercel/blob/client';
import { getSession } from '../lib/session.js';

const ALLOWED_CONTENT_TYPES = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'image/jpeg',
    'image/png',
    'image/webp'
];
const MAX_SIZE_BYTES = 100 * 1024 * 1024;

function isSameOrigin(req) {
    const origin = req.headers.origin;
    if (!origin) return true;
    try {
        return new URL(origin).host === req.headers.host;
    } catch {
        return false;
    }
}

function authorizeUpload(req) {
    const session = getSession(req);
    if (!session) {
        throw new Error('Não autorizado.');
    }
    if (!isSameOrigin(req)) {
        throw new Error('Origem inválida.');
    }
    return session;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(500).json({ error: 'Upload não configurado (BLOB_READ_WRITE_TOKEN).' });
    }

    try {
        let body = req.body;
        if (Buffer.isBuffer(body)) {
            body = JSON.parse(body.toString('utf8'));
        } else if (typeof body === 'string') {
            body = JSON.parse(body);
        }

        const jsonResponse = await handleUpload({
            body,
            request: req,
            onBeforeGenerateToken: async () => {
                authorizeUpload(req);
                return {
                    addRandomSuffix: true,
                    allowedContentTypes: ALLOWED_CONTENT_TYPES,
                    maximumSizeInBytes: MAX_SIZE_BYTES
                };
            }
        });

        return res.status(200).json(jsonResponse);
    } catch (error) {
        console.error('Erro em /api/upload', error);
        return res.status(400).json({ error: error.message || 'Falha ao enviar o arquivo.' });
    }
}
