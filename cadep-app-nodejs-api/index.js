const http = require('http');
const app = require('./app');


/**
 * Renvoie un port valide, peux importe la forme fournie numéro ou chaîne
 * @param {*} val 
 * @returns 
 */
const normalizePort = val => {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
};
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Recherche les différentes erreurs et les gères de manière appropriée
 * @param {*} error 
 */
const errorHandler = error => {
    if (error.syscall !== 'listen') { // Comprendre syscall
        throw error;
    }

    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
    switch (error.code) {
        case 'EACCES': 
            console.error(bind + 'requires elevated privileges.');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + 'is already in use.');
            process.exit(1);
            break;
        default:
            throw error;
    } 
};

// Création du server
const server = http.createServer(app);
server.on('error', errorHandler);
server.on('listening', () => {
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
    console.log('Listening on ' + bind);
});

server.listen(port);
