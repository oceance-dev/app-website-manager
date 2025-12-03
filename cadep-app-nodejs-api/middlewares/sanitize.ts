import { Request, Response, NextFunction } from "express";

function sanitizeValue(value: unknown): unknown {
    if (typeof value === 'string') {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27')
            .replace(/\//g, '&#x2F;')
            .replace(/\\/g, '&#92')
            .trim();
    }

    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }

    if (value && typeof value === 'object') {
        return sanitizeObject(value as Record<string, unknown>);
    }

    return value;
}

// Reste à finir
function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        

        if (key.startsWith('$') || key.startsWith('__')) {
            continue;
        }
        sanitized[key] = sanitizeValue(value);
    }

    return sanitized;
}

export function sanitize(req: Request, res: Response, next: NextFunction) {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }

    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query as Record<string, unknown>) as typeof req.query;
    }

    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params) as typeof req.params;
    }

    next();
}