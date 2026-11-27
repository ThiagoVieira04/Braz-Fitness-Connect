import { getSession } from '../lib/session.js';

const FILE_PATH = 'data/testimonials.json';
const MAX_ITEMS = 100;

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
            error: 'Arquivo data/testimonials.json não encontrado no repositório. Verifique a configuração do GitHub.'
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

function isValidSrc(value) {
    if (typeof value !== 'string' || !value.trim() || value.length > 2048) return false;
    const src = value.trim();
    if (/^assets\/[A-Za-z0-9._\-\/% ]+$/.test(src)) return true;

    try {
        const url = new URL(src);
        return url.protocol === 'https:'
            && url.hostname.toLowerCase().endsWith('.blob.vercel-storage.com')
            && !url.username
            && !url.password;
    } catch {
        return false;
    }
}

function validateItems(items) {
    return Array.isArray(items)
        && items.length <= MAX_ITEMS
        && items.every(item => (
            item
            && typeof item === 'object'
            && !Array.isArray(item)
            && item.type === 'video'
            && isValidSrc(item.src)
        ));
}

function normalizeItems(items) {
    return items.map(item => ({
        type: 'video',
        src: item.src.trim()
    }));
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

async function fetchCurrentFile(branch) {
    const url = `${repoUrl()}?ref=${encodeURIComponent(branch)}`;
    const response = await fetch(url, { headers: githubHeaders() });
    if (response.status === 404) return { sha: undefined };
    if (!response.ok) return { error: githubError(response.status, 'GET') };
    const data = await response.json();
    return { sha: data.sha };
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

    if (!process.env.GITHUB_REPO || !process.env.GITHUB_TOKEN) {
        return res.status(500).json({ error: 'Integração com o GitHub não configurada (GITHUB_REPO/GITHUB_TOKEN).' });
    }

    if (req.method === 'PUT' && !isSameOrigin(req)) {
        return res.status(403).json({ error: 'Origem inválida.' });
    }

    const branch = process.env.GITHUB_BRANCH || 'main';
    try {
        if (req.method === 'GET') {
            const response = await fetch(`${repoUrl()}?ref=${encodeURIComponent(branch)}`, {
                headers: githubHeaders()
            });
            if (!response.ok) {
                const mapped = githubError(response.status, 'GET');
                console.error('GitHub GET de depoimentos falhou', response.status);
                return res.status(mapped.status).json({ error: mapped.error });
            }
            const data = await response.json();
            const content = Buffer.from(data.content || '', 'base64').toString('utf8');
            const items = content ? JSON.parse(content) : [];
            if (!validateItems(items)) {
                return res.status(502).json({ error: 'O arquivo de depoimentos contém dados inválidos.' });
            }
            return res.status(200).json({ items: normalizeItems(items) });
        }

        let body = req.body;
        if (Buffer.isBuffer(body)) {
            try {
                body = JSON.parse(body.toString('utf8'));
            } catch {
                body = null;
            }
        } else if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch {
                body = null;
            }
        }

        const items = body && body.items;
        if (!validateItems(items)) {
            return res.status(400).json({ error: 'Dados dos depoimentos inválidos.' });
        }

        const current = await fetchCurrentFile(branch);
        if (current.error) {
            console.error('GitHub GET (PUT depoimentos) falhou', current.error);
            return res.status(current.error.status).json({ error: current.error.error });
        }

        const normalized = normalizeItems(items);
        const content = Buffer.from(`${JSON.stringify(normalized, null, 2)}\n`, 'utf8').toString('base64');
        const putResponse = await fetch(repoUrl(), {
            method: 'PUT',
            headers: githubHeaders(),
            body: JSON.stringify({
                message: `chore: atualiza depoimentos (${session.sub})`,
                content,
                branch,
                ...(current.sha ? { sha: current.sha } : {})
            })
        });

        if (!putResponse.ok) {
            const details = await putResponse.text();
            console.error('GitHub PUT de depoimentos falhou', putResponse.status, details);
            const mapped = githubError(putResponse.status, 'PUT');
            return res.status(mapped.status).json({ error: mapped.error });
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Erro em /api/testimonials', error);
        return res.status(502).json({ error: 'Erro ao acessar o GitHub.' });
    }
}
