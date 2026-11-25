import crypto from 'node:crypto';

const COOKIE_NAME = 'bf_admin_session';
const MAX_AGE_SECONDS = 60 * 60 * 8;

function getSecret() {
    return process.env.SESSION_SECRET || '';
}

function base64url(input) {
    return Buffer.from(input).toString('base64url');
}

function sign(payloadB64) {
    return crypto.createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
}

export function createSessionToken(username) {
    const payload = { sub: username, exp: Date.now() + MAX_AGE_SECONDS * 1000 };
    const payloadB64 = base64url(JSON.stringify(payload));
    const signature = sign(payloadB64);
    return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token) {
    if (!token || typeof token !== 'string') return null;
    if (!getSecret()) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, signature] = parts;
    const expected = sign(payloadB64);
    const received = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    if (received.length !== expectedBuf.length || !crypto.timingSafeEqual(received, expectedBuf)) {
        return null;
    }
    try {
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
        if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
}

export function parseCookies(header) {
    const cookies = {};
    if (!header || typeof header !== 'string') return cookies;
    header.split(';').forEach(part => {
        const index = part.indexOf('=');
        if (index === -1) return;
        const key = part.slice(0, index).trim();
        const value = part.slice(index + 1).trim();
        if (!key) return;
        try {
            cookies[key] = decodeURIComponent(value);
        } catch {
            cookies[key] = value;
        }
    });
    return cookies;
}

export function getSession(req) {
    const cookies = parseCookies(req.headers.cookie);
    return verifySessionToken(cookies[COOKIE_NAME]);
}

function secureFlag() {
    return process.env.VERCEL_ENV === 'development' ? '' : '; Secure';
}

export function buildSessionCookie(token) {
    return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly${secureFlag()}; SameSite=Strict; Max-Age=${MAX_AGE_SECONDS}`;
}

export function buildClearCookie() {
    return `${COOKIE_NAME}=; Path=/; HttpOnly${secureFlag()}; SameSite=Strict; Max-Age=0`;
}

export function timingSafeEqualStrings(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

export { COOKIE_NAME, MAX_AGE_SECONDS };
