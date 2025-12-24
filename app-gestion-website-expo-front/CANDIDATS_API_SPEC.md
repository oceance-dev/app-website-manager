# API Specification - Inscription Candidats

Documentation complète pour l'API d'inscription des candidats (futurs cadets).

---

## Endpoint principal

### **POST /api/candidats/register**

Inscription d'un nouveau candidat cadet.

---

## Format de la requête

### Headers
```http
Content-Type: application/json
```

### Body (JSON)
```json
{
  "lastname": "Bob",
  "firstname": "Dylan",
  "email": "bob.dylan@gmail.com",
  "emailParent": "parent.bob@gmail.com",
  "password": "SecurePassword123!",
  "phone": "+33 6 98 76 54 32",
  "cityCode": "80000",
  "dateOfbirth": "2009-08-22",
  "sexe": 0
}
```

### Champs de la requête

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `lastname` | string | ✅ | Nom de famille du candidat |
| `firstname` | string | ✅ | Prénom du candidat |
| `email` | string | ✅ | Email du candidat (unique) |
| `password` | string | ✅ | Mot de passe (min 8 caractères) |
| `emailParent` | string | ❌ | Email du parent/tuteur légal |
| `phone` | string | ❌ | Numéro de téléphone |
| `cityCode` | string | ❌ | Code postal (5 chiffres) |
| `dateOfbirth` | string | ❌ | Date de naissance (format: YYYY-MM-DD) |
| `sexe` | number | ❌ | 0 = Masculin, 1 = Féminin |

---

## Format de la réponse

### Succès (201 Created)

```json
{
  "success": true,
  "data": {
    "candidat": {
      "id": "candidat123",
      "lastname": "Bob",
      "firstname": "Dylan",
      "email": "bob.dylan@gmail.com",
      "emailParent": "parent.bob@gmail.com",
      "phone": "+33 6 98 76 54 32",
      "cityCode": "80000",
      "dateOfbirth": "2009-08-22",
      "sexe": 0,
      "status": "pending",
      "createdAt": "2025-01-24T10:30:00Z"
    },
    "message": "Inscription réussie ! Votre demande sera examinée par l'association."
  }
}
```

### Erreur - Email déjà utilisé (400 Bad Request)

```json
{
  "success": false,
  "error": "Email already exists",
  "message": "Un compte existe déjà avec cet email"
}
```

### Erreur - Données invalides (400 Bad Request)

```json
{
  "success": false,
  "error": "Validation error",
  "message": "Le mot de passe doit contenir au moins 8 caractères",
  "details": {
    "field": "password",
    "rule": "minLength"
  }
}
```

### Erreur - Serveur (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Une erreur est survenue, veuillez réessayer"
}
```

---

## Validations côté backend

### Email
- ✅ Format email valide
- ✅ Unique dans la base de données
- ✅ Non vide

### Password
- ✅ Minimum 8 caractères
- ✅ Contient au moins une majuscule
- ✅ Contient au moins un chiffre
- ✅ Contient au moins un caractère spécial

### CityCode (Code postal)
- ✅ Exactement 5 chiffres
- ✅ Format français valide

### DateOfbirth
- ✅ Format YYYY-MM-DD
- ✅ Âge minimum : 12 ans
- ✅ Âge maximum : 25 ans
- ✅ Date valide (pas dans le futur)

### Phone
- ✅ Format français : +33 X XX XX XX XX
- ✅ 10 chiffres après l'indicatif

---

## Workflow après inscription

1. **Candidat s'inscrit** → Statut: `pending`
2. **Email de confirmation envoyé** → Au candidat et au parent (si emailParent fourni)
3. **Admin/Formateur examine** → Via l'onglet "Demandes d'inscription"
4. **Rendez-vous fixé** → Statut: `appointment_scheduled`
5. **Validation après rendez-vous** → Statut: `validated`, création du compte Cadet
6. **OU Rejet** → Statut: `rejected`

---

## Autres endpoints liés

### **GET /api/candidats** (Admin/Formateur uniquement)
Récupère toutes les demandes d'inscription en attente.

**Headers:**
```http
Authorization: Bearer {token}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "candidats": [
      {
        "id": "candidat123",
        "lastname": "Bob",
        "firstname": "Dylan",
        "email": "bob.dylan@gmail.com",
        "phone": "+33 6 98 76 54 32",
        "status": "pending",
        "createdAt": "2025-01-24T10:30:00Z"
      }
    ],
    "total": 1
  }
}
```

### **POST /api/candidats/:id/validate** (Admin/Formateur uniquement)
Valide un candidat et crée son compte cadet.

**Headers:**
```http
Authorization: Bearer {token}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "message": "Candidat validé avec succès",
    "cadetId": "cadet456"
  }
}
```

### **POST /api/candidats/:id/reject** (Admin/Formateur uniquement)
Rejette une candidature.

**Headers:**
```http
Authorization: Bearer {token}
```

**Body (optionnel):**
```json
{
  "reason": "Ne répond pas aux critères d'âge"
}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "message": "Candidature rejetée"
  }
}
```

---

## Emails automatiques

### Email au candidat après inscription

**Sujet:** Votre inscription à l'association - Confirmation

**Contenu:**
```
Bonjour Dylan,

