import helmet from "helmet";
import cors from 'cors';
import hpp from 'hpp';
import { config } from '../config/env';

export const securityMiddlewares = [

    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                frameAncestors: ["'none'"]
            }
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }),

    cors({
        origin: config.cors.origin,
        credentials: config.cors.credentials,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-type', 'Authorization', 'X-CSRF-Token'],
        exposedHeaders: ['X-CSRF-Token'],
        maxAge: 600
    }),

    hpp({
        whitelist: ['sort', 'fields', 'page', 'limit']
    })
];