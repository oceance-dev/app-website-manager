// index.ts
import http from 'http';
import app from './app.js';
import { initSchema } from './db/schema.js';
import { pool } from './config/database.js';

const normalizePort = (val: string): number | string | false => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const server = http.createServer(app);

const errorHandler = (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') throw error;

  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges.');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use.');
      process.exit(1);
      break;
    default:
      throw error;
  }
};

async function start() {
  try {
    await pool.execute('SELECT 1');
    console.log('✓ Connexion base de données établie');

    await initSchema();
    console.log('✓ Schéma vérifié');

    server.on('error', errorHandler);
    server.on('listening', () => {
      const address = server.address();
      const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
      console.log('✓ Serveur lancé sur ' + bind);
    });

    server.listen(port);
  } catch (error) {
    console.error('Erreur au démarrage:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  server.close();
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  server.close();
  await pool.end();
  process.exit(0);
});

start();