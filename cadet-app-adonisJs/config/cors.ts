import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  enabled: true,
  origin: (requestOrigin) => {
    const allowedOrigins = env.get('CORS_ORIGIN', 'http://localhost:5173').split(',')
    return allowedOrigins.includes(requestOrigin)
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: [
    'cache-control',
    'content-language',
    'content-type',
    'expires',
    'last-modified',
    'pragma',
    'x-request-id',
    'x-rateLimit-limit',
    'x-rateLimit-remaining',
    'x-rateLimit-reset'
  ],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
