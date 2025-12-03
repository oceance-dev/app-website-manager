import rateLimit from "express-rate-limit";
import { config } from "../config/env";

export const globalLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: { error: 'Trop de requêtes, réessayer plus tard' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Trop de tentatives de connexion' },
    skipSuccessfulRequests: true
});

export const sensitiveLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { error: 'Limite atteinte pour cette opération sensible' }
});