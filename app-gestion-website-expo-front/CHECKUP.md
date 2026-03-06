# Checkup — React Native / Expo / TypeScript
> Généré le 2026-03-04. Priorités : 🔴 Critique · 🟠 Important · 🟡 Mineur · ✅ Corrigé

---

## 1. Architecture & Fichiers parasites

### 🔴 Fichiers de backup dans le dépôt

Les fichiers suivants ne doivent pas exister dans le repo (risque de confusion, poids inutile) :

- `src/screens/OrganizationScreen.backup-20260123_163200.tsx`
- `src/screens/OrganizationScreen.tsx.backup`
- `src/screens/OrganizationScreen_PART1.txt`
- `src/screens/OrganizationScreen_PART2.txt`

**Action** : les supprimer et utiliser Git (`git stash`, branches) pour sauvegarder du travail en cours.

---

### ✅ ~~Double définition du type `User`~~

> Corrigé : `tokenStorage.ts` importe désormais `User` depuis `../types` — la double définition est supprimée.

---

### ✅ ~~`User.role: UserRole | string` — union type bancale~~

> Corrigé : `src/types/index.ts:72` — `role` est maintenant typé `UserRole` strictement.

---

### ✅ ~~`mockData.ts` couplé à la navigation de production~~

> Corrigé : `AppNavigator.tsx` importe `menuItems` depuis `./menuItems` (fichier dédié).

---

## 2. TypeScript — Typage strict

### ✅ ~~`catch (error: any)` dans le cœur de l'API~~

> Corrigé : `apiRequest.ts:234` utilise maintenant `catch (error: unknown)` avec des guards `instanceof`.

---

### ✅ ~~`body?: any` dans le helper `api.post`~~

> Corrigé : `apiRequest.ts:266` — `body` est typé `Record<string, unknown> | FormData`.

---

### ✅ ~~`navigationRef` typé `any`~~

> Corrigé : `AppNavigator.tsx:42` utilise maintenant `React.useRef<NavigationContainerRef<RootStackParamList>>(null)`.

---

### ✅ ~~`initialRouteName as any`~~

> Corrigé : `AppNavigator.tsx:145` — cast remplacé par `as keyof RootStackParamList`.

---

### 🟡 `: any` dispersé dans les écrans (71 occurrences)

71 occurrences de `: any` dans les fichiers `.tsx`. Chaque occurrence est un trou dans la sécurité de type. Priorité aux fichiers avec le plus de cas : `OrganizationScreen.tsx`, `CandidatDocumentsScreen.tsx`, `DocumentsScreen.tsx`.

---

## 3. Performance & React

### 🔴 Timer de Toast non nettoyé → fuite mémoire / comportement erratique

`src/contexts/ToastContext.tsx:79`

```ts
setTimeout(hideToast, 3000);
```

Ce `setTimeout` n'est jamais annulé. Si `show()` est appelé plusieurs fois rapidement, les timers s'accumulent et ferment le toast prématurément. Corriger :

```ts
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const show = useCallback((message: string, type: ToastType) => {
  if (timerRef.current) clearTimeout(timerRef.current);
  // ... animation ...
  timerRef.current = setTimeout(hideToast, 3000);
}, [hideToast, opacity, translateY]);
```

---

### 🟠 `Promise.all` manquant dans `tokenStorage`

`src/api/tokenStorage.ts:87-95` et `101-105`

Les opérations de stockage sont séquentielles alors qu'elles sont indépendantes :

```ts
// Avant (lent — 3 opérations séquentielles)
await secureStorage.setItem(TOKEN_KEYS.ACCESS, tokens.accessToken);
await secureStorage.setItem(TOKEN_KEYS.REFRESH, tokens.refreshToken);
await secureStorage.setItem(TOKEN_KEYS.EXPIRES, tokens.expiresAt);

// Après (parallèle)
await Promise.all([
  secureStorage.setItem(TOKEN_KEYS.ACCESS, tokens.accessToken),
  secureStorage.setItem(TOKEN_KEYS.REFRESH, tokens.refreshToken),
  secureStorage.setItem(TOKEN_KEYS.EXPIRES, tokens.expiresAt),
]);
```

Même chose pour `clearTokens`.

---

### 🟠 Import inutilisé : `PanResponder`

