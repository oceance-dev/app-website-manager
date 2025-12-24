import env from '#start/env'
import { defineConfig, stores } from '@adonisjs/limiter'

const limiterConfig = defineConfig({
  default: env.get('LIMITER_STORE'),
  stores: {
    
    
    /**
     * Database store to save rate limiting data inside a
     * MYSQL or PostgreSQL database.
     */
    database: stores.database({
      tableName: 'rate_limits'
    }),
    
    /**
     * Memory store could be used during
     * testing
     */
    memory: stores.memory({})
  },
})

export default limiterConfig

export const rateLimits = {
  // Limite global pour toutes les routes
  global: {
    requests: env.get('RATE_LIMIT_GLOBAL', 100),
    duration: '1 minute',
    blockDuration: '1 minute',
  },

  // Limite stricte pour l'authentification (login, register, reset password)

  auth: {
    requests: env.get('RATE_LIMIT_AUTH', 100),
    duration: '1 hour',
    blockDuration: '1 hour'
  },

  // Limite pour les opérations senssibles (changement de mot de passe)
  sensitive: {
    requests: env.get('RATE_LIMIT_SENSITIVE', 10),
    duration: '1 hour',
    blockDiration: '1 hour'
  },

  // Limite pour les uploads de fichiers
  upload: {
    requests: 20,
    duration: '1 hour',
    blockDuration: '30 minutes',
  }
}

declare module '@adonisjs/limiter/types' {
  export interface LimitersList extends InferLimiters<typeof limiterConfig> {}
}