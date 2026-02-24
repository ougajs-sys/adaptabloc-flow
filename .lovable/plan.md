

# Transformation du Super Admin en Espace de Travail Complet -- Equipe Intramate

## Concept d'acces

L'espace Super Admin sera accessible via une **page de connexion dediee et independante** a l'adresse `/admin`. Cette page est completement separee du login client (`/login`). Seul un formulaire email/mot de passe sera propose (pas de Facebook/Google) pour renforcer la securite. Apres connexion, le systeme verifie le role `superadmin`/`support`/`finance`/`developer` dans la base de donnees. Si le role n'est pas trouve, l'acces est refuse.

```text
Flux d'acces :

  /admin  -->  Login email/mdp  -->  Verification role en base  -->  /admin/overview
                                          |
                                     Pas de role admin?
                                          |
                                     "Acces refuse"
```

Le lien dans la sidebar du dashboard client sera **supprime** -- l'espace admin est desormais totalement isole.

---

## Architecture des routes

```text
/admin                  -->  Page de login dediee (AdminLogin)
/admin/overview         -->  Vue Globale enrichie
/admin/stores           -->  Gestion Boutiques
/admin/users            -->  NOUVEAU - Tous les utilisateurs
/admin/finances         -->  Transactions
/admin/modules          -->  Catalogue modules
/admin/analytics        -->  Graphiques enrichis
/admin/providers        -->  Providers Paiement
/admin/activity         -->  NOUVEAU - Journal d'activite
/admin/team             -->  NOUVEAU - Equipe interne Intramate
/admin/config           -->  NOUVEAU - Configuration systeme
```

---

## Layout de l'espace

```text
+---------------------------+----------------------------------------+
|                           |                                        |
|  SIDEBAR ADMIN            |   CONTENU PRINCIPAL                    |
|                           |                                        |
|  [Shield] Intramate HQ    |   Header : titre section + profil      |
|                           |                                        |
|  --- Tableau de bord ---  |                                        |
|  > Vue Globale            |                                        |
|  > Analytics              |                                        |
|                           |                                        |
|  --- Gestion ---          |                                        |
|  > Boutiques              |                                        |
|  > Utilisateurs           |                                        |
|  > Modules                |                                        |
|                           |                                        |
|  --- Finances ---         |                                        |
|  > Transactions           |                                        |
|  > Providers Paiement     |                                        |
|                           |                                        |
|  --- Support ---          |                                        |
|  > Journal d'activite     |                                        |
|  > Equipe Intramate       |                                        |
|                           |                                        |
|  --- Systeme ---          |                                        |
|  > Configuration          |                                        |
|                           |                                        |
|  [Profil] [Deconnexion]   |                                        |
+---------------------------+----------------------------------------+
```

---

## Nouvelles fonctionnalites

### 1. Page de Login Admin (`/admin`)
- Design premium avec fond sombre et icone Shield
- Formulaire email + mot de passe uniquement (pas d'OAuth)
- Apres connexion, verification du role dans `user_roles`
- Message d'erreur clair si le compte n'a pas de role admin
- Redirection vers `/admin/overview` en cas de succes

### 2. Utilisateurs (`SuperAdminUsers.tsx`)
- Liste globale de tous les profils (table `profiles` + `user_roles`)
- Colonnes : Nom, Email, Boutique, Role, Date d'inscription
- Recherche par nom/email
- Compteur total d'utilisateurs

### 3. Journal d'activite (`SuperAdminActivity.tsx`)
- Timeline des evenements recents : inscriptions boutiques, activations de modules, transactions
- Lecture croisee depuis `stores.created_at`, `store_modules.activated_at`, `transactions.created_at`
- Icones colorees par type d'evenement
- Filtre par categorie

### 4. Equipe Intramate (`SuperAdminTeam.tsx`)
- Liste des membres internes (roles : superadmin, support, finance, **developpeur**)
- Affichage du role, nom, email
- Formulaire d'invitation pour ajouter un nouveau membre interne
- Lecture depuis `user_roles` + `profiles`

### 5. Configuration (`SuperAdminConfig.tsx`)
- Version de la plateforme
- Nombre de boutiques, utilisateurs, modules actifs
- Toggle mode maintenance (localStorage pour le MVP)
- URL de la plateforme

### 6. Vue Globale amelioree
- Revenu total reel depuis `transactions` (filtre `status = 'completed'`)
- Tendances haut/bas comparees a la semaine precedente
- Section "5 derniers evenements"

### 7. Analytics enrichi
- Graphique de revenus mensuels (en plus de la croissance boutiques)
- Modules les plus populaires (bar chart horizontal)

---

## Details techniques

### Migration base de donnees

Ajouter le role `developer` a l'enum `app_role` :
```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';
```

Ajouter une politique RLS pour que les superadmins puissent lire tous les profils :
```sql
CREATE POLICY "Superadmins can view all profiles"
ON public.profiles FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'superadmin'
));
```

### Fichiers a creer

| Fichier | Description |
|---------|-------------|
| `src/pages/AdminLogin.tsx` | Page de connexion dediee avec design premium sombre |
| `src/components/superadmin/SuperAdminLayout.tsx` | Layout avec sidebar + header + Outlet pour sous-routes |
| `src/components/superadmin/SuperAdminSidebar.tsx` | Sidebar de navigation avec groupes et liens actifs |
| `src/components/superadmin/SuperAdminUsers.tsx` | Liste globale des utilisateurs |
| `src/components/superadmin/SuperAdminActivity.tsx` | Journal d'activite / timeline |
| `src/components/superadmin/SuperAdminTeam.tsx` | Gestion equipe interne avec 4 roles |
| `src/components/superadmin/SuperAdminConfig.tsx` | Configuration et stats systeme |

### Fichiers a modifier

| Fichier | Modification |
|---------|-------------|
| `src/pages/SuperAdmin.tsx` | Remplacer par le layout avec `<Outlet>` et verification de role admin |
| `src/App.tsx` | Ajouter route `/admin` (login) + sous-routes `/admin/*` ; supprimer `/super-admin` |
| `src/components/superadmin/SuperAdminOverview.tsx` | Enrichir avec revenus reels et activite recente |
| `src/components/superadmin/SuperAdminAnalytics.tsx` | Ajouter graphique revenus + modules populaires |
| `src/components/dashboard/DashboardSidebar.tsx` | Supprimer le lien Super Admin de la sidebar client |

### Securite
- La verification du role se fait **cote serveur** via la table `user_roles` (jamais localStorage)
- Les politiques RLS existantes protegent deja les tables sensibles pour les superadmins
- Seuls les utilisateurs avec un role admin (superadmin/support/finance/developer) peuvent acceder a l'espace
- Les roles support/finance/developer auront un acces en lecture seule pour le MVP

