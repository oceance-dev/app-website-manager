import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_DEV || 'development',

    db: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'bdd',
    },

    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || '',
        refreshSecret: process.env.JWT_REFRESH_SECRET || '',
        accessExpiry: '15m' as const,
        refreshExpiry: '7d' as const
    },

    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: true
    },

    rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 100
    }
};

if (!config.jwt.accessSecret || !config.jwt.refreshSecret) {
    throw new Error('JWT secrets manquants dans les variables d\'environnement');
}