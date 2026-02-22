

# Connexion OAuth - Google + Email/Password

## Contrainte importante
Facebook OAuth **n'est pas supporté** par Lovable Cloud. Les seuls providers OAuth disponibles sont **Google** et **Apple**. Le bouton Facebook sur la landing page et la page login devra etre remplace par un bouton Google.

## Ce qui sera implemente

### 1. Activer Google OAuth
- Utiliser l'outil `configure-social-auth` pour generer le module `src/integrations/lovable/` avec le support Google
- Installer automatiquement le package `@lovable.dev/cloud-auth-js`

### 2. Mettre a jour AuthContext (`src/contexts/AuthContext.tsx`)
- Ajouter une methode `signInWithGoogle` qui appelle `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`
- Exposer cette methode dans le contexte
- Le `onAuthStateChange` existant gerera automatiquement le callback OAuth et construira le `AppUser`

### 3. Mettre a jour la page Login (`src/pages/Login.tsx`)
- Ajouter un bouton "Continuer avec Google" au-dessus des tabs email/password
- Separateur visuel "ou" entre le bouton Google et le formulaire email
- Le bouton appellera `signInWithGoogle()` du contexte
- Apres connexion, le `ProtectedRoute` redirigera automatiquement :
  - Vers `/onboarding` si pas de store associe (nouvel utilisateur)
  - Vers `/dashboard` si profil existant

### 4. Mettre a jour la landing page (`src/components/landing/HeroSection.tsx`)
- Remplacer le bouton "Commencer avec Facebook" (#1877F2) par un bouton "Commencer avec Google" avec les couleurs Google
- Le bouton declenchera directement `signInWithGoogle()` au lieu de naviguer vers `/login`

### 5. Recuperation du profil utilisateur
- Deja gere : `buildAppUser()` dans AuthContext extrait `full_name`, `name`, `avatar_url` depuis `user_metadata` (rempli automatiquement par Google OAuth)
- Deja gere : le trigger `handle_new_store` cree le profil en base lors de la creation du store pendant l'onboarding

## Details techniques

### Fichiers modifies
| Fichier | Modification |
|---------|-------------|
| `src/contexts/AuthContext.tsx` | Ajout de `signInWithGoogle` utilisant `lovable.auth.signInWithOAuth` |
| `src/pages/Login.tsx` | Bouton Google + separateur "ou" |
| `src/components/landing/HeroSection.tsx` | Remplacement bouton Facebook par Google |

### Flux utilisateur
```text
Clic "Google" -> OAuth Google -> Callback -> onAuthStateChange
  -> buildAppUser() verifie user_roles
    -> Si store existe : has_completed_onboarding = true -> /dashboard
    -> Si pas de store : has_completed_onboarding = false -> /onboarding
```

### Aucune migration necessaire
La table `profiles` existante contient deja les colonnes necessaires (name, email, avatar_url). Les colonnes `facebook_id` et `google_id` ne sont pas strictement necessaires car l'identite est geree par le systeme d'authentification de Lovable Cloud.