`src/navigation/AppNavigator.tsx:9`

```ts
import { ..., PanResponder } from "react-native";
```

`PanResponder` est importé mais jamais utilisé. À supprimer.

---

### 🟠 Durée d'animation sidebar excessive

`src/navigation/AppNavigator.tsx:76`

```ts
duration: 500,
```

500ms est perceptiblement lent sur mobile. La convention UX pour ce type de drawer est 200-300ms.

---

### 🟠 Largeur sidebar `280` hardcodée à 4 endroits

`src/navigation/AppNavigator.tsx` : lignes 43, 44, 221, 222 + `styles.mobileSidebar`

Extraire en constante :

```ts
const SIDEBAR_WIDTH = 280;
```

---

### 🟡 `handleLogin` non mémorisé

`App.tsx:30`

```ts
const handleLogin = (user: User) => { ... };
```

Contrairement à `handleLogout` (qui utilise `useCallback`), `handleLogin` est recréé à chaque render. Wraper avec `useCallback`.

---

### 🟡 `useCallback` / `useMemo` sous-utilisés dans les écrans

Seulement 9 fichiers utilisent `useCallback` ou `useMemo`. Les écrans complexes comme `OrganizationScreen.tsx` et `DocumentsScreen.tsx` ont probablement des handlers (`onPress`, `onChange`) définis inline qui causent des re-renders inutiles sur les listes.

---

## 4. Authentification & Session

### 🔴 Pas de restauration de session au démarrage

`App.tsx` démarre toujours sur l'écran de login (`isAuthenticated = false`). Si l'utilisateur a des tokens valides en `SecureStore`, il doit quand même se reconnecter à chaque lancement de l'app.

**Solution** : au montage de `AppContent`, vérifier `tokenStorage.isAuthenticated()` et `tokenStorage.getUser()` pour restaurer la session silencieusement, avec un écran de splash pendant ce check.

```ts
useEffect(() => {
  const restoreSession = async () => {
    const isAuth = await tokenStorage.isAuthenticated();
    const user = await tokenStorage.getUser();
    if (isAuth && user) handleLogin(user as User);
    setIsLoading(false);
  };
  restoreSession();
}, []);
```

---

### 🟠 `StatusBar` dupliqué dans chaque branche

`App.tsx:80,93,105,118,130`

`<StatusBar style="light" />` est répété dans chaque branche conditionnelle. Le déplacer à la racine dans `App()` ou dans `AppContent` une seule fois.

---

### 🟡 `authScreen === "signup"` — route morte

`App.tsx:85-95` : la route `"signup"` affiche `<SignScreen>` mais aucun bouton dans `LoginScreen` n'appelle `onNavigateToSign`. Elle n'est donc jamais accessible. Supprimer ou connecter.

---

## 5. Dépendances

### 🟠 `react-simple-image-viewer` — bibliothèque web-only

`package.json:37`

```json
"react-simple-image-viewer": "^1.2.2"
```

Cette bibliothèque utilise du DOM HTML. Elle ne fonctionne pas sur iOS/Android nativement. Remplacer par `react-native-image-viewing` (natif) ou utiliser `expo-image` avec un modal custom.

---

### 🟠 `events` — polyfill Node.js potentiellement inutile

```json
"events": "^3.3.0"
```

`authEventEmitter.ts` utilise-t-il vraiment le module Node `events` ? Si c'est un simple pattern publish/subscribe, une implémentation légère maison ou `mitt` (~200 bytes) suffit.

---

### 🟡 `dripsy` + `nativewind` — deux systèmes de style en conflit

Le projet utilise simultanément `dripsy` (sx props, ThemeProvider) et `nativewind` (className Tailwind). Cela augmente la surface d'API, le bundle size, et crée de l'incohérence. Choisir **un seul** système de style.

---

### 🟡 `react-native: 0.81.4` + `react: 19.1.0`

React 19 avec RN 0.81 peut avoir des incompatibilités non documentées selon la version d'Expo. Vérifier que `expo@54` supporte officiellement React 19.

---

## 6. Qualité du code

### 🔴 365 `console.log/warn/error` en production

**365 occurrences** dans 43 fichiers de production (hors backups). Les logs de debug ne doivent pas apparaître en prod. Options :

