# Exemples de données API - Cadets

Ce fichier montre les formats de données attendus pour l'API des cadets.

---

## 1. GET /api/cadets - Récupérer tous les cadets

### Requête
```http
GET /api/cadets?page=1&limit=10&statut=Actif&role=Cadet&search=Pierre
```

### Paramètres de requête (query parameters)
```typescript
{
  page?: number;        // Numéro de page (défaut: 1)
  limit?: number;       // Nombre d'éléments par page (défaut: 20)
  statut?: 'Actif' | 'Inactif';  // Filtrer par statut
  role?: 'Cadet' | 'Cadet Breveté' | 'Ancien Cadet';  // Filtrer par rôle
  search?: string;      // Rechercher dans nom/prénom/email
}
```

### Réponse attendue (200 OK)
```json
{
  "success": true,
  "data": {
    "cadets": [
      {
        "id": "cadet3",
        "lastname": "Bob",
        "firstname": "Pierre",
        "email": "pierre.bob@exemple.fr",
        "role": "Cadet",
        "status": "Actif",
        "dateOfBirth": "22/08/2009",
        "sexe": 0,
        "phone": "+33 6 98 76 54 32",
        "phoneParent": "+33 7 11 22 33 44",
        "courseAccess": true,
        "createdAt": "2025-01-10T10:30:00Z",
        "updatedAt": "2025-01-15T14:20:00Z"
      },
      {
        "id": "cadet8",
        "lastname": "Durand",
        "firstname": "Sophie",
        "email": "sophie.durand@exemple.fr",
        "role": "Cadet Breveté",
        "status": "Actif",
        "dateOfBirth": "15/05/2008",
        "sexe": 1,
        "phone": "+33 6 11 22 33 44",
        "phoneParent": "+33 7 22 33 44 55",
        "courseAccess": true,
        "createdAt": "2024-09-01T08:00:00Z",
        "updatedAt": "2025-01-20T16:45:00Z"
      },
      {
        "id": "cadet12",
        "lastname": "Martin",
        "firstname": "Lucas",
        "email": "lucas.martin@exemple.fr",
        "role": "Ancien Cadet",
        "status": "Inactif",
        "dateOfBirth": "03/12/2005",
        "sexe": 0,
        "phone": "+33 6 55 66 77 88",
        "phoneParent": "+33 7 33 44 55 66",
        "courseAccess": false,
        "createdAt": "2020-09-01T08:00:00Z",
        "updatedAt": "2024-06-30T12:00:00Z"
      }
    ],
    "total": 3
  }
}
```

### Réponse en cas d'erreur (400/500)
```json
{
  "success": false,
  "error": "Paramètres invalides",
  "message": "Le paramètre 'page' doit être un nombre positif"
}
```

---

## 2. GET /api/cadets/:id - Récupérer un cadet par ID

### Requête
```http
GET /api/cadets/3
```

### Réponse attendue (200 OK)
```json
{
  "success": true,
  "data": {
    "cadet": {
      "id": 3,
      "lastname": "Bob",
      "firstname": "Pierre",
      "email": "pierre.bob@exemple.fr",
      "role": "Cadet",
      "statut": "Actif",
      "dateOfbirth": "2009-08-22",
      "sexe": 0,
      "phone": "+33 6 98 76 54 32",
      "courseAccess": true,
      "createdAt": "2025-01-10T10:30:00Z",
      "updatedAt": "2025-01-15T14:20:00Z"
    }
  }
}
```

### Réponse en cas de cadet non trouvé (404)
```json
{
  "success": false,
  "error": "Cadet non trouvé",
  "message": "Aucun cadet avec l'ID 999"
}
```

---

## 3. PATCH /api/cadets/:id/role - Mettre à jour le rôle d'un cadet

### Requête
```http
PATCH /api/cadets/3/role
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "role": "Cadet Breveté"
}
```

### Corps de la requête (body)
```json
{
  "role": "Cadet Breveté"
}
```

**Valeurs possibles pour `role`:**
- `"Cadet"`
- `"Cadet Breveté"`
- `"Ancien Cadet"`

### Réponse attendue (200 OK)
```json
{
  "success": true,
  "data": {
    "cadet": {
      "id": 3,
      "lastname": "Bob",
      "firstname": "Pierre",
      "email": "pierre.bob@exemple.fr",
      "role": "Cadet Breveté",
      "statut": "Actif",
      "dateOfbirth": "2009-08-22",
      "sexe": 0,
      "phone": "+33 6 98 76 54 32",
      "courseAccess": true,
      "createdAt": "2025-01-10T10:30:00Z",
      "updatedAt": "2025-01-23T09:15:00Z"
    },
    "message": "Rôle du cadet mis à jour avec succès"
  }
}
```

### Réponse en cas d'erreur (400)
```json
{
  "success": false,
  "error": "Rôle invalide",
  "message": "Le rôle doit être 'Cadet', 'Cadet Breveté' ou 'Ancien Cadet'"
}
```

---

## 4. PATCH /api/cadets/:id - Mettre à jour un cadet

### Requête
```http
PATCH /api/cadets/3
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "phone": "+33 6 99 88 77 66",
  "statut": "Inactif"
}
```

### Corps de la requête (body)
```json
{
  "lastname": "Bob",
  "firstname": "Pierre",
  "email": "pierre.bob@exemple.fr",
  "phone": "+33 6 99 88 77 66",
  "statut": "Inactif",
  "dateOfbirth": "2009-08-22",
  "sexe": 0,
  "courseAccess": false
}
```

