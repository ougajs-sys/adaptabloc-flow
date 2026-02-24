# MVP E-Commerce — Fondations Supabase

## Variables d'environnement

Créez un fichier `.env` à la racine du projet (ne jamais committer ce fichier) :

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<votre-clé-anon-publique>
```

La clé `VITE_SUPABASE_PUBLISHABLE_KEY` est la clé **anon/public** de votre projet Supabase.  
Elle est sûre à exposer côté client car les politiques RLS contrôlent l'accès aux données.

---

## Architecture multi-tenant

Toutes les tables e-commerce (orders, order_items, products, customers, etc.) incluent une colonne `store_id` (UUID) qui identifie le commerçant. Les politiques RLS garantissent l'isolation des données entre les stores.

### Mécanisme user → store

Le mapping utilisateur ↔ store est géré par la table `user_roles` :

```
user_roles (user_id, store_id, role)
```

Les fonctions helper `is_store_member(store_id)` et `has_role(store_id, role)` sont utilisées dans toutes les policies RLS.

---

## Appliquer les migrations Supabase

### Prérequis

```bash
npm install -g supabase
supabase login
```

### Lier le projet

```bash
supabase link --project-ref <project-ref>
```

### Appliquer toutes les migrations

```bash
supabase db push
```

### Migrations incluses (dans l'ordre)

| Fichier | Contenu |
|---|---|
| `20260222000204_...sql` | Schéma initial : stores, products, orders, order_items, customers, deliveries, RLS |
| `20260222000920_...sql` | Ajout `caller_pending`, `in_transit` à `order_status` |
| `20260222002724_...sql` | Realtime sur deliveries |
| `20260222004802_...sql` | Accès anon sur embed_forms et products (SELECT) |
| `20260222011521_...sql` | Colonne facebook_id sur profiles |
| `20260222232245_...sql` | Table store_modules |
| `20260222234715_...sql` | Enum `superadmin` dans app_role |
| `20260222234737_...sql` | Table payment_providers |
| `20260222234954_...sql` | Policy superadmin pour la vue globale des stores |
| `20260223064808_...sql` | Extensions pg_cron/pg_net + index subscriptions |
| `20260224000000_embed_order_anon_access.sql` | **Nouveau** : `payment_status` enum + accès anon INSERT pour /embed/order |

---

## Accès anonyme pour /embed/order

La migration `20260224000000_embed_order_anon_access.sql` met en place :

1. **Enum `payment_status`** : `pending | paid | refunded`  
2. **Colonne `payment_status`** sur la table `orders` (défaut : `pending`)  
3. **Policies RLS anon** permettant :
   - `INSERT` sur `customers` si le store possède au moins un `embed_form` actif
   - `SELECT` sur `customers` (lookup par téléphone pour éviter les doublons)
   - `INSERT` sur `orders` si le store possède au moins un `embed_form` actif
   - `INSERT` sur `order_items` si la commande parente appartient à un store avec un embed form actif

**Mécanisme de sécurité** : un utilisateur anonyme ne peut créer des commandes que pour un store qui a explicitement activé un formulaire d'intégration (`embed_form.status = 'active'`). Cela évite les insertions arbitraires.

---

## Utiliser /embed/order

La page `/embed/order` est conçue pour être embarquée dans un `<iframe>`.

### Query params

| Paramètre | Requis | Description |
|---|---|---|
| `store_id` | Oui (ou `formId`) | UUID du store Supabase |
| `formId` | Alternatif à `store_id` | UUID d'un embed_form actif (legacy) |
| `brand` | Non | Nom affiché en en-tête (défaut : "Ma Boutique") |
| `color` | Non | Couleur hex du bouton sans `#` (défaut : `8B5CF6`) |
| `productId` | Non | UUID du produit présélectionné |
| `redirect` | Non | URL de redirection après commande réussie |

### Exemple d'intégration

```html
<iframe
  src="https://votre-domaine.com/embed/order?store_id=<UUID>&brand=MonShop&color=3B82F6"
  width="480"
  height="700"
  style="border:none;"
  allow="payment"
></iframe>
```

### Flux de création de commande

1. Le composant résout le `store_id` (depuis le param ou via le `formId`)
2. Il charge les produits actifs du store
3. À la soumission, il :
   - Upsert le client par `phone + store_id`
   - Crée un enregistrement `orders` (status: `new`, payment_status: `pending`)
   - Crée un enregistrement `order_items`
4. Affiche un message de succès ou d'erreur

### Validation côté client

- Au moins un produit doit être sélectionné
- Nom, téléphone et adresse sont requis (champs `required` HTML)
- `store_id` doit être résolu avant soumission
