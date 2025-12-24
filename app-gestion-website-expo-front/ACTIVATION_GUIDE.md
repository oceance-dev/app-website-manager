# Guide d'activation de l'API réelle

Ce guide explique comment passer des données mockées à l'API réelle dans OrganizationScreen.

---

## Étape 1 : Vérifier que l'API est prête

Assurez-vous que votre backend répond correctement :

```bash
# Test de l'endpoint cadets
curl http://localhost:3000/api/cadets

# Devrait retourner :
{
  "success": true,
  "data": {
    "cadets": [...],
    "total": X
  }
}
```

---

## Étape 2 : Configurer l'URL de l'API

Créez ou modifiez le fichier `.env` à la racine du projet :

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

**Important :** Redémarrez le serveur Expo après avoir modifié le `.env`.

---

## Étape 3 : Activer l'API dans OrganizationScreen

Ouvrez `src/screens/OrganizationScreen.tsx` et modifiez la fonction `fetchCadets` :

### Code actuel (avec mock)

```typescript
const fetchCadets = async () => {
  try {
    setLoadingCadets(true);
    setErrorCadets(null);

    // For now, use mock data until backend is ready
    await new Promise(resolve => setTimeout(resolve, 300));

    const mockCadets = initialUtilisateurs.filter(
      u => u.role === 'Cadet' || u.role === 'Cadet Breveté' || u.role === 'Ancien Cadet'
    );

    setCadets(mockCadets);

    // TODO: Replace with real API call when backend is ready
    // const response = await CadetsApi.getAllCadets();
    // if (response.success && response.data) {
    //   const cadetsData = mapCadetsArrayToUsers(response.data.cadets);
    //   setCadets(cadetsData);
    // }
  } catch (error) {
    console.error('Error fetching cadets:', error);
    setErrorCadets('Une erreur est survenue lors du chargement des cadets');
  } finally {
    setLoadingCadets(false);
  }
};
```

### Code modifié (avec API réelle)

```typescript
const fetchCadets = async () => {
  try {
    setLoadingCadets(true);
    setErrorCadets(null);

    // Appel API réel
    const response = await CadetsApi.getAllCadets();

    if (response.success && response.data) {
      // Mapper les données API vers le format User
      const cadetsData = mapCadetsArrayToUsers(response.data.cadets);
      setCadets(cadetsData);
    } else {
      setErrorCadets('Erreur lors du chargement des cadets');
    }
  } catch (error) {
    console.error('Error fetching cadets:', error);
    if (error instanceof ApiError) {
      setErrorCadets(error.message);
    } else {
      setErrorCadets('Une erreur est survenue lors du chargement des cadets');
    }
  } finally {
    setLoadingCadets(false);
  }
};
```

**Changements :**
1. ✅ Supprimé le `setTimeout` et les données mockées
2. ✅ Décommenté et activé l'appel `CadetsApi.getAllCadets()`
3. ✅ Ajouté `mapCadetsArrayToUsers` pour convertir les données

---

## Étape 4 : Activer la mise à jour du rôle

Dans la fonction `handleSaveCadetChanges` :

### Code actuel (avec mock)

```typescript
const handleSaveCadetChanges = async () => {
  if (!selectedCadet) return;

  try {
    // TODO: Remplacer par l'appel API réel
    // const response = await CadetsApi.updateCadetRole(selectedCadet.id, {
    //   role: cadetRole as 'Cadet' | 'Cadet Breveté' | 'Ancien Cadet',
    // });

    alert(`Modifications enregistrées pour ${selectedCadet.firstname} ${selectedCadet.lastname}\nNouveau rôle : ${cadetRole}`);

    await fetchCadets();
    setShowCadetModal(false);
  } catch (error) {
    console.error('Error updating cadet:', error);
    alert('Erreur lors de la mise à jour');
  }
};
```

### Code modifié (avec API réelle)

```typescript
const handleSaveCadetChanges = async () => {
  if (!selectedCadet) return;

  try {
    // Appel API réel
    const response = await CadetsApi.updateCadetRole(selectedCadet.id, {
      role: cadetRole as 'Cadet' | 'Cadet Breveté' | 'Ancien Cadet',
    });

    if (response.success && response.data) {
      alert(`Modifications enregistrées pour ${selectedCadet.firstname} ${selectedCadet.lastname}\nNouveau rôle : ${cadetRole}`);

      // Recharger la liste
      await fetchCadets();
      setShowCadetModal(false);
    } else {
      alert('Erreur lors de la mise à jour');
    }
  } catch (error) {
    console.error('Error updating cadet:', error);
    if (error instanceof ApiError) {
      alert(`Erreur: ${error.message}`);
    } else {
      alert('Erreur lors de la mise à jour');
    }
  }
};
```

---