1. Configurer un wrapper de logger qui respecte `__DEV__`
2. Utiliser `babel-plugin-transform-remove-console` en build release
3. Remplacer les logs utiles par un service de monitoring (Sentry, etc.)

---

### 🟠 `ToastContext.tsx:29` — import `React` manquant

```ts
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ...
```

`React` est utilisé comme namespace mais n'est pas importé explicitement. Cela fonctionne avec la nouvelle JSX transform mais reste une ambiguïté. Ajouter `import React from "react"` ou remplacer par `import { FC } from "react"`.

---

### 🟡 TODO non résolus dans le code navigué

- `AppNavigator.tsx:97` — `handleProfile` → `console.log("Navigate to profile")` (TODO commenté)
- `DashboardScreen`, `useNews`, `useTrainings` — données mockées non connectées à l'API
- Plusieurs hooks `association/` ont des TODOs non documentés

Créer des issues GitHub pour chaque TODO ou les supprimer si la feature est abandonnée.

---

### 🟡 `tsconfig.json` — chemin `@/*` pointe vers la racine

```json
"paths": { "@/*": ["./*"] }
```

Cela implique `@/src/...` au lieu du plus conventionnel `@/...`. Envisager `"@/*": ["./src/*"]` et mettre à jour les imports pour plus de lisibilité.

---

## 7. Sécurité

### 🟠 URL API locale dans `.env` committé

`.env` contient :
```
EXPO_PUBLIC_API_URL=http://192.168.1.35:3333/api/v1
```

L'adresse IP locale ne doit pas être committée. Ajouter `.env` au `.gitignore` et fournir un `.env.example`.

---

### 🟡 Validation côté client des fichiers uploadés absente

`AddDocumentModal.tsx` — aucune vérification de type MIME ou de taille avant upload. Ajouter une validation frontend (taille max, extensions autorisées) en complément de la validation serveur.

---

## 8. Tests

### 🟠 Couverture quasi-nulle

Un seul fichier de test trouvé : `src/utils/__tests__/slug.test.ts`.

Priorités de tests à ajouter :
1. `tokenStorage` — logique d'expiration et de stockage
2. `apiRequest` — retry, refresh token, gestion d'erreurs
3. Hooks custom : `useDocuments`, `useFolders`
4. Utilitaires : `permissions.ts`, `roleUtils.ts`

---

## 9. Récapitulatif par priorité

| Priorité | Item | Fichier |
|---|---|---|
| 🔴 | Restaurer la session au démarrage | `App.tsx` |
| 🔴 | Timer Toast non nettoyé | `ToastContext.tsx:79` |
| 🔴 | 365 console.log en prod | 43 fichiers |
| 🟠 | `Promise.all` dans tokenStorage | `tokenStorage.ts:87,101` |
| 🟠 | `react-simple-image-viewer` web-only | `package.json` |
| 🟠 | URL API dans `.env` committé | `.env` |
| 🟠 | Aucun test significatif | — |
| 🟡 | Supprimer fichiers `.backup` et `.txt` | `src/screens/` |
| 🟡 | `StatusBar` dupliqué | `App.tsx` |
| 🟡 | `dripsy` + `nativewind` en double | `package.json` |
| 🟡 | `PanResponder` importé non utilisé | `AppNavigator.tsx:9` |
| 🟡 | Durée animation sidebar 500ms | `AppNavigator.tsx:76` |
| 🟡 | TODO non résolus | Multiple fichiers |
| ✅ | ~~Double type `User`~~ | `tokenStorage.ts` → `types/index.ts` |
| ✅ | ~~`User.role: UserRole \| string`~~ | `types/index.ts:72` |
| ✅ | ~~`mockData` dans la navigation~~ | `AppNavigator.tsx:24` |
| ✅ | ~~`catch (error: any)`~~ | `apiRequest.ts:234` |
| ✅ | ~~`api.post body: any`~~ | `apiRequest.ts:266` |
| ✅ | ~~`install-vibrancy.sh` dans le repo~~ | supprimé |
| ✅ | ~~`navigationRef: any`~~ | `AppNavigator.tsx:42` |
| ✅ | ~~`initialRouteName as any`~~ | `AppNavigator.tsx:145` |
