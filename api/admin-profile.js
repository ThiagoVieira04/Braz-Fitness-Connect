import { getAdminProfile, saveAdminProfile, AdminProfileError } from '../lib/admin-profile.js';
import { buildSessionCookie, createSessionToken, getSession, timingSafeEqualStrings } from '../lib/session.js';

function isSameOrigin(req) {
    const origin = req.headers.origin;
    if (!origin) return true;
    try {
        return new URL(origin).host === req.headers.host;
    } catch {
        return false;
    }
}

function parseBody(body) {
    if (typeof body === 'string') {
        try {
            return JSON.parse(body);
        } catch {
            return null;
        }
    }
    return body;
}

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'PUT') {
        res.setHeader('Allow', 'GET, PUT');
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    const session = getSession(req);
    if (!session) {
        return res.status(401).json({ error: 'Não autorizado.' });
    }
    if (req.method === 'PUT' && !isSameOrigin(req)) {
        return res.status(403).json({ error: 'Origem inválida.' });
    }

    try {
        if (req.method === 'GET') {
            return res.status(200).json({ profile: await getAdminProfile() });
        }

        const body = parseBody(req.body);
        const name = body && typeof body.name === 'string' ? body.name.trim() : '';
        const username = body && typeof body.username === 'string' ? body.username.trim() : '';
        const currentPassword = body && body.currentPassword;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            return res.status(500).json({ error: 'ADMIN_PASSWORD não configurado no servidor.' });
        }
        if (typeof currentPassword !== 'string'
            || !timingSafeEqualStrings(currentPassword, adminPassword)) {
            return res.status(401).json({ error: 'Senha atual incorreta.' });
        }
        if (!name || name.length > 80) {
            return res.status(400).json({ error: 'Informe um nome com até 80 caracteres.' });
        }
        if (!/^[A-Za-z0-9._-]{3,40}$/.test(username)) {
            return res.status(400).json({
                error: 'O usuário deve ter de 3 a 40 caracteres: letras, números, ponto, hífen ou sublinhado.'
            });
        }

        const profile = { name, username };
        await saveAdminProfile(profile);
        res.setHeader('Set-Cookie', buildSessionCookie(createSessionToken(username)));
        return res.status(200).json({ ok: true, profile });
    } catch (error) {
        const status = error instanceof AdminProfileError ? error.status : 502;
        console.error('Erro em /api/admin-profile', error);
        return res.status(status).json({
            error: error instanceof AdminProfileError ? error.message : 'Erro ao salvar o perfil do administrador.'
        });
    }
}