## Étape 5 : Activer la suppression

Dans la fonction `handleDeleteCadet` :

### Code actuel (avec mock)

```typescript
const handleDeleteCadet = async (cadetId: number) => {
  const cadet = cadets.find(c => c.id === cadetId);
  if (!cadet) return;

  const confirmDelete = confirm(
    `Êtes-vous sûr de vouloir supprimer ${cadet.firstname} ${cadet.lastname} ?`
  );

  if (confirmDelete) {
    try {
      // TODO: Remplacer par l'appel API réel
      // const response = await CadetsApi.deleteCadet(cadetId);

      alert('Cadet supprimé avec succès');
      await fetchCadets();
    } catch (error) {
      console.error('Error deleting cadet:', error);
      alert('Erreur lors de la suppression');
    }
  }
};
```

### Code modifié (avec API réelle)

```typescript
const handleDeleteCadet = async (cadetId: number) => {
  const cadet = cadets.find(c => c.id === cadetId);
  if (!cadet) return;

  const confirmDelete = confirm(
    `Êtes-vous sûr de vouloir supprimer ${cadet.firstname} ${cadet.lastname} ?`
  );

  if (confirmDelete) {
    try {
      // Appel API réel
      const response = await CadetsApi.deleteCadet(cadetId);

      if (response.success) {
        alert('Cadet supprimé avec succès');
        await fetchCadets();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting cadet:', error);
      if (error instanceof ApiError) {
        alert(`Erreur: ${error.message}`);
      } else {
        alert('Erreur lors de la suppression');
      }
    }
  }
};
```

---

## Étape 6 : Vérifier que tout fonctionne

1. **Redémarrez l'application** Expo
2. **Connectez-vous** en tant qu'admin
3. **Allez dans** "Mon Association" > onglet "Cadets"
4. **Vérifiez que** :
   - ✅ Les cadets se chargent depuis l'API
   - ✅ Le changement de rôle fonctionne
   - ✅ La suppression fonctionne
   - ✅ Les erreurs sont affichées correctement

---

## Troubleshooting

### Erreur : "Network request failed"

**Cause :** L'application ne peut pas atteindre l'API

**Solution :**
- Vérifiez que le backend est démarré
- Vérifiez l'URL dans `.env`
- Si vous testez sur mobile/tablette, utilisez l'adresse IP locale (pas `localhost`)

```env
# Sur mobile, utilisez l'IP de votre ordinateur
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000/api
```

### Erreur : "CORS policy"

**Cause :** Le backend bloque les requêtes depuis l'application

**Solution :** Configurez CORS sur votre backend

**Exemple Node.js/Express :**
```javascript
const cors = require('cors');
app.use(cors({
  origin: '*', // En développement
  credentials: true
}));
```

### Les données ne s'affichent pas

**Vérifiez le format de réponse :**
```javascript
// Dans la console du navigateur ou les logs Expo
console.log('Response:', response);
console.log('Cadets:', response.data?.cadets);
```

Le format attendu :
```json
{
  "success": true,
  "data": {
    "cadets": [
      {
        "id": "cadet1",
        "lastname": "Bob",
        "firstname": "Dylan",
        "email": "bob.dylan@gmail.com",
        "status": "Actif",
        "phone": "+33 06 98 76 54 32",
        "phoneParent": "+33 07 99 78 55 33",
        "dateOfBirth": "22/08/2009",
        "role": "Cadet",
        "courseAccess": true
      }
    ],
    "total": 1
  }
}
```

### Problème de conversion de date

Si vous voyez `undefined` pour les dates de naissance :

**Vérifiez le format :** Doit être `DD/MM/YYYY` (ex: `"22/08/2009"`)

Le mapper convertit automatiquement vers `YYYY-MM-DD` pour l'application.

---

## Retour aux données mockées (si besoin)

Si vous devez revenir temporairement aux données mockées :

1. Commentez l'appel API
2. Décommentez le code de simulation

```typescript
const fetchCadets = async () => {
  try {
    setLoadingCadets(true);
    setErrorCadets(null);

    // Version mockée
    await new Promise(resolve => setTimeout(resolve, 300));
    const mockCadets = initialUtilisateurs.filter(
      u => u.role === 'Cadet' || u.role === 'Cadet Breveté' || u.role === 'Ancien Cadet'
    );
    setCadets(mockCadets);

    // Version API (commentée)
    // const response = await CadetsApi.getAllCadets();
    // if (response.success && response.data) {
    //   const cadetsData = mapCadetsArrayToUsers(response.data.cadets);
    //   setCadets(cadetsData);
    // }
  } catch (error) {
    console.error('Error fetching cadets:', error);
    setErrorCadets('Une erreur est survenue');
  } finally {
    setLoadingCadets(false);
  }
};
```
