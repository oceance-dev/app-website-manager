import { Request, Response, NextFunction } from "express";
import { Token, TokenPayload } from "../utils/token.js";
import { ApiError } from "../utils/ApiError.js";


export interface AuthRequest extends Request {
    userId?: {
        id: number,
        role: string,
        permissions: string[],
        tokenVersion: number;
    };
}

export async function auth(req: AuthRequest, res: Response, next: NextFunction) {


    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            throw ApiError.unauthorized('Token manquant');
        }

        const token = authHeader.split(' ')[1];
        const payload = Token.verifyAccess(token);

        const user = await U
    }

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return next(ApiError.unauthorized('Token manquant'));
    }

    next();
}

export function requireRole(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.role || !roles.includes(req.role)) {
            return next(ApiError.unauthorized('Accès non autorisé'));
        }

        next();
    }
}