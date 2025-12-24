/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| The "limiter.define" method creates an HTTP middleware to apply rate
| limits on a route or a group of routes. Feel free to define as many
| throttle middleware as needed.
|
*/

import limiter from '@adonisjs/limiter/services/main'

export const throttle = limiter.define('global', () => {
  return limiter.allowRequests(50).every('1 minute')
})

export const authTrottle = limiter.define('auth', (ctx) => {
  return limiter
    .allowRequests(100)
    .every('15 minutes')
    .usingKey(`${ctx.request.ip()}_${ctx.request.input('email', '')}`)
    .blockFor('30 minutes')
})