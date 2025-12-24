# Exemple d'intégration de l'API dans OrganizationScreen

Voici comment intégrer les appels API pour charger les cadets dans l'écran OrganizationScreen.

## Modifications à apporter dans OrganizationScreen.tsx

### 1. Importer les services API et les mappers

```typescript
// Ajouter ces imports en haut du fichier
import { CadetsApi, ApiError, mapCadetsArrayToUsers } from '../api';
```

### 2. Modifier le state pour gérer le chargement

```typescript
// Remplacer la ligne actuelle :
// const cadets = initialUtilisateurs.filter(u => u.role === 'Cadet' || u.role === 'Cadet Breveté' || u.role === 'Ancien Cadet');

// Par :
const [cadets, setCadets] = useState<UserType[]>([]);
const [loadingCadets, setLoadingCadets] = useState(false);
const [errorCadets, setErrorCadets] = useState<string | null>(null);
```

### 3. Créer une fonction pour charger les cadets

```typescript
// Fonction pour charger les cadets depuis l'API
const fetchCadets = async () => {
  try {
    setLoadingCadets(true);
    setErrorCadets(null);

    // Récupérer les cadets depuis l'API
    const response = await CadetsApi.getAllCadets({
      // Filtrer uniquement les cadets actifs (optionnel)
      status: 'Actif',
    });

    if (response.success && response.data) {
      // Utiliser le mapper pour convertir les données API vers le format User
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

### 4. Charger les cadets au montage du composant

```typescript
// Ajouter ce useEffect
useEffect(() => {
  if (activeTab === 'cadets') {
    fetchCadets();
  }
}, [activeTab]);
```

### 5. Mettre à jour la fonction de sauvegarde

```typescript
// Modifier handleSaveCadetChanges pour appeler l'API
const handleSaveCadetChanges = async () => {
  if (!selectedCadet) return;

  try {
    // Appel API pour mettre à jour le rôle
    const response = await CadetsApi.updateCadetRole(selectedCadet.id, {
      role: cadetRole as 'Cadet' | 'Cadet Breveté' | 'Ancien Cadet',
    });

    if (response.success && response.data) {
      // Mise à jour réussie
      alert(`Modifications enregistrées pour ${selectedCadet.firstname} ${selectedCadet.lastname}\nNouveau rôle : ${cadetRole}`);

      // Recharger la liste des cadets
      await fetchCadets();

      // Fermer la modal
      setShowCadetModal(false);
    }
  } catch (error) {
    console.error('Error updating cadet:', error);
    if (error instanceof ApiError) {
      alert(`Erreur: ${error.message}`);
    } else {
      alert('Une erreur est survenue lors de la mise à jour');
    }
  }
};
```

### 6. Mettre à jour la fonction de suppression

```typescript
// Modifier handleDeleteCadet pour appeler l'API
const handleDeleteCadet = async (cadetId: number) => {
  const cadet = cadets.find(c => c.id === cadetId);
  if (!cadet) return;

  const confirmDelete = confirm(
    `Êtes-vous sûr de vouloir supprimer ${cadet.firstname} ${cadet.lastname} ?`
  );

  if (confirmDelete) {
    try {
      const response = await CadetsApi.deleteCadet(cadetId);

      if (response.success) {
        alert('Cadet supprimé avec succès');

        // Recharger la liste
        await fetchCadets();
      }
    } catch (error) {
      console.error('Error deleting cadet:', error);
      if (error instanceof ApiError) {
        alert(`Erreur: ${error.message}`);
      } else {
        alert('Une erreur est survenue lors de la suppression');
      }
    }
  }
};
```

### 7. Afficher l'état de chargement et les erreurs

```typescript
// Dans le rendu de l'onglet Cadets, ajouter :

{activeTab === 'cadets' && (
  <View style={styles.tabContent}>
    {loadingCadets ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Chargement des cadets...</Text>
      </View>
    ) : errorCadets ? (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errorCadets}</Text>
        <Button onPress={fetchCadets}>
          Réessayer
        </Button>
      </View>
    ) : cadets.length === 0 ? (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Aucun cadet trouvé</Text>
      </View>
    ) : (
      <ScrollView>
        {/* Liste des cadets existante */}
      </ScrollView>
    )}
  </View>
)}
```

### 8. Ajouter les styles nécessaires

```typescript
// Ajouter dans StyleSheet.create():
loadingContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 40,
},
loadingText: {
  marginTop: 16,
  fontSize: 16,
  color: '#64748b',
},
errorContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 40,
},
errorText: {
  fontSize: 16,
  color: '#ef4444',
  textAlign: 'center',
  marginBottom: 16,
},
emptyState: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 40,
},
emptyText: {
  fontSize: 16,
  color: '#94a3b8',
  textAlign: 'center',
},
```

## Version complète de la fonction fetchCadets avec gestion du token

Si vous utilisez l'authentification avec token JWT :

```typescript
const fetchCadets = async () => {
  try {
    setLoadingCadets(true);
    setErrorCadets(null);

    // Récupérer le token depuis le contexte d'authentification
    // const { token } = useAuth(); // Exemple avec un contexte

    const token = 'votre-token-jwt'; // À remplacer

    const response = await CadetsApi.getAllCadets(
      {
        statut: 'Actif', // Optionnel: filtrer uniquement les actifs
      },
      token
    );

    if (response.success && response.data) {
      const cadetsData: UserType[] = response.data.cadets.map(cadet => ({
        id: cadet.id,
        lastname: cadet.lastname,
        firstname: cadet.firstname,
        email: cadet.email,
        role: cadet.role,
        statut: cadet.statut,
        phone: cadet.phone,
        dateOfbirth: cadet.dateOfbirth,
        sexe: cadet.sexe,
        courseAccess: cadet.courseAccess,
      }));

      setCadets(cadetsData);
    }
  } catch (error) {
    console.error('Error fetching cadets:', error);
    if (error instanceof ApiError) {
      setErrorCadets(error.message);

      // Si erreur 401 (non autorisé), rediriger vers login
      if (error.statusCode === 401) {
        // navigation.navigate('Login');
      }
    } else {
      setErrorCadets('Une erreur est survenue');
    }
  } finally {
    setLoadingCadets(false);
  }
};
```

## Test avec les données mockées

Si votre backend n'est pas encore prêt, vous pouvez utiliser les données mockées en attendant :

```typescript
const fetchCadets = async () => {
  try {
    setLoadingCadets(true);
    setErrorCadets(null);

    // TODO: Remplacer par l'appel API réel
    // const response = await CadetsApi.getAllCadets();

    // Version mockée temporaire
    await new Promise(resolve => setTimeout(resolve, 500)); // Simule un délai réseau

    const mockCadets = initialUtilisateurs.filter(
      u => u.role === 'Cadet' || u.role === 'Cadet Breveté' || u.role === 'Ancien Cadet'
    );

    setCadets(mockCadets);
  } catch (error) {
    setErrorCadets('Erreur de chargement');
  } finally {
    setLoadingCadets(false);
  }
};
```

Cette approche vous permet de développer l'interface utilisateur tout en préparant l'intégration de l'API réelle.
