# Documentation API

Cette documentation décrit l'utilisation des services API pour l'application de gestion des cadets.

## Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet avec :

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

Pour la production, modifiez l'URL selon votre serveur backend.

## Structure

```
src/api/
├── config.ts          # Configuration de base et utilitaires
├── types.ts           # Types TypeScript pour les requêtes/réponses
├── cadets.api.ts      # Service API pour les cadets
├── documents.api.ts   # Service API pour les documents
├── index.ts           # Point d'entrée centralisé
└── README.md          # Cette documentation
```

## Utilisation

### Importer les services

```typescript
import { CadetsApi, DocumentsApi } from '../api';
```

### Exemples d'utilisation

#### 1. Récupérer tous les cadets

```typescript
// Sans filtres
const response = await CadetsApi.getAllCadets();
if (response.success && response.data) {
  const cadets = response.data.cadets;
  console.log(`Nombre de cadets: ${response.data.total}`);
}

// Avec filtres et pagination
const filteredResponse = await CadetsApi.getAllCadets({
  page: 1,
  limit: 10,
  statut: 'Actif',
  role: 'Cadet',
  search: 'Pierre'
});
```

#### 2. Récupérer un cadet par ID

```typescript
const response = await CadetsApi.getCadetById(3);
if (response.success && response.data) {
  const cadet = response.data.cadet;
  console.log(`Cadet: ${cadet.firstname} ${cadet.lastname}`);
}
```

#### 3. Mettre à jour le rôle d'un cadet

```typescript
const response = await CadetsApi.updateCadetRole(3, {
  role: 'Cadet Breveté'
});

if (response.success && response.data) {
  console.log(response.data.message);
}
```

#### 4. Récupérer les cadets actifs

```typescript
const response = await CadetsApi.getActiveCadets();
if (response.success && response.data) {
  const activeCadets = response.data.cadets;
}
```

#### 5. Rechercher des cadets

```typescript
const response = await CadetsApi.searchCadets('Pierre');
if (response.success && response.data) {
  const results = response.data.cadets;
}
```

#### 6. Supprimer un cadet

```typescript
const response = await CadetsApi.deleteCadet(3);
if (response.success) {
  console.log('Cadet supprimé avec succès');
}
```

### Gestion des documents

#### 1. Récupérer tous les documents de cours

```typescript
const response = await DocumentsApi.getCourseDocuments();
if (response.success && response.data) {
  const documents = response.data.documents;
}
```

#### 2. Mettre à jour les permissions d'un document

```typescript
const response = await DocumentsApi.updateDocumentPermissions(100, {
  permissions: [
    { userId: 3, canAccess: true },
    { userId: 4, canAccess: false }
  ]
});

if (response.success && response.data) {
  console.log(response.data.message);
}
```

#### 3. Récupérer les documents accessibles par un cadet

```typescript
const response = await DocumentsApi.getDocumentsByCadet(3);
if (response.success && response.data) {
  const accessibleDocs = response.data.documents;
}
```

#### 4. Upload un document

```typescript
const file = // ... votre fichier
const response = await DocumentsApi.uploadDocument(file, 3); // folderId = 3

if (response.success && response.data) {
  console.log('Document uploadé:', response.data.nameDoc);
}
```

#### 5. Télécharger un document

```typescript
const blob = await DocumentsApi.downloadDocument(100);
// Créer un lien de téléchargement
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'document.pdf';
a.click();
```

## Gestion des erreurs

Toutes les méthodes API peuvent lever des erreurs de type `ApiError`.

```typescript
import { CadetsApi, ApiError } from '../api';

try {
  const response = await CadetsApi.getAllCadets();
  // Traiter la réponse
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Erreur API:', error.message);
    console.error('Code HTTP:', error.statusCode);
    console.error('Données:', error.data);
  } else {
    console.error('Erreur inconnue:', error);
  }
}
```

## Authentification

Pour les endpoints protégés, passez le token JWT en paramètre :

```typescript
const token = 'votre-token-jwt';

// Avec authentification
const response = await CadetsApi.getAllCadets(undefined, token);

// Mise à jour avec authentification
const updateResponse = await CadetsApi.updateCadetRole(
  3,
  { role: 'Cadet Breveté' },
  token
);
```

## Utilisation avec React Hooks

Exemple d'un hook personnalisé pour récupérer les cadets :

```typescript
import { useState, useEffect } from 'react';
import { CadetsApi, CadetResponse } from '../api';

export function useCadets() {
  const [cadets, setCadets] = useState<CadetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCadets = async () => {
      try {
        setLoading(true);
        const response = await CadetsApi.getAllCadets();

        if (response.success && response.data) {
          setCadets(response.data.cadets);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchCadets();
  }, []);

  return { cadets, loading, error };
}

// Utilisation dans un composant
function MesComposant() {
  const { cadets, loading, error } = useCadets();

  if (loading) return <Text>Chargement...</Text>;
  if (error) return <Text>Erreur: {error}</Text>;

  return (
    <View>
      {cadets.map(cadet => (
        <Text key={cadet.id}>{cadet.firstname} {cadet.lastname}</Text>
      ))}
    </View>
  );
}
```

## Endpoints API Backend (à implémenter)

### Cadets

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/cadets` | Liste tous les cadets (avec filtres optionnels) |
| GET | `/api/cadets/:id` | Récupère un cadet par ID |
| PATCH | `/api/cadets/:id/role` | Met à jour le rôle d'un cadet |
| PATCH | `/api/cadets/:id` | Met à jour les infos d'un cadet |
| DELETE | `/api/cadets/:id` | Supprime un cadet |

### Documents

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/documents` | Liste tous les documents |
| GET | `/api/documents/courses` | Liste les documents de cours |
| GET | `/api/documents/:id` | Récupère un document par ID |
| PATCH | `/api/documents/:id/permissions` | Met à jour les permissions |
| POST | `/api/documents/upload` | Upload un nouveau document |
| DELETE | `/api/documents/:id` | Supprime un document |
| GET | `/api/documents/:id/download` | Télécharge un document |
| GET | `/api/documents/cadet/:cadetId` | Documents d'un cadet |

## Notes importantes

1. **Timeout** : Les requêtes ont un timeout de 30 secondes (configurable dans `config.ts`)
2. **Headers** : Tous les appels utilisent `Content-Type: application/json`
3. **Token** : Le token JWT doit être passé en paramètre optionnel pour les endpoints protégés
4. **Pagination** : Par défaut, l'API devrait retourner 20 éléments par page
5. **CORS** : Assurez-vous que votre backend autorise les requêtes depuis l'origine de votre app
