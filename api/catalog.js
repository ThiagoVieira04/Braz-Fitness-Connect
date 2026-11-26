import { getSession } from '../lib/session.js';

const FILE_PATH = 'data/catalog.json';
const MAX_ITEMS = 100;
const ALLOWED_TYPES = new Set(['video', 'image', 'youtube', 'link']);

function githubHeaders() {
    return {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'braz-fitness-admin'
    };
}

function repoUrl() {
    return `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${FILE_PATH}`;
}

function githubError(status, context) {
    if (status === 404) {
        return {
            status: 404,
            error: 'Arquivo data/catalog.json não encontrado no repositório. Verifique GITHUB_REPO, GITHUB_BRANCH e se o arquivo foi enviado ao GitHub.'
        };
    }
    if (status === 401 || status === 403) {
        return {
            status: 502,
            error: 'Token do GitHub inválido ou sem permissão de Contents (Read and write).'
        };
    }
    if (status === 409) {
        return {
            status: 409,
            error: 'Conflito ao salvar: o arquivo foi alterado. Recarregue a página e tente novamente.'
        };
    }
    if (status === 422) {
        return {
            status: 502,
            error: 'O GitHub rejeitou a atualização (verifique o branch e o token).'
        };
    }
    return {
        status: 502,
        error: `Erro ao acessar o GitHub (${context}: ${status}).`
    };
}

function isRelativeAsset(value) {
    return /^assets\/[A-Za-z0-9._\-\/]+$/.test(value);
}

function parseHttpUrl(value) {
    if (!/^https?:\/\//i.test(value)) return null;
    try {
        const url = new URL(value);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
        return url;
    } catch {
        return null;
    }
}

function isYoutubeUrl(value) {
    const url = parseHttpUrl(value);
    if (!url) return false;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    return host === 'youtube.com'
        || host === 'm.youtube.com'
        || host === 'youtu.be'
        || host === 'youtube-nocookie.com';
}

function isValidSrc(type, value) {
    if (type === 'youtube') return isYoutubeUrl(value);
    if (isRelativeAsset(value)) return true;
    return Boolean(parseHttpUrl(value));
}

function isValidPoster(value) {
    return isRelativeAsset(value) || Boolean(parseHttpUrl(value));
}

function isValidItem(item) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
    if (!ALLOWED_TYPES.has(item.type)) return false;
    if (typeof item.src !== 'string') return false;
    const src = item.src.trim();
    if (!src || src.length > 2048) return false;
    if (!isValidSrc(item.type, src)) return false;
    if (item.poster != null) {
        if (typeof item.poster !== 'string') return false;
        const poster = item.poster.trim();
        if (poster.length > 2048 || !isValidPoster(poster)) return false;
    }
    if (item.title != null) {
        if (typeof item.title !== 'string' || item.title.length > 120) return false;
    }
    return true;
}

function validateCatalog(items) {
    if (!Array.isArray(items) || items.length > MAX_ITEMS) return false;
    return items.every(isValidItem);
}

function normalizeCatalog(items) {
    return items.map(item => {
        const normalized = {
            type: item.type,
            src: item.src.trim()
        };
        if (item.poster != null && item.poster.trim()) normalized.poster = item.poster.trim();
        if (item.title != null && item.title.trim()) normalized.title = item.title.trim();
        return normalized;
    });
}

async function fetchCurrentFile() {
    const branch = process.env.GITHUB_BRANCH || 'main';
    const url = `${repoUrl()}?ref=${encodeURIComponent(branch)}`;
    const response = await fetch(url, { headers: githubHeaders() });
    if (response.status === 404) return { sha: undefined };
    if (!response.ok) return { error: githubError(response.status, 'GET') };
    const data = await response.json();
    return { sha: data.sha };
}

function isSameOrigin(req) {
    const origin = req.headers.origin;
    if (!origin) return true;
    try {
        return new URL(origin).host === req.headers.host;
    } catch {
        return false;
    }
}

export default async function handler(req, res) {
    if (!process.env.GITHUB_REPO || !process.env.GITHUB_TOKEN) {
        return res.status(500).json({ error: 'Integração com o GitHub não configurada (GITHUB_REPO/GITHUB_TOKEN).' });
    }

    if (req.method !== 'GET' && req.method !== 'PUT') {
        res.setHeader('Allow', 'GET, PUT');
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    const session = getSession(req);
    if (!session) {
        return res.status(401).json({ error: 'Não autorizado.' });
    }

    try {
        if (req.method === 'GET') {
            const response = await fetch(repoUrl(), { headers: githubHeaders() });
            if (!response.ok) {
                const mapped = githubError(response.status, 'GET');
                console.error('GitHub GET falhou', response.status);
                return res.status(mapped.status).json({ error: mapped.error });
            }
            const data = await response.json();
            const content = Buffer.from(data.content || '', 'base64').toString('utf8');
            const items = content ? JSON.parse(content) : [];
            return res.status(200).json({ items });
        }

        if (!isSameOrigin(req)) {
            return res.status(403).json({ error: 'Origem inválida.' });
        }

        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch {
                body = null;
            }
        }

        const items = body && body.items;
        if (!validateCatalog(items)) {
            return res.status(400).json({ error: 'Dados do catálogo inválidos.' });
        }

        const normalized = normalizeCatalog(items);
        const current = await fetchCurrentFile();
        if (current.error) {
            console.error('GitHub GET (PUT) falhou', current.error);
            return res.status(current.error.status).json({ error: current.error.error });
        }

        const content = Buffer.from(JSON.stringify(normalized, null, 2) + '\n', 'utf8').toString('base64');
        const putResponse = await fetch(repoUrl(), {
            method: 'PUT',
            headers: githubHeaders(),
            body: JSON.stringify({
                message: `chore: atualiza catálogo (${session.sub})`,
                content,
                branch: process.env.GITHUB_BRANCH || 'main',
                ...(current.sha ? { sha: current.sha } : {})
            })
        });

        if (!putResponse.ok) {
            const details = await putResponse.text();
            console.error('GitHub PUT falhou', putResponse.status, details);
            const mapped = githubError(putResponse.status, 'PUT');
            return res.status(mapped.status).json({ error: mapped.error });
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Erro em /api/catalog', error);
        return res.status(502).json({ error: 'Erro ao acessar o GitHub.' });
    }
}
