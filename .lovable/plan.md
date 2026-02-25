

# Contre-analyse objective : App.tsx et RBAC

## Verdict : Les 3 etapes demandees sont DEJA implementees

Apres verification rigoureuse du code actuel :

### Etape 1 -- `allowedRoles` dans ProtectedRoute
**Deja fait.** Ligne 48 : `function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] })`

### Etape 2 -- Regle de blocage
**Deja fait.** Lignes 54-56 : si `allowedRoles` est defini et que le role n'est pas dedans, redirection vers `/dashboard`.

### Etape 3 -- Routes securisees
**Deja fait.** Les routes `/dashboard/billing`, `/dashboard/settings`, `/dashboard/team`, `/dashboard/modules` ont `allowedRoles={["admin"]}`. Les workspaces ont leurs roles respectifs.

### AuthContext
**Deja fait.** `role: string | null` est dans `AppUser` (ligne 14), et `buildAppUser` selectionne bien `store_id, role` (ligne 36).

---

## Un vrai probleme detecte : incoherence des noms de roles

Il y a un **bug reel** dans les routes workspace :

| Route | Role actuel dans App.tsx | Role attendu (table `user_roles` / `team-roles.ts`) |
|---|---|---|
| `/dashboard/workspace/preparateur` | `"preparer"` (ligne 80) | `"preparateur"` |
| `/dashboard/workspace/livreur` | `"driver"` (ligne 81) | `"livreur"` |

Le fichier `src/lib/team-roles.ts` definit les roles comme `"preparateur"` et `"livreur"`, pas `"preparer"` et `"driver"`. Si la base de donnees stocke `preparateur` et `livreur`, alors les routes workspace sont **inaccessibles** pour ces roles a cause de cette incoherence.

## Plan de correction

Modifier uniquement les lignes 80 et 81 de `App.tsx` pour aligner les noms de roles :

- Ligne 80 : `allowedRoles={["admin", "preparer"]}` → `allowedRoles={["admin", "preparateur"]}`
- Ligne 81 : `allowedRoles={["admin", "driver"]}` → `allowedRoles={["admin", "livreur"]}`

Aucun autre fichier a modifier.

