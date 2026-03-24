import { SignJWT, jwtVerify } from 'jose';

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-at-least-32-chars-long');

export interface TokenPayload {
    userId: string;
    role: string;
    email: string;
    name: string;
    status: string;
    companyId?: string; // Added for tenant isolation
    exp?: number;
}

export async function signToken(payload: any): Promise<string> {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('8h')
        .sign(getSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload as unknown as TokenPayload;
    } catch (error) {
        console.error('JWT verify failed:', error instanceof Error ? error.message : error);
        return null;
    }
}
