
# Corriger le systeme d'invitation par email

## Probleme 1 : Aucun email d'invitation n'est envoye

Actuellement, cliquer "Inviter" insere simplement une ligne dans la table `team_invitations`. Personne ne recoit de notification.

### Solution : Creer une Edge Function `send-invitation`

Cette fonction sera appelee apres l'insertion de l'invitation et enverra un email via le service d'email integre de Lovable Cloud (Supabase Auth Admin).

**Flux :**
1. L'admin clique "Inviter" dans l'interface
2. L'invitation est inseree dans `team_invitations` (existant)
3. Le client appelle la nouvelle Edge Function `send-invitation` avec l'email, le role et le nom de la boutique
4. L'Edge Function utilise l'API Admin pour generer un lien d'inscription magique (invite link)
5. Le collaborateur recoit un email avec un lien pour rejoindre l'equipe

**Fichiers a creer :**
- `supabase/functions/send-invitation/index.ts` : Edge Function qui genere et envoie le lien d'invitation via `supabase.auth.admin.inviteUserByEmail()` ou `generateLink()`

**Fichiers a modifier :**
- `src/pages/Team.tsx` : Modifier `inviteMutation` pour appeler l'Edge Function apres l'insertion dans `team_invitations`

---

## Probleme 2 : Erreur 400 sur la page Equipe

La requete `user_roles.select("..., profiles!inner(...)")` echoue car il n'y a pas de foreign key entre `user_roles` et `profiles`. Les deux tables ont chacune un `user_id` vers `auth.users`, mais PostgREST ne peut pas deviner la relation.

### Solution : Modifier la requete pour faire deux appels separes

Au lieu d'un JOIN PostgREST impossible, la page Equipe fera :
1. Une requete sur `user_roles` pour obtenir les roles (user_id, role)
2. Une requete sur `profiles` pour obtenir les infos (user_id, name, email, phone, avatar_url)
3. Un merge cote client par `user_id`

**Fichier a modifier :**
- `src/pages/Team.tsx` : Remplacer la requete unique avec JOIN par deux requetes separees + merge

---

## Detail technique

### Edge Function `send-invitation`

```text
POST /send-invitation
Body: { store_id, email, role, store_name }

1. Verifie que l'appelant est admin du store (via JWT)
2. Utilise supabase.auth.admin.inviteUserByEmail(email, { redirectTo: origin + "/login" })
   - Cela envoie automatiquement un email d'invitation via Lovable Cloud
3. Retourne { success: true }
```

L'email contient un lien. Quand l'invite clique dessus et s'inscrit, le trigger existant `handle_invited_user` prend le relais automatiquement pour assigner le role et creer le profil.

### Correction de la requete Team members

```text
Avant (echoue) :
  user_roles.select("id, user_id, role, profiles!inner(name, email, phone, avatar_url)")

Apres (fonctionne) :
  1. user_roles.select("id, user_id, role").eq("store_id", storeId)
  2. profiles.select("user_id, name, email, phone, avatar_url").eq("store_id", storeId)
  3. Merge cote client par user_id
```

### Ordre d'implementation

1. Migration DB : aucune necessaire (les tables existent deja)
2. Creer l'Edge Function `send-invitation`
3. Corriger la requete dans `Team.tsx` (deux requetes separees)
4. Modifier `inviteMutation` pour appeler l'Edge Function apres l'insertion
