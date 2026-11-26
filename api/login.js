import {
    createSessionToken,
    buildSessionCookie,
    timingSafeEqualStrings
} from '../lib/session.js';
import { getAdminProfile, AdminProfileError } from '../lib/admin-profile.js';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map();

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return (req.socket && req.socket.remoteAddress) || 'unknown';
}

function isRateLimited(ip) {
    const now = Date.now();
    const entry = attempts.get(ip);
    if (!entry || now - entry.start > WINDOW_MS) {
        attempts.set(ip, { start: now, count: 1 });
        return false;
    }
    entry.count += 1;
    return entry.count > MAX_ATTEMPTS;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
        return res.status(429).json({ error: 'Muitas tentativas. Tente novamente em alguns minutos.' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch {
            body = {};
        }
    }

    const username = body && body.username;
    const password = body && body.password;
    let adminUser = process.env.ADMIN_USER;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUser || !adminPassword || !process.env.SESSION_SECRET) {
        return res.status(500).json({ error: 'Admin não configurado no servidor.' });
    }

    if (typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Informe usuário e senha.' });
    }

    if (process.env.GITHUB_REPO && process.env.GITHUB_TOKEN) {
        try {
            const profile = await getAdminProfile();
            adminUser = profile.username;
        } catch (error) {
            const status = error instanceof AdminProfileError ? error.status : 502;
            console.error('Erro ao carregar perfil para login', error);
            return res.status(status).json({
                error: error instanceof AdminProfileError
                    ? error.message
                    : 'Erro ao carregar o perfil do administrador.'
            });
        }
    }

    const userOk = timingSafeEqualStrings(username, adminUser);
    const passOk = timingSafeEqualStrings(password, adminPassword);

    if (!userOk || !passOk) {
        return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    attempts.delete(ip);
    const token = createSessionToken(adminUser);
    res.setHeader('Set-Cookie', buildSessionCookie(token));
    return res.status(200).json({ ok: true });
}
