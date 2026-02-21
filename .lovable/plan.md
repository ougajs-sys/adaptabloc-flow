

# Ajout de l'authentification Facebook (simulee en local)

## Objectif

Creer une page de connexion (`/login`) avec **Facebook comme methode principale**, plus Google et email/password en secondaire. Le tout reste en local (mock) -- aucune connexion Supabase pour l'instant.

## Principes appliques

- **Simplicite absolue** : un seul bouton principal visible (Facebook), textes clairs sans jargon
- **Local-first** : l'utilisateur connecte est stocke en `localStorage`, pas de vrai OAuth
- **Coherence** : le contexte utilisateur est disponible partout dans l'app via un `AuthContext`

---

## Fichiers a creer

### 1. `src/lib/auth-store.ts` -- Donnees utilisateur mock
- Type `User` : id, name, email, avatar_url, facebook_id, google_id, provider, sector, role
- Fonctions `saveUser()`, `getUser()`, `clearUser()` via `localStorage`
- Fonction `mockFacebookLogin()` qui simule une connexion Facebook (retourne un utilisateur mock avec nom, photo, facebook_id)
- Fonction `mockGoogleLogin()` et `mockEmailLogin(email, password)`

### 2. `src/contexts/AuthContext.tsx` -- Contexte d'authentification
- Expose `user`, `isAuthenticated`, `login(provider)`, `logout()`
- Charge l'utilisateur depuis `localStorage` au demarrage
- Redirige vers `/login` si non connecte (pour les pages dashboard)

### 3. `src/pages/Login.tsx` -- Page de connexion
- **Bouton principal** : "Continuer avec Facebook" (bleu #1877F2, icone Facebook, grande taille)
- **Bouton secondaire** : "Continuer avec Google"
- **Option tertiaire** : formulaire email/password repliable
- Apres connexion : redirection vers `/onboarding` (premier login) ou `/dashboard` (utilisateur existant)
- Design epure, logo EasyFlow en haut, texte d'accroche simple

---

## Fichiers a modifier

### 4. `src/App.tsx`
- Ajouter `AuthProvider` autour de l'app
- Ajouter la route `/login` vers `Login`

### 5. `src/components/landing/Navbar.tsx`
- Le bouton "Se connecter" pointe deja vers `/login` -- OK
- Remplacer "Essai gratuit" par "Commencer avec Facebook" (bouton bleu Facebook) sur desktop
- Garder "Essai gratuit" en lien secondaire sur mobile

### 6. `src/components/landing/HeroSection.tsx`
- Bouton principal : "Commencer avec Facebook" (bleu #1877F2) au lieu de "Demarrer gratuitement"
- Garder "Voir la demo" en secondaire

### 7. `src/components/landing/CTASection.tsx`
- Bouton principal : "Commencer avec Facebook"

### 8. `src/components/dashboard/DashboardSidebar.tsx`
- Afficher le nom et avatar de l'utilisateur connecte en bas de la sidebar
- Bouton de deconnexion

---

## Details techniques

### Icone Facebook
- Utiliser une icone SVG Facebook inline (lucide-react n'a pas d'icone Facebook)
- Couleur du bouton : `#1877F2` (bleu officiel Facebook)

### Flux de connexion simule
1. L'utilisateur clique "Continuer avec Facebook"
2. Un delai de 800ms simule l'appel OAuth
3. Un utilisateur mock est cree avec nom/photo/facebook_id
4. Stockage dans `localStorage`
5. Redirection vers `/onboarding` ou `/dashboard`

### Protection des routes
- Les routes `/dashboard/*` verifient `isAuthenticated`
- Si non connecte, redirection vers `/login`
- Les routes publiques (`/`, `/login`, `/onboarding`) restent accessibles

