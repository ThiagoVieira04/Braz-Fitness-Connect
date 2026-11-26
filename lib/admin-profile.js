import crypto from 'node:crypto';

const FILE_PATH = 'data/admin-profile.json';

export class AdminProfileError extends Error {
    constructor(message, status = 502) {
        super(message);
        this.status = status;
    }
}

function repoUrl() {
    return `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/${FILE_PATH}`;
}

function githubHeaders() {
    return {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'braz-fitness-admin'
    };
}

function profileKey() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        throw new AdminProfileError('SESSION_SECRET não configurado no servidor.', 500);
    }
    return crypto.createHash('sha256').update(secret).digest();
}

function encryptProfile(profile) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', profileKey(), iv);
    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(profile), 'utf8'),
        cipher.final()
    ]);

    return {
        version: 1,
        iv: iv.toString('base64'),
        tag: cipher.getAuthTag().toString('base64'),
        data: encrypted.toString('base64')
    };
}

function decryptProfile(encrypted) {
    if (!encrypted || encrypted.version !== 1
        || typeof encrypted.iv !== 'string'
        || typeof encrypted.tag !== 'string'
        || typeof encrypted.data !== 'string') {
        throw new AdminProfileError('Perfil do administrador inválido no GitHub.');
    }

    try {
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            profileKey(),
            Buffer.from(encrypted.iv, 'base64')
        );
        decipher.setAuthTag(Buffer.from(encrypted.tag, 'base64'));
        const plaintext = Buffer.concat([
            decipher.update(Buffer.from(encrypted.data, 'base64')),
            decipher.final()
        ]).toString('utf8');
        const profile = JSON.parse(plaintext);

        if (typeof profile.name !== 'string' || typeof profile.username !== 'string') {
            throw new Error('Invalid profile fields');
        }
        return profile;
    } catch (error) {
        if (error instanceof AdminProfileError) throw error;
        throw new AdminProfileError('Não foi possível descriptografar o perfil do administrador.');
    }
}

function defaultProfile() {
    const username = process.env.ADMIN_USER || '';
    return {
        name: (process.env.ADMIN_NAME || username).trim(),
        username
    };
}

function getGithubError(status, method) {
    if (status === 401 || status === 403) {
        return new AdminProfileError('Token do GitHub inválido ou sem permissão de Contents (Read and write).');
    }
    if (status === 409 || status === 422) {
        return new AdminProfileError('Conflito ao salvar o perfil. Recarregue a página e tente novamente.', 409);
    }
    return new AdminProfileError(`Erro ao acessar o GitHub (${method}: ${status}).`);
}

async function fetchStoredProfile() {
    if (!process.env.GITHUB_REPO || !process.env.GITHUB_TOKEN) {
        throw new AdminProfileError('Integração com o GitHub não configurada (GITHUB_REPO/GITHUB_TOKEN).', 500);
    }

    const branch = process.env.GITHUB_BRANCH || 'main';
    const response = await fetch(`${repoUrl()}?ref=${encodeURIComponent(branch)}`, {
        headers: githubHeaders()
    });

    if (response.status === 404) {
        return { profile: defaultProfile(), sha: undefined };
    }
    if (!response.ok) throw getGithubError(response.status, 'GET');

    const file = await response.json();
    try {
        const content = Buffer.from(file.content || '', 'base64').toString('utf8');
        return {
            profile: decryptProfile(JSON.parse(content)),
            sha: file.sha
        };
    } catch (error) {
        if (error instanceof AdminProfileError) throw error;
        throw new AdminProfileError('Não foi possível ler o perfil do administrador no GitHub.');
    }
}

export async function getAdminProfile() {
    const { profile } = await fetchStoredProfile();
    return profile;
}

export async function saveAdminProfile(profile) {
    const current = await fetchStoredProfile();
    const content = Buffer.from(
        JSON.stringify(encryptProfile(profile), null, 2) + '\n',
        'utf8'
    ).toString('base64');
    const response = await fetch(repoUrl(), {
        method: 'PUT',
        headers: githubHeaders(),
        body: JSON.stringify({
            message: 'chore: atualiza perfil do administrador',
            content,
            branch: process.env.GITHUB_BRANCH || 'main',
            ...(current.sha ? { sha: current.sha } : {})
        })
    });

    if (!response.ok) {
        const details = await response.text();
        console.error('GitHub PUT do perfil falhou', response.status, details);
        throw getGithubError(response.status, 'PUT');
    }
}
