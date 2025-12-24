import jwt from 'jsonwebtoken';
import crypto, { verify } from 'crypto';
import { config } from '../config/env';

export interface TokenPayload {
    userId: number;
    role: string;
    permissions: string[];
    tokenVersion: number;
}

export const Token = {
    generateAccess(payload: TokenPayload): string {
        return jwt.sign(payload, config.jwt.accessSecret, {
            expiresIn: config.jwt.accessExpiry,
            issuer: 'cadets-app',
            audience: 'cadets-app-users'
        });
    },

    generateRefresh(payload: TokenPayload): string {
        return jwt.sign(
            { userId: payload.userId, tokenVersion: payload.tokenVersion },
            config.jwt.refreshSecret,
            { expiresIn: config.jwt.refreshExpiry }
        );
    },

    verifyAccess(token: string): TokenPayload {
        return jwt.verify(token, config.jwt.accessSecret, {
            issuer: 'cadets-app',
            audience: 'cadets-app-users'
        }) as TokenPayload
    },

    verifyRefresh(token: string): { userId: number, tokenVersion: number } {
        return jwt.verify(token, config.jwt.refreshSecret) as { userId: number; tokenVersion: number };
    },

    generateCsrf(): string {
        return crypto.randomBytes(32).toString('hex');
    }
};