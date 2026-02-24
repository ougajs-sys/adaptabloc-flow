

# Analyse objective : le RBAC client est-il critique pour le MVP ?

## Constat actuel

**OUI, le probleme est reel et doit etre corrige avant le lancement.**

Voici les faits verifies dans le code :

1. **`buildAppUser` (AuthContext.tsx, ligne 35)** : la requete sur `user_roles` ne selectionne que `store_id`. Le role (`admin`, `caller`, `preparateur`, `livreur`) est ignore.

2. **`ProtectedRoute` (App.tsx)** : verifie uniquement `isAuthenticated` et `has_completed_onboarding`. Aucune verification de role.

3. **`DashboardSidebar`** : affiche toutes les entrees de menu (Billing, Settings, Team, Modules) a tous les utilisateurs connectes, quel que soit leur role.

**Consequence concrete** : un livreur invite dans une boutique peut acceder a `/dashboard/billing`, `/dashboard/settings`, `/dashboard/team` et `/dashboard/modules`. Meme si les donnees sont protegees cote serveur par RLS, l'utilisateur voit des pages auxquelles il ne devrait pas avoir acces -- ce qui est inacceptable pour un produit en production.

## Nuance importante

La securite des **donnees** n'est pas en danger : les politiques RLS sur les tables `invoices`, `team_invitations`, `store_modules` bloquent deja les operations non autorisees cote serveur. Ce qui manque, c'est la **securite de l'interface** (defense en profondeur + UX correcte).

## Plan d'implementation

### Etape 1 : Ajouter `role` dans AuthContext

- Modifier la requete `user_roles` : `.select("store_id, role")` au lieu de `.select("store_id")`
- Extraire `role` : `const role = roles?.[0]?.role ?? null`
- Ajouter `role: string | null` dans l'interface `AppUser` et dans l'objet retourne

### Etape 2 : Creer un `ProtectedRoute` avec controle de role

- Ajouter une prop optionnelle `allowedRoles?: string[]`
- Si `allowedRoles` est fourni et que `user.role` n'est pas dedans, rediriger vers `/dashboard`
- Les routes sans `allowedRoles` restent accessibles a tous les utilisateurs authentifies

### Etape 3 : Securiser les routes dans App.tsx

| Route | Roles autorises |
|---|---|
| `/dashboard/billing` | admin |
| `/dashboard/settings` | admin |
| `/dashboard/team` | admin |
| `/dashboard/modules` | admin |
| `/dashboard/workspace/caller` | admin, caller |
| `/dashboard/workspace/preparateur` | admin, preparateur |
| `/dashboard/workspace/livreur` | admin, livreur |
| `/dashboard`, `/dashboard/orders`, `/dashboard/products`, `/dashboard/customers`, `/dashboard/deliveries`, `/dashboard/stats`, `/dashboard/help` | tous les roles |

### Etape 4 : Masquer les liens non autorises dans la Sidebar

- Ajouter une prop `requiredRoles?: string[]` aux items de la sidebar
- Si le role de l'utilisateur n'est pas dans la liste, masquer l'entree (pas juste la verrouiller)
- Cela evite la confusion : un livreur ne voit que les pages qui le concernent

### Fichiers modifies

- `src/contexts/AuthContext.tsx` -- ajout du role
- `src/App.tsx` -- ProtectedRoute avec allowedRoles + routes securisees
- `src/components/dashboard/DashboardSidebar.tsx` -- masquage conditionnel des liens

### Ce qui ne change PAS

- Aucune migration de base de donnees (la colonne `role` existe deja dans `user_roles`)
- Aucune modification RLS (la securite serveur est deja en place)
- Aucun changement de design ou de fonctionnalite