Nous avons bien reçu votre demande d'inscription.

Votre demande sera examinée par notre équipe dans les prochains jours.
Vous recevrez un email dès qu'un rendez-vous sera fixé.

Cordialement,
L'équipe CadetApp
```

### Email au parent (si emailParent fourni)

**Sujet:** Inscription de votre enfant - Confirmation

**Contenu:**
```
Bonjour,

Votre enfant Dylan Bob a créé une demande d'inscription sur CadetApp.

Vous serez contacté(e) prochainement pour fixer un rendez-vous.

Cordialement,
L'équipe CadetApp
```

---

## Codes d'erreur

| Code | Message | Description |
|------|---------|-------------|
| 201 | Created | Inscription réussie |
| 400 | Bad Request | Données invalides ou email déjà utilisé |
| 401 | Unauthorized | Token manquant ou invalide (pour endpoints protégés) |
| 403 | Forbidden | Permissions insuffisantes |
| 500 | Internal Server Error | Erreur serveur |

---

## Exemple d'implémentation backend (Node.js/Express)

```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

router.post('/candidats/register', async (req, res) => {
  try {
    const {
      lastname,
      firstname,
      email,
      emailParent,
      password,
      phone,
      cityCode,
      dateOfbirth,
      sexe
    } = req.body;

    // Validation
    if (!lastname || !firstname || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Les champs nom, prénom, email et mot de passe sont obligatoires'
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await db.query(
      'SELECT id FROM candidats WHERE email = ? OR id IN (SELECT id FROM cadets WHERE email = ?)',
      [email, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists',
        message: 'Un compte existe déjà avec cet email'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le candidat
    const result = await db.query(
      `INSERT INTO candidats (lastname, firstname, email, emailParent, password, phone, cityCode, dateOfbirth, sexe, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [lastname, firstname, email, emailParent, hashedPassword, phone, cityCode, dateOfbirth, sexe]
    );

    // Envoyer emails de confirmation (à implémenter)
    // await sendConfirmationEmail(email, firstname);
    // if (emailParent) await sendParentNotification(emailParent, firstname, lastname);

    res.status(201).json({
      success: true,
      data: {
        candidat: {
          id: `candidat${result.insertId}`,
          lastname,
          firstname,
          email,
          emailParent,
          phone,
          cityCode,
          dateOfbirth,
          sexe,
          status: 'pending'
        },
        message: 'Inscription réussie ! Votre demande sera examinée par l\'association.'
      }
    });
  } catch (error) {
    console.error('Error registering candidat:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Une erreur est survenue, veuillez réessayer'
    });
  }
});

module.exports = router;
```

---

## Sécurité

### Hashage du mot de passe
- ❌ **NE JAMAIS** stocker le mot de passe en clair
- ✅ Utiliser bcrypt avec un salt de 10 rounds minimum
- ✅ Le mot de passe hashé ne doit JAMAIS être retourné dans les réponses API

### Rate limiting
- Limiter à 5 tentatives d'inscription par IP par heure
- Empêcher le spam et les abus

### Validation d'email
- Envoyer un email de confirmation avec lien de validation
- Le compte reste en statut "pending_email_verification" jusqu'à validation

### Protection CSRF
- Utiliser des tokens CSRF pour les formulaires
- Vérifier l'origine des requêtes

---

## Tests

### Test réussi
```bash
curl -X POST http://localhost:3000/api/candidats/register \
  -H "Content-Type: application/json" \
  -d '{
    "lastname": "Test",
    "firstname": "User",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "phone": "+33 6 12 34 56 78"
  }'
```

### Test email déjà existant
```bash
curl -X POST http://localhost:3000/api/candidats/register \
  -H "Content-Type: application/json" \
  -d '{
    "lastname": "Test",
    "firstname": "User",
    "email": "existing@example.com",
    "password": "SecurePass123!"
  }'
```

**Réponse attendue:** 400 Bad Request
