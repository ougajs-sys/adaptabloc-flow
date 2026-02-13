

# Plan : Workflow operationnel E-commerce en 4 etapes avec gestion du personnel

## Constat

Le systeme actuel traite les commandes comme un simple suivi de statut. En realite, un e-commerce fonctionne avec un **pipeline operationnel en 4 etapes**, chacune impliquant des roles specifiques. Le pack gratuit doit inclure un minimum de personnel pour que le client puisse demarrer immediatement.

## Le pipeline E-commerce

```text
Reception          Confirmation         Preparation          Livraison
(auto/manuelle) -> (Caller) ----------> (Preparateur) -----> (Livreur)
                   Appelle le client     Prepare le colis     Livre au client
                   Confirme adresse      Verifie le stock     Met a jour statut
                   Valide paiement       Emballe              Collecte paiement
```

## Ce qui change

### 1. Nouveau modele de donnees : Roles et personnel

Ajouter un systeme de **roles operationnels** et de **gestion d'equipe** au registre de modules :

- **Roles definis** : `admin`, `caller`, `preparateur`, `livreur`
- **Pack gratuit inclut** : 1 admin + 1 caller + 1 preparateur + 1 livreur (equipe minimale pour demarrer)
- **Modules payants** : personnel supplementaire par role

### 2. Restructuration du registre de modules (`modules-registry.ts`)

**Modules gratuits revus :**

| Module | Avant | Apres |
|--------|-------|-------|
| `orders_basic` | Liste + creation simple | Reception auto/manuelle + pipeline 4 etapes + statuts lies aux roles |
| `team_basic` | *n'existait pas* | **Nouveau** - Equipe de base (1 admin, 1 caller, 1 preparateur, 1 livreur) |
| `delivery_basic` | Suivi statut simple | Suivi lie au livreur assigne + preuve de livraison basique |

**Nouveaux modules payants :**

| Module | Tier | Prix | Description |
|--------|------|------|-------------|
| `extra_callers` | tier1 | 2 000 FCFA | +3 callers supplementaires |
| `extra_preparers` | tier1 | 2 000 FCFA | +3 preparateurs supplementaires |
| `extra_drivers` | tier1 | 3 000 FCFA | +3 livreurs supplementaires |
| `call_center` | tier2 | 7 000 FCFA | Callers illimites + scripts d'appel + stats performance |
| `warehouse_team` | tier2 | 7 000 FCFA | Preparateurs illimites + gestion des postes + productivite |

### 3. Statuts de commande lies au pipeline

Remplacer les statuts actuels par un workflow operationnel :

```text
new -> caller_pending -> confirmed -> preparing -> ready -> in_transit -> delivered
                      -> cancelled (a tout moment)
                      -> returned (apres livraison)
```

Chaque statut est associe a un role qui le traite :
- `new` / `caller_pending` / `confirmed` : Caller
- `preparing` / `ready` : Preparateur
- `in_transit` / `delivered` / `returned` : Livreur

### 4. Nouvelle page Equipe (`/dashboard/team`)

Page de gestion du personnel incluse dans le pack gratuit :
- Liste des membres avec leur role (caller, preparateur, livreur)
- Indicateur du quota (ex: "1/1 callers utilises")
- Performance basique (commandes traitees par personne)
- Bouton "Ajouter" qui redirige vers le module payant si quota atteint

### 5. Refonte de la page Commandes

La page Commandes devient un **tableau de bord operationnel** avec :
- **Vue Kanban** par etape du pipeline (colonnes : Nouvelles > Caller > Preparation > Pret > En livraison > Livre)
- **Filtrage par role** : un caller ne voit que ses commandes a confirmer, un preparateur ses commandes a preparer
- **Actions contextuelles** : chaque etape a ses propres boutons (ex: "Confirmer la commande" pour le caller, "Marquer comme pret" pour le preparateur)

### 6. Sidebar mise a jour

Ajouter l'entree "Equipe" dans la section Principal de la sidebar, accessible gratuitement.

## Details techniques

### Fichiers a creer

- `src/lib/team-roles.ts` : Definition des roles, quotas par module, et types TypeScript
- `src/pages/Team.tsx` : Page de gestion de l'equipe avec mock data
- `src/components/orders/OrderPipeline.tsx` : Vue Kanban du pipeline de commandes

### Fichiers a modifier

- `src/lib/modules-registry.ts` : Ajouter module `team_basic` (gratuit), `extra_callers`, `extra_preparers`, `extra_drivers`, `call_center`, `warehouse_team`
- `src/pages/Orders.tsx` : Refonte avec pipeline 4 etapes et statuts operationnels
- `src/pages/Deliveries.tsx` : Lier les livraisons aux livreurs de l'equipe
- `src/components/dashboard/DashboardSidebar.tsx` : Ajouter entree "Equipe"
- `src/App.tsx` : Ajouter route `/dashboard/team`

### Structure des quotas par defaut

```text
Pack gratuit :  1 admin, 1 caller, 1 preparateur, 1 livreur
+extra_callers : +3 callers (total 4)
+extra_preparers : +3 preparateurs (total 4)
+extra_drivers : +3 livreurs (total 4)
+call_center : callers illimites
+warehouse_team : preparateurs illimites
+multi_delivery (existant) : livreurs illimites
```

