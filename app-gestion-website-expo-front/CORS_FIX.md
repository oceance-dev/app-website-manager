# Correction de l'erreur CORS

## Qu'est-ce que CORS ?

CORS (Cross-Origin Resource Sharing) est un mécanisme de sécurité qui bloque les requêtes entre différents domaines/ports.

**Votre situation :**
- Frontend : `http://localhost:19006` (ou 8081)
- Backend : `http://localhost:3000`
- ❌ Le navigateur bloque par défaut

---

## Solutions selon votre backend

### 🟢 Node.js / Express

**Installer le package CORS :**
```bash
npm install cors
```

**Ajouter dans votre fichier principal (ex: `server.js`, `app.js`, `index.js`) :**

```javascript
const express = require('express');
const cors = require('cors');

const app = express();

// MÉTHODE 1 : Autoriser toutes les origines (développement)
app.use(cors());

// OU MÉTHODE 2 : Configuration spécifique (recommandé)
app.use(cors({
  origin: ['http://localhost:19006', 'http://localhost:8081', 'http://localhost:8083'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Vos routes
app.get('/api/cadets', (req, res) => {
  // ...
});

app.listen(3000);
```

**Avec TypeScript :**
```typescript
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: ['http://localhost:19006', 'http://localhost:8081'],
  credentials: true
}));

// ...
```

---

### 🟡 Python / Flask

**Installer flask-cors :**
```bash
pip install flask-cors
```

**Dans votre app Flask :**
```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# Autoriser toutes les origines
CORS(app)

# OU avec configuration spécifique
CORS(app, origins=['http://localhost:19006', 'http://localhost:8081'])

@app.route('/api/cadets')
def get_cadets():
    # ...
    pass
```

---

### 🟡 Python / FastAPI

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:19006', 'http://localhost:8081'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.get('/api/cadets')
async def get_cadets():
    # ...
    pass
```

---

### 🔵 PHP

**Ajouter au début de vos fichiers API :**

```php
<?php
// Autoriser toutes les origines (développement)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Gérer les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Votre code API
// ...
?>
```

**OU avec origines spécifiques :**
```php
<?php
$allowed_origins = [
    'http://localhost:19006',
    'http://localhost:8081'
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>
```

---

### 🟣 Laravel (PHP)

**Configuration dans `config/cors.php` :**
```php
<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:19006',
        'http://localhost:8081',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

**S'assurer que le middleware est activé dans `app/Http/Kernel.php` :**
```php
protected $middleware = [
    // ...
    \Fruitcake\Cors\HandleCors::class,
];
```

---

### 🔴 Ruby on Rails

**Ajouter au Gemfile :**
```ruby
gem 'rack-cors'
```

```bash
bundle install
```

**Dans `config/application.rb` :**
```ruby
config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'localhost:19006', 'localhost:8081'
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options]
  end
end
```

---

## Configuration pour la PRODUCTION

**⚠️ Important :** Ne jamais utiliser `*` (toutes origines) en production !

```javascript
// Node.js - Production
app.use(cors({
  origin: [
    'https://votre-domaine.com',
    'https://www.votre-domaine.com'
  ],
  credentials: true
}));
```

---

## Vérifier que ça fonctionne

Après avoir configuré CORS :

1. **Redémarrez votre serveur backend**
2. **Rechargez votre frontend**
3. **Ouvrez la console navigateur** (F12)
4. **Dans l'onglet Network**, vous devriez voir :
   - Une requête `OPTIONS /api/cadets` (preflight) → statut 200
   - Une requête `GET /api/cadets` → statut 200

5. **Plus d'erreur CORS !** ✅

---

## Si ça ne fonctionne toujours pas

### Vérifiez les headers de réponse

Dans l'onglet Network, cliquez sur la requête et regardez les **Response Headers** :

Vous devez voir :
```
Access-Control-Allow-Origin: http://localhost:19006
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Vérifiez le port Expo

Le frontend Expo peut tourner sur différents ports :
- 19006 (par défaut web)
- 8081
- 8083

Ajoutez-les tous dans la configuration CORS :
```javascript
origin: [
  'http://localhost:19006',
  'http://localhost:8081',
  'http://localhost:8083'
]
```

---

## Alternative temporaire (développement uniquement)

Si vous ne pouvez pas modifier le backend immédiatement, utilisez un proxy :

**1. Installer un proxy CORS local :**
```bash
npm install -g local-cors-proxy
```

**2. Lancer le proxy :**
```bash
lcp --proxyUrl http://localhost:3000
```

Le proxy tournera sur `http://localhost:8010` sans CORS.

**3. Modifier le `.env` :**
```env
EXPO_PUBLIC_API_URL=http://localhost:8010/proxy/api
```

⚠️ **Cette solution est temporaire !** Utilisez-la uniquement en développement.
