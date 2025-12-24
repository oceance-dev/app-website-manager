/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_CONNECTION: Env.schema.enum(['mysql'] as const),
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the limiter package
  |----------------------------------------------------------
  */
  LIMITER_STORE: Env.schema.enum(['database', 'memory'] as const),
   /*
  |--------------------------------------------------------------------------
  | Rate Limiting
  |--------------------------------------------------------------------------
  */
  RATE_LIMIT_GLOBAL: Env.schema.number.optional(),
  RATE_LIMIT_AUTH: Env.schema.number.optional(),
  RATE_LIMIT_SENSITIVE: Env.schema.number.optional(),

  /*
  |--------------------------------------------------------------------------
  | Authentication
  |--------------------------------------------------------------------------
  */
  ACCESS_TOKEN_EXPIRY: Env.schema.number.optional(),
  REFRESH_TOKEN_EXPIRY: Env.schema.number.optional(),

   /*
  |--------------------------------------------------------------------------
  | Security
  |--------------------------------------------------------------------------
  */
  MAX_LOGIN_ATTEMPTS: Env.schema.number.optional(),
  LOCKOUT_DURATION: Env.schema.number.optional(),
  PASSWORD_MIN_LENGTH: Env.schema.number.optional(),

  /*
  |--------------------------------------------------------------------------
  | CORS
  |--------------------------------------------------------------------------
  */
  CORS_ORIGIN: Env.schema.string.optional(),

})
