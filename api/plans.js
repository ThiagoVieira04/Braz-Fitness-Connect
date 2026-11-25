import { getSession } from '../lib/session.js';

const FILE_PATH = 'data/plans.json';

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
            error: 'Arquivo data/plans.json não encontrado no repositório. Verifique GITHUB_REPO, GITHUB_BRANCH e se o arquivo foi enviado ao GitHub.'
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

function validatePlans(plans) {
    if (!Array.isArray(plans) || plans.length === 0 || plans.length > 50) return false;
    return plans.every(plan => plan
        && typeof plan === 'object'
        && typeof plan.name === 'string' && plan.name.trim().length > 0 && plan.name.length <= 120
        && typeof plan.price === 'string' && plan.price.length <= 40
        && typeof plan.details === 'string' && plan.details.length <= 200
        && typeof plan.isWarning === 'boolean');
}

function normalizePlans(plans) {
    return plans.map(plan => ({
        name: plan.name.trim(),
        price: plan.price.trim(),
        details: plan.details.trim(),
        isWarning: plan.isWarning
    }));
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
            const plans = content ? JSON.parse(content) : [];
            return res.status(200).json({ plans });
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

        const plans = body && body.plans;
        if (!validatePlans(plans)) {
            return res.status(400).json({ error: 'Dados dos planos inválidos.' });
        }

        const normalized = normalizePlans(plans);
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
                message: `chore: atualiza planos (${session.sub})`,
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
        console.error('Erro em /api/plans', error);
        return res.status(502).json({ error: 'Erro ao acessar o GitHub.' });
    }
}
