# Installation des dépendances pour l'upload de fichiers

## Package requis

Pour activer la fonctionnalité d'upload de documents depuis le PC de l'utilisateur, vous devez installer `expo-document-picker`.

### Installation

Exécutez la commande suivante dans le répertoire du projet :

```bash
npx expo install expo-document-picker
```

Ou avec npm :

```bash
npm install expo-document-picker
```

### Vérification de l'installation

Après l'installation, le package devrait apparaître dans votre `package.json` :

```json
{
  "dependencies": {
    "expo-document-picker": "~12.0.2"
  }
}
```

### Redémarrage du serveur

Après l'installation, redémarrez votre serveur de développement :

```bash
npm start
```

## Fonctionnalités activées

Une fois installé, les utilisateurs pourront :
- 📁 Sélectionner des fichiers depuis leur PC/appareil
- 📊 Voir automatiquement le nom, la taille et le type de fichier
- ✅ Upload de tous types de fichiers (PDF, DOCX, XLSX, PPTX, etc.)
- 🔍 Détection automatique du type de fichier basée sur l'extension ou le MIME type

## Documentation

Pour plus d'informations : https://docs.expo.dev/versions/latest/sdk/document-picker/
