

## Contre-analyse

### Ce qui est deja securise

Les routes `/admin/*` **sont deja protegees** par `SuperAdminLayout` (lignes 18-39) qui :
1. Verifie que l'utilisateur est authentifie
2. Interroge la table `user_roles` pour verifier qu'il possede un role parmi `["superadmin", "support", "finance", "developer"]`
3. Redirige vers `/admin/login` si l'une de ces conditions echoue

La page `AdminLogin` effectue la meme verification apres connexion et refuse l'acces si le role n'est pas present.

### Pourquoi la proposition de l'utilisateur est problematique

- **Hardcoder un email** est moins securise et moins scalable que le systeme de roles actuel. Tout changement d'email ou ajout d'un collaborateur necessite de modifier le code source.
- Le systeme de roles en base de donnees est deja la bonne approche.

### Le vrai probleme a corriger

La protection est **a l'interieur** de `SuperAdminLayout` (un composant enfant), pas au niveau du routeur. Cela signifie :
- Le composant se monte brievement avant la redirection
- La logique d'autorisation est couplee au layout au lieu d'etre au niveau route

### Plan propose

**Une seule modification dans `App.tsx`** : extraire la logique d'autorisation admin dans un composant `SuperAdminRoute` au niveau routeur, qui reutilise la verification par roles (pas par email).

```text
Avant :  <Route path="/admin" element={<SuperAdminLayout />}>
Apres :  <Route path="/admin" element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>}>
```

Le composant `SuperAdminRoute` :
- Utilise `useAuth()` pour verifier l'authentification
- Interroge `user_roles` pour les roles admin (`superadmin`, `support`, `finance`, `developer`)
- Redirige vers `/admin/login` si non autorise
- Affiche les enfants si autorise

`SuperAdminLayout` est ensuite simplifie pour retirer sa propre verification (eviter le double check).

Fichiers modifies : `App.tsx` (ajout composant + modification route) et `SuperAdminLayout.tsx` (retrait du code d'autorisation redondant).

