

# Analyse : Flux d'inscription des membres d'equipe

## Etat actuel

### Cote boutique (store team)
Le flux est **deja correct** dans sa logique de base :
1. L'admin invite par email via la page Team → insertion dans `team_invitations` + appel `send-invitation`
2. Le trigger `handle_invited_user` sur `auth.users` detecte l'email a l'inscription et assigne automatiquement le `store_id` + `role`
3. L'utilisateur est redirige vers le dashboard avec le bon role

**Ce qui manque** : le trigger `handle_invited_user` existe comme fonction mais **n'est pas attache comme trigger** (la section `db-triggers` indique "There are no triggers in the database"). C'est un blocage critique -- le mecanisme d'auto-assignation ne fonctionne pas actuellement.

### Cote Intramate HQ
Le composant `SuperAdminTeam.tsx` permet d'ajouter un membre interne, mais **uniquement si son compte existe deja**. Il n'y a pas de flux d'invitation ni d'approbation.

## Evaluation de ta logique

Ta proposition est **coherente et bien pensee**. Voici mon analyse :

| Point | Verdict |
|---|---|
| Boutique : invitation-only avec role predefini par l'admin | Deja le design actuel. Le trigger manquant doit etre cree |
| HQ : invitation par superadmin | Logique, meme pattern que la boutique |
| HQ : auto-inscription avec choix de role + validation | Bonne idee pour simplifier l'onboarding HQ, mais necessite une table de demandes en attente |

## Plan d'implementation

### Etape 1 : Creer le trigger manquant sur `auth.users`

La fonction `handle_invited_user()` existe deja en base. Il faut simplement creer le trigger qui l'appelle :

```sql
CREATE TRIGGER on_auth_user_created_check_invites
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invited_user();
```

Cela corrige le flux boutique : un membre invite sera automatiquement rattache a son `store_id` et son `role` des son inscription.

### Etape 2 : Creer une table `admin_join_requests` pour les demandes HQ

Pour permettre l'auto-inscription avec validation :

```sql
CREATE TABLE public.admin_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  requested_role text NOT NULL DEFAULT 'support',
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

Avec des politiques RLS appropriees (superadmins peuvent tout voir/modifier, l'utilisateur peut voir sa propre demande).

### Etape 3 : Ajouter un formulaire de demande d'acces HQ

Sur la page `/admin/login`, ajouter un lien "Demander un acces" qui ouvre un formulaire :
- Email (pre-rempli si connecte)
- Nom
- Role souhaite (support, finance, developer)
- Bouton "Soumettre la demande"

L'utilisateur voit un message "Votre demande est en attente de validation" tant que le statut est `pending`.

### Etape 4 : Ajouter la validation dans SuperAdminTeam

Dans le composant `SuperAdminTeam.tsx`, ajouter une section "Demandes en attente" :
- Liste des demandes `pending`
- Boutons "Approuver" (insere dans `user_roles` avec le role demande) et "Rejeter"
- Notification au demandeur (optionnel, phase suivante)

### Etape 5 : Bloquer l'acces HQ tant que la demande n'est pas approuvee

Dans le flux d'authentification admin (`AdminLogin.tsx` / `SuperAdmin.tsx`), verifier que l'utilisateur a bien un role interne dans `user_roles` avant de lui donner acces. S'il a une demande `pending`, afficher "En attente de validation".

## Fichiers concernes

- **Migration SQL** : trigger sur `auth.users` + table `admin_join_requests` + politiques RLS
- `src/pages/AdminLogin.tsx` : ajout lien "Demander un acces" + formulaire
- `src/components/superadmin/SuperAdminTeam.tsx` : section demandes en attente + actions approuver/rejeter
- `src/pages/SuperAdmin.tsx` : verification du statut de demande

## Ce qui ne change pas

- Le flux d'invitation boutique (deja correct, juste le trigger a activer)
- Le design general
- Les roles existants et les RLS en place

