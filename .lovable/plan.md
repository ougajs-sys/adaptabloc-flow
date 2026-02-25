
# Plan d'implementation — Flux d'inscription equipe (COMPLETE)

## Ce qui a ete fait

### Etape 1 : Trigger sur auth.users ✅
Le trigger `on_auth_user_created_check_invites` existait deja en base. Il execute `handle_invited_user()` qui assigne automatiquement `store_id` + `role` aux membres invites lors de leur inscription.

### Etape 2 : Table admin_join_requests ✅
Table creee avec RLS :
- Les utilisateurs peuvent voir/inserer leurs propres demandes
- Les superadmins peuvent tout voir/modifier/supprimer
- Trigger `updated_at` automatique

### Etape 3 : Formulaire de demande d'acces HQ ✅
Sur `/admin/login` :
- Vue "login" : connexion classique + bouton "Demander un acces"
- Vue "request" : formulaire (nom, email, mot de passe, role souhaite)
- Vue "pending" : message d'attente de validation

### Etape 4 : Validation dans SuperAdminTeam ✅
Section "Demandes en attente" avec :
- Liste des demandes pending
- Boutons Approuver (insere dans user_roles) et Rejeter
- Mise a jour du statut dans admin_join_requests

### Etape 5 : Blocage d'acces HQ ✅
Dans AdminLogin.tsx :
- Si l'utilisateur a une demande pending → affiche "En attente"
- Si la demande est rejetee → affiche "Demande refusee"
- Si aucun role admin → "Acces refuse"