**Note:** Tous les champs sont optionnels, vous pouvez envoyer uniquement ceux que vous voulez modifier.

### Réponse attendue (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 3,
    "lastname": "Bob",
    "firstname": "Pierre",
    "email": "pierre.bob@exemple.fr",
    "role": "Cadet",
    "statut": "Inactif",
    "dateOfbirth": "2009-08-22",
    "sexe": 0,
    "phone": "+33 6 99 88 77 66",
    "courseAccess": false,
    "createdAt": "2025-01-10T10:30:00Z",
    "updatedAt": "2025-01-23T10:00:00Z"
  }
}
```

---

## 5. DELETE /api/cadets/:id - Supprimer un cadet

### Requête
```http
DELETE /api/cadets/3
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Réponse attendue (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "Cadet supprimé avec succès"
  }
}
```

### Réponse en cas de cadet non trouvé (404)
```json
{
  "success": false,
  "error": "Cadet non trouvé",
  "message": "Aucun cadet avec l'ID 999"
}
```

---

## 6. GET /api/cadets (avec pagination)

### Requête
```http
GET /api/cadets?page=2&limit=5
```

### Réponse avec pagination (200 OK)
```json
{
  "success": true,
  "data": {
    "cadets": [
      {
        "id": 6,
        "lastname": "Petit",
        "firstname": "Marie",
        "email": "marie.petit@exemple.fr",
        "role": "Cadet",
        "statut": "Actif",
        "dateOfbirth": "2010-03-20",
        "sexe": 1,
        "phone": "+33 6 22 33 44 55",
        "courseAccess": true,
        "createdAt": "2025-01-12T14:00:00Z",
        "updatedAt": "2025-01-18T11:30:00Z"
      },
      {
        "id": 7,
        "lastname": "Rousseau",
        "firstname": "Antoine",
        "email": "antoine.rousseau@exemple.fr",
        "role": "Cadet",
        "statut": "Actif",
        "dateOfbirth": "2009-11-08",
        "sexe": 0,
        "phone": "+33 6 33 44 55 66",
        "courseAccess": false,
        "createdAt": "2025-01-08T09:45:00Z",
        "updatedAt": "2025-01-22T15:20:00Z"
      }
    ],
    "total": 12,
    "pagination": {
      "page": 2,
      "limit": 5,
      "totalPages": 3
    }
  }
}
```

---

## Structure des champs

### Champs obligatoires
```typescript
{
  id: string;           // Identifiant unique (ex: "cadet1", "cadet2")
  lastname: string;     // Nom de famille
  firstname: string;    // Prénom
  email: string;        // Email (unique)
  role: string;         // 'Cadet' | 'Cadet Breveté' | 'Ancien Cadet'
  status: string;       // 'Actif' | 'Inactif'
  phone: string;        // Numéro de téléphone du cadet
  dateOfBirth: string;  // Date de naissance (format: DD/MM/YYYY)
}
```

### Champs optionnels
```typescript
{
  sexe?: number;           // 0 = Masculin, 1 = Féminin
  phoneParent?: string;    // Numéro de téléphone du parent
  courseAccess?: boolean;  // Accès aux cours (true/false)
  createdAt?: string;      // Date de création (ISO 8601)
  updatedAt?: string;      // Date de dernière modification (ISO 8601)
}
```

---

## Format des dates

Les dates utilisent deux formats différents :
- **Date de naissance (`dateOfBirth`)** : Format `DD/MM/YYYY` (ex: `"22/08/2009"`)
- **Timestamps (`createdAt`, `updatedAt`)** : Format ISO 8601 (ex: `"2025-01-23T10:00:00Z"`)

---

## Codes de statut HTTP

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

---

## Headers requis

Pour les endpoints protégés, incluez le token JWT :

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## Exemple complet avec plusieurs cadets

```json
{
  "success": true,
  "data": {
    "cadets": [
      {
        "id": 1,
        "lastname": "Dupont",
        "firstname": "Jean",
        "email": "jean.dupont@exemple.fr",
        "role": "Cadet",
        "statut": "Actif",
        "dateOfbirth": "2010-05-12",
        "sexe": 0,
        "phone": "+33 6 11 11 11 11",
        "courseAccess": true,
        "createdAt": "2025-01-05T08:00:00Z",
        "updatedAt": "2025-01-20T14:30:00Z"
      },
      {
        "id": 2,
        "lastname": "Martin",
        "firstname": "Claire",
        "email": "claire.martin@exemple.fr",
        "role": "Cadet Breveté",
        "statut": "Actif",
        "dateOfbirth": "2008-09-18",
        "sexe": 1,
        "phone": "+33 6 22 22 22 22",
        "courseAccess": true,
        "createdAt": "2024-09-01T08:00:00Z",
        "updatedAt": "2025-01-21T09:15:00Z"
      },
      {
        "id": 3,
        "lastname": "Bernard",
        "firstname": "Thomas",
        "email": "thomas.bernard@exemple.fr",
        "role": "Ancien Cadet",
        "statut": "Inactif",
        "dateOfbirth": "2006-03-25",
        "sexe": 0,
        "phone": "+33 6 33 33 33 33",
        "courseAccess": false,
        "createdAt": "2019-09-01T08:00:00Z",
        "updatedAt": "2023-06-30T12:00:00Z"
      }
    ],
    "total": 3
  }
}
```
