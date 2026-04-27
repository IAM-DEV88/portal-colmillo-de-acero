import { SignJWT, jwtVerify } from 'jose';

// Fetch the secret key from environment variables
const getSecret = () => {
    const secret = import.meta.env.JWT_SECRET ||
        import.meta.env.ADMIN_PASSWORD ||
        import.meta.env.VITE_ADMIN_PASSWORD ||
        'default_dev_secret_very_long_string_for_jose_32_chars!';
    return new TextEncoder().encode(secret);
};

/**
 * Creates a signed JWT for admin session.
 * @param payload The user data to embed (e.g. role)
 * @returns The signed JWT token string
 */
export async function createSessionToken(payload: { role: string; user?: string }): Promise<string> {
    const jwt = await new SignJWT(payload as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('8h')
        .sign(getSecret());
    return jwt;
}

/**
 * Verifies a JWT token and returns its payload if valid.
 * @param token The JWT token string
 * @returns The payload object or null if invalid
 */
export async function verifySessionToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload; // { role: 'admin' | 'official', user: ... }
    } catch (error) {
        return null;
    }
}
