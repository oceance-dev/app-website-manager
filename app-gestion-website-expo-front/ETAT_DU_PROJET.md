# État du Projet — CadetApp Frontend

> Application mobile/web Expo (React Native + TypeScript) pour la gestion des associations de cadets.
> Date de rédaction : 21 février 2026

---

## Stack Technique

| Technologie | Version | Rôle |
|---|---|---|
| React | 19.1.0 | UI framework |
| Expo | 54.0.13 | Build cross-platform (iOS, Android, Web) |
| React Native | 0.81.4 | UI natif |
| TypeScript | 5.9.2 | Typage statique |
| React Navigation | 7.x | Routing et navigation |
| NativeWind / TailwindCSS | 4.x / 3.x | Styling utilitaire |
| Dripsy | 4.x | Thème global |
| Lucide React Native | 0.546 | Icônes |
| Expo Secure Store | 15.x | Stockage sécurisé des tokens |
| AsyncStorage | 2.x | Stockage local |
| expo-document-picker | 14.x | Sélection de fichiers |

---

## Structure du Projet

```
src/
├── api/            # Couche d'intégration API (services)
├── components/     # Composants UI réutilisables (37 fichiers)
├── contexts/       # React Context (ToastContext)
├── data/           # Données mock
├── features/       # Modules fonctionnels (dashboard, documents, association)
├── lib/            # Bibliothèques utilitaires
├── navigation/     # Configuration de navigation + sidebar
├── screens/        # 17 écrans de l'application
├── styles/         # Styles globaux
├── theme/          # Configuration du thème
├── types/          # Définitions TypeScript
└── utils/          # Fonctions utilitaires (responsive, etc.)
```

---

## Étapes Réalisées

### Étape 1 — Infrastructure & Architecture
- [x] Initialisation du projet Expo avec TypeScript
- [x] Configuration TailwindCSS/NativeWind
- [x] Mise en place du thème global avec Dripsy
- [x] Configuration Babel, tsconfig, EAS Build
- [x] Variables d'environnement (`EXPO_PUBLIC_API_URL`)
- [x] Système de path aliases (`@/*`)

