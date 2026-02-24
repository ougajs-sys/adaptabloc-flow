
Objectif: rendre l’accès admin réellement trouvable et fiable, puis éliminer les faux signaux d’erreur qui donnent l’impression que l’espace est “inaccessible”.

Constat après analyse approfondie
1) Les routes admin existent et fonctionnent déjà techniquement:
- `/admin/login` charge bien la page “Intramate HQ”.
- `/admin` redirige vers le login admin si l’utilisateur n’est pas authentifié/autorisé.
- L’espace admin est atteignable et la sidebar s’affiche correctement (capture validée).

2) Le vrai problème est la découvrabilité du chemin:
- Sur la landing (`/`), aucun lien visible vers l’accès équipe.
- Le bouton “Se connecter” pointe vers `/login` (espace client), donc un admin ne voit pas naturellement le bon point d’entrée.

3) Un bruit technique renforce l’impression de panne:
- Des erreurs 406 apparaissent en console sur lecture `profiles` (requête `.single()` quand profil absent).
- Ce n’est pas bloquant pour l’accès admin, mais ça donne visuellement l’impression d’un système cassé.

Plan de correction (efficace et ciblé)

Phase 1 — Rendre le chemin admin visible sans casser l’isolation
A. Landing navbar (desktop + mobile)
- Ajouter un lien discret “Accès équipe” vers `/admin/login` dans `src/components/landing/Navbar.tsx`.
- Garder “Se connecter” pour les clients (`/login`) pour ne pas mélanger les parcours.

B. Footer landing
- Ajouter un lien “Espace administration” dans `src/components/landing/Footer.tsx` pour un point d’entrée permanent.

C. Login client
- Ajouter un lien secondaire “Vous êtes de l’équipe Intramate ? Accéder à l’espace admin” dans `src/pages/Login.tsx`.
- Cela réduit immédiatement les erreurs d’aiguillage.

Phase 2 — Renforcer les routes d’entrée admin
A. Alias de compatibilité (anti-friction)
- Dans `src/App.tsx`, ajouter des redirections:
  - `/admin-login` → `/admin/login`
  - `/hq/login` → `/admin/login`
  - `/hq` → `/admin/login`
- Résultat: même si vous tapez une ancienne URL, vous retombez sur la bonne porte.

B. Expérience de login admin plus robuste
- Dans `src/pages/AdminLogin.tsx`:
  - si un admin est déjà connecté, redirection automatique vers `/admin/overview`.
  - message d’erreur plus explicite pour compte non autorisé.
- Évite l’effet “je suis connecté mais je ne vois rien”.

Phase 3 — Nettoyage du faux signal d’erreur (console)
A. AuthContext
- Dans `src/contexts/AuthContext.tsx`, remplacer la lecture profil stricte `.single()` par une lecture tolérante (type `maybeSingle`) pour éviter les 406 non bloquants quand un profil n’existe pas encore.
- Ajouter garde-fou pour que l’absence de profil ne soit jamais traitée comme une panne.

Pourquoi c’est la bonne correction
- Vous gardez une séparation claire client/admin (sécurité + architecture respectées).
- L’URL admin devient immédiatement visible et mémorisable.
- Les utilisateurs ne se retrouvent plus “coincés” sur `/login` client.
- Les erreurs console trompeuses sont supprimées.

Fichiers ciblés
- `src/components/landing/Navbar.tsx` (lien accès équipe)
- `src/components/landing/Footer.tsx` (entrée admin persistante)
- `src/pages/Login.tsx` (pont vers admin)
- `src/App.tsx` (routes alias + redirections)
- `src/pages/AdminLogin.tsx` (auto-redirection admin déjà connecté)
- `src/contexts/AuthContext.tsx` (suppression 406 parasites)

Sécurité (inchangée, conservée)
- Les rôles restent dans `user_roles` uniquement.
- Aucun contrôle d’admin en localStorage/hardcoded.
- Validation d’accès admin toujours basée sur la base de données côté backend.

Plan de validation end-to-end
1) Depuis `/`:
- Vérifier présence du lien “Accès équipe” (desktop + mobile).
- Cliquer et confirmer arrivée sur `/admin/login`.

2) Depuis `/login` client:
- Vérifier le lien secondaire admin et la navigation correcte.

3) Flux admin complet:
- Connexion avec `ougajs@gmail.com` → arrivée `/admin/overview`.
- Refresh de page sur route admin profonde (`/admin/tickets`) sans perte d’accès.

4) Flux non-admin:
- Tentative de connexion admin avec compte client → message refus explicite.
- Aucune fuite vers pages admin.

5) Régression:
- Parcours client standard inchangé (`/login` et dashboard).
- Console sans 406 “profiles” parasites sur les parcours auth.

Résultat attendu
- Le chemin de connexion admin n’est plus “invisible”.
- L’accès admin devient simple, direct, et fiable.
- L’expérience perçue “inaccessible” disparaît côté utilisateur final.