### Étape 2 — Authentification
- [x] Écran de connexion (`LoginScreen`) avec email/mot de passe
- [x] Inscription association (`OrganizationSignupScreen`)
- [x] Inscription membre d'association (`MemberSignupScreen`)
- [x] Inscription candidat (`CandidatSignupScreen`)
- [x] Stockage sécurisé des tokens (Secure Store + AsyncStorage)
- [x] Rafraîchissement automatique du token (mécanisme de retry + file d'attente)
- [x] Gestion des sessions expirées via event emitter global
- [x] Appel API de déconnexion (`/auth/logout`, `/auth/logout-all`)

### Étape 3 — Navigation & Layout
- [x] Navigation par stack (React Navigation)
- [x] Sidebar animée avec filtrage par rôle utilisateur
- [x] Utilitaires responsive (mobile / tablette / web)
- [x] SafeArea et gestion des écrans natifs

### Étape 4 — Couche API
- [x] Client API central avec timeout (10 s) et gestion d'erreurs (`ApiError`)
- [x] Service authentification (`auth.api.ts`)
- [x] Service utilisateurs (`users.api.ts`)
- [x] Service associations (`associations.api.ts`)
- [x] Service documents (`documents.api.ts`)
- [x] Service dossiers (`folders.api.ts`)
- [x] Service pièces justificatives requises (`document-requirements.api.ts`)
- [x] Service candidats (`candidats.api.ts`)
- [x] Service rôles et permissions (`roles.api.ts`)
- [x] **Total : 50+ endpoints mappés et intégrés**

### Étape 5 — Gestion des Documents
- [x] Écran documents avec organisation par dossiers
- [x] CRUD complet (upload, téléchargement, modification, suppression)
- [x] Gestion des permissions par document et par dossier
- [x] Modale de visualisation de documents (images, PDF)
- [x] Déplacement de documents entre dossiers
- [x] Gestion des membres d'un dossier (ajout, modification permissions, suppression)
- [x] Context menu pour les actions rapides
- [x] Séparation documents personnels / documents d'association

### Étape 6 — Gestion de l'Organisation (Admin)
- [x] Écran organisation multi-onglets (`OrganizationScreen`, ~5 600 lignes)
  - **Onglet Association** — Affichage et édition des infos (nom, adresse, SIRET, email, téléphone)
  - **Onglet Pièces requises** — Définition et gestion des documents requis pour les candidats
  - **Onglet Demandes d'inscription** — Visualisation et traitement des candidatures
  - **Onglet Membres** — Gestion des membres avec workflow approbation/rejet
  - **Onglet Cadets** — Gestion des cadets actifs et attribution de rôles
- [x] Approbation/rejet de membres avec sélection de rôle
- [x] Planification de rendez-vous pour les candidats
- [x] Visualisation du statut de complétion des dossiers candidats

### Étape 7 — Tableau de Bord
- [x] Dashboard principal (`DashboardScreen`) — Calendrier d'entraînements + actualités + message d'accueil
- [x] Dashboard Super Admin (`SuperAdminDashboardScreen`) — Statistiques globales, gestion des associations, utilisateurs, rôles
- [x] Dashboard Candidat (`CandidatDashboardScreen`) — Infos personnelles, liste des documents à fournir, taux de complétion, bouton de soumission

### Étape 8 — Gestion des Candidats
- [x] Écran documents candidat (`CandidatDocumentsScreen`)
- [x] Upload des pièces justificatives personnelles
- [x] Suivi de la complétion du dossier
- [x] Vérification de l'éligibilité à la soumission
- [x] Remplacement d'un document existant

### Étape 9 — Rôles & Permissions
- [x] Récupération des rôles disponibles et assignables
- [x] Gestion des permissions par rôle (Super Admin)
- [x] Filtrage des menus et écrans selon le rôle connecté
- [x] Attribution de rôle lors de l'approbation d'un membre

### Étape 10 — Composants UI & Expérience Utilisateur
- [x] 37 composants réutilisables (Cards, Badges, Modales, Boutons, Inputs…)
- [x] Système de notifications Toast (`ToastContext`)
- [x] Prévention de capture d'écran (`expo-screen-capture`)
- [x] Sélecteur de date/heure natif
- [x] Dropdown picker

### Étape 11 — Documentation
- [x] `README.md` — Vue d'ensemble de l'API
- [x] `CANDIDATS_API_SPEC.md` — Spécification complète de l'API candidats
- [x] `ACTIVATION_GUIDE.md` — Guide d'activation de l'intégration API
- [x] `INTEGRATION_EXAMPLE.md` — Patterns d'intégration avec exemples
- [x] `EXAMPLES_DATA.md` — Exemples de données
- [x] `CORS_FIX.md` — Configuration CORS
- [x] `INSTALL_DEPENDENCIES.md` — Instructions d'installation
- [x] `MODIFICATIONS_ORGANIZATION_SCREEN.md` — Changelog de l'écran organisation

---

## En Cours / Partiellement Implémenté

| Fonctionnalité | État | Notes |
|---|---|---|
| Actualités (News) | Données mock | Hook `useNews` existe, appelle des données statiques. Intégration API à brancher. |
| Cours (`CoursesScreen`) | Écran de base | Filtrage par permissions fonctionnel, `TODO: open document` dans le code |
| Pièces requises (Organisation) | API intégrée | Hooks et composants créés, intégration dans l'écran organisation |

---

## Non Implémenté / À Faire

| Fonctionnalité | Priorité | Notes |
|---|---|---|
| Intégration API actualités | Haute | Structure prête, mock à remplacer |
| Écran détail d'une actualité | Moyenne | Navigation vers le détail non implémentée |
| Écran détail d'un événement d'entraînement | Moyenne | — |
| Navigation vers profil utilisateur | Basse | TODO noté dans le code |
| Confirmation par email à l'inscription | Basse | Mentionné dans les specs |
| Validation complète de tous les formulaires | Basse | Partielle sur certains écrans |
| Rate limiting côté client | Basse | Mentionné dans docs |
| Refactoring OrganizationScreen | — | 5 600 lignes → à découper en sous-composants |

---

## Points d'Attention

- **OrganizationScreen** fait ~5 600 lignes : il devrait être découpé en plusieurs sous-composants/écrans pour rester maintenable.
- Un fichier de backup est présent : `OrganizationScreen.backup-20260123` — à nettoyer.
- Quelques `TODO` restent dans le code source (navigation profil, ouverture de documents dans Courses).
- Les données mock dans `src/data/` doivent être progressivement remplacées par les appels API réels.

---

## Avancement Global

| Domaine | Complétion estimée |
|---|---|
| Infrastructure & Config | 100% |
| Authentification | 100% |
| Couche API | 95% |
| Navigation | 90% |
| Gestion Documents | 90% |
| Gestion Organisation (Admin) | 85% |
| Tableaux de Bord | 80% |
| Gestion Candidats | 85% |
| Actualités / News | 20% |
| Cours | 40% |
| UI / Composants | 85% |

**Avancement global estimé : ~85%**

---

## Feuille de Route — Recréer le Projet from Scratch

> Phases ordonnées pour reconstruire CadetApp dans les meilleures conditions.
> Chaque phase est indépendante et livrable séparément.

---

### Phase 1 — Initialisation & Socle Technique
**Objectif : projet qui tourne et qui est prêt à accueillir du code.**

- [ ] `npx create-expo-app@latest cadetapp --template blank-typescript`
- [ ] Installer et configurer NativeWind 4 + TailwindCSS 3
- [ ] Installer et configurer Dripsy (thème global, couleurs, typographie)
- [ ] Configurer les path aliases `@/*` dans `tsconfig.json` et `babel.config.js`
- [ ] Créer la structure de dossiers : `src/api`, `src/components`, `src/contexts`, `src/features`, `src/navigation`, `src/screens`, `src/types`, `src/utils`
- [ ] Créer le fichier `.env` avec `EXPO_PUBLIC_API_URL`
- [ ] Configurer `eas.json` pour les builds EAS
- [ ] Vérifier que l'app démarre sur iOS, Android et Web (`npx expo start`)

**Dépendances clés à installer :**
```bash
npx expo install expo-secure-store @react-native-async-storage/async-storage
npx expo install expo-document-picker expo-screen-capture
npx expo install @react-native-community/datetimepicker @react-native-picker/picker
npx expo install react-native-svg react-native-screens react-native-safe-area-context
npm install lucide-react-native clsx tailwind-merge class-variance-authority
npm install @react-navigation/native @react-navigation/native-stack
```

---

### Phase 2 — Thème, Composants de Base & Design System
**Objectif : bibliothèque de composants réutilisables avant d'écrire les écrans.**

- [ ] Définir les couleurs, espacements et rayons dans `tailwind.config.js`
- [ ] Créer les composants atomiques :
  - `Button` (variantes : primary, secondary, danger, ghost)
  - `Input` (avec label, message d'erreur, icône)
  - `Badge` (statuts : actif, en attente, suspendu, rejeté)
  - `Card` / `CardHeader` / `CardContent`
  - `Modal` (wrapper générique avec backdrop)
  - `Avatar` (initiales ou image)
  - `Spinner` / `LoadingOverlay`
- [ ] Créer le `ToastContext` + composant `Toast` (succès, erreur, info)
- [ ] Créer les utilitaires responsive (`isMobile`, `isTablet`, `isWeb`) dans `src/utils/responsive.ts`
- [ ] Tester tous les composants sur une page de démo

---

### Phase 3 — Couche API & Gestion des Tokens
**Objectif : infrastructure réseau robuste avant toute intégration d'écran.**

- [ ] Créer `src/api/config.ts` — client API de base avec :
  - URL de base depuis `EXPO_PUBLIC_API_URL`
  - Timeout à 10 s
  - Headers `Authorization: Bearer <token>` automatiques
  - Classe `ApiError` avec code HTTP et message
- [ ] Créer `src/lib/authEvents.ts` — event emitter pour les sessions expirées
- [ ] Créer le mécanisme de refresh token :
  - Intercepteur sur les 401
  - File d'attente des requêtes en cours pendant le refresh
  - Émission d'un événement `SESSION_EXPIRED` si le refresh échoue
- [ ] Créer `src/api/auth.api.ts` — login, logout, logout-all, refresh, me
- [ ] Créer `src/api/users.api.ts` — me, update, change-password
- [ ] Créer `src/api/associations.api.ts`
- [ ] Créer `src/api/documents.api.ts` + `src/api/folders.api.ts`
- [ ] Créer `src/api/document-requirements.api.ts`
- [ ] Créer `src/api/candidats.api.ts`
- [ ] Créer `src/api/roles.api.ts`
- [ ] Tester chaque service avec un outil REST (Postman, Insomnia)

---

### Phase 4 — Authentification & Gestion de Session
**Objectif : flux complet de connexion/déconnexion avec persistance.**

- [ ] Créer `src/utils/token.ts` — helpers read/write/clear (AsyncStorage + SecureStore)
- [ ] Créer `src/screens/LoginScreen.tsx` — formulaire email/mot de passe
- [ ] Créer `src/screens/OrganizationSignupScreen.tsx` — inscription association
- [ ] Créer `src/screens/MemberSignupScreen.tsx` — inscription membre (avec liste des associations)
- [ ] Créer `src/screens/CandidatSignupScreen.tsx` — inscription candidat
- [ ] Brancher la déconnexion sur l'event `SESSION_EXPIRED`
- [ ] Protéger les routes (redirect si non connecté)
- [ ] Tester les cas limites : token expiré, refresh expiré, déconnexion simultanée

---

### Phase 5 — Navigation & Sidebar
**Objectif : structure de navigation complète avec contrôle par rôle.**

- [ ] Créer `src/navigation/AppNavigator.tsx` — stack racine (Auth / App)
- [ ] Créer `src/navigation/AuthNavigator.tsx` — stack des écrans non connectés
- [ ] Créer `src/navigation/MainNavigator.tsx` — stack des écrans connectés
- [ ] Créer `src/navigation/Sidebar.tsx` — menu latéral animé avec :
  - Items filtrés selon le rôle (`SUPER_ADMIN`, `ADMIN`, `MEMBER`, `CANDIDAT`)
  - Animation d'ouverture/fermeture
  - Bouton de déconnexion
- [ ] Définir la liste des routes et leurs rôles autorisés dans `src/navigation/routes.ts`
- [ ] Tester la navigation sur web et mobile

---

### Phase 6 — Tableaux de Bord
**Objectif : premiers vrais écrans connectés à l'API.**

- [ ] `DashboardScreen` — accueil membre/admin
  - Composant `TrainingCalendar` (calendrier d'entraînements)
  - Composant `NewsFeed` (liste des actualités — données mock dans un premier temps)
  - Message de bienvenue avec nom de l'association
- [ ] `CandidatDashboardScreen` — accueil candidat
  - Infos personnelles
  - Checklist des documents requis avec taux de complétion
  - Bouton « Soumettre ma candidature » (conditionnel)
- [ ] `SuperAdminDashboardScreen` — accueil super admin
  - Onglet Statistiques (associations actives/inactives, utilisateurs)
  - Onglet Associations (liste + actions : approuver, rejeter, suspendre)
  - Onglet Utilisateurs
  - Onglet Rôles

---

### Phase 7 — Gestion des Documents
**Objectif : module complet upload/téléchargement/organisation.**

- [ ] `DocumentsScreen` avec navigation par dossiers
- [ ] CRUD documents : upload (`expo-document-picker`), renommer, supprimer, télécharger
- [ ] CRUD dossiers : créer, renommer, supprimer, déplacer
- [ ] Gestion des membres d'un dossier (permissions : lecture / écriture)
- [ ] Modale de visualisation (`DocumentViewerModal`) — images et PDF
- [ ] Context menu (appui long ou bouton `…`) pour actions rapides
- [ ] Séparation visuelle documents personnels / documents d'association
- [ ] `CoursesScreen` — documents pédagogiques filtrés par rôle

---

### Phase 8 — Gestion de l'Organisation (Admin)
**Objectif : écran admin complet découpé en composants depuis le début.**

> Ne pas reproduire un fichier de 5 600 lignes. Créer un composant par onglet dès le départ.

- [ ] `OrganizationScreen` — conteneur avec onglets
- [ ] `tabs/AssociationInfoTab.tsx` — infos et édition de l'association
- [ ] `tabs/DocumentRequirementsTab.tsx` — liste et gestion des pièces requises
- [ ] `tabs/RegistrationRequestsTab.tsx` — demandes d'inscription candidats (approve/reject, planifier RDV)
- [ ] `tabs/MembersTab.tsx` — membres actifs avec approbation/rejet et sélection de rôle
- [ ] `tabs/CadetsTab.tsx` — cadets actifs et attribution de rôles
- [ ] Composants partagés : `MemberCard`, `CandidatCard`, `StatusBadge`, `RoleSelector`

---

### Phase 9 — Gestion des Candidats
**Objectif : flux complet de dépôt et suivi de dossier pour un candidat.**

- [ ] `CandidatDocumentsScreen` — liste des pièces requises avec statut par document
- [ ] Upload d'un document (avec sélection du type)
- [ ] Remplacement d'un document existant
- [ ] Téléchargement et visualisation d'un document déposé
- [ ] Suppression d'un document
- [ ] Indicateur de complétion global (`X/Y documents fournis`)
- [ ] Vérification et affichage de l'éligibilité à la soumission
- [ ] Bouton « Soumettre » avec confirmation

---

### Phase 10 — Paramètres & Profil Utilisateur
**Objectif : écrans secondaires mais indispensables.**

- [ ] `SettingsScreen` — préférences notifications, mode sombre, déconnexion
- [ ] `ProfileScreen` — affichage et édition des infos personnelles
- [ ] Modale de changement de mot de passe
- [ ] Navigation correcte vers le profil depuis la sidebar

---

### Phase 11 — Finalisation & Qualité
**Objectif : polish, robustesse et déploiement.**

- [ ] Brancher l'API actualités réelle (remplacer les données mock)
- [ ] Ajouter les écrans de détail manquants (détail actualité, détail événement)
- [ ] Compléter la validation des formulaires (tous les champs obligatoires, formats)
- [ ] Revue des TODO restants dans le code source
- [ ] Tests manuels complets sur iOS, Android et Web
- [ ] Configurer EAS Update pour les mises à jour OTA
- [ ] Build de production (`eas build --platform all`)
- [ ] Nettoyer les fichiers inutiles (backups, données mock non utilisées)

---

### Récapitulatif des Phases

| Phase | Contenu | Dépend de |
|---|---|---|
| 1 | Init & socle | — |
| 2 | Design system & composants | 1 |
| 3 | Couche API & tokens | 1 |
| 4 | Authentification | 2, 3 |
| 5 | Navigation & sidebar | 4 |
| 6 | Tableaux de bord | 3, 5 |
| 7 | Gestion documents | 3, 5 |
| 8 | Gestion organisation | 3, 5, 7 |
| 9 | Gestion candidats | 3, 5, 8 |
| 10 | Paramètres & profil | 4, 5 |
| 11 | Finalisation | Toutes |
