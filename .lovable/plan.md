## Contexte clarifié

- **Backend actif** : projet Supabase externe `gtfpzxbtcgbyxvwptexr` (nommé "intramate" sur ton compte personnel). Le `.env` est correct, je ne touche pas.
- **Superadmin officiel** : `contact@intramate.pro`. Mémoire interne mise à jour à la fin.
- **Modalité migrations** : tu vas connecter Lovable à ton Supabase intramate pour que je puisse pousser les SQL directement.

---

## Prérequis (toi, ~3 min)

Avant que je commence les corrections base de données, tu dois :

1. Aller dans **Connectors** (sidebar Lovable) → chercher **Supabase**
2. Connecter le projet `intramate` (ref : `gtfpzxbtcgbyxvwptexr`) avec un Personal Access Token Supabase
3. Lier la connexion à ce projet Lovable

Je confirmerai la connexion via `supabase--project_info` avant de pousser quoi que ce soit. **Si la connexion n'est pas faisable**, je bascule en mode "je génère les SQL, tu les colles dans le SQL Editor de ton dashboard Supabase".

---

## Plan d'action — 6 phases

### Phase 1 — Fix erreurs TypeScript bloquantes (Orders.tsx)
Migration SQL sur le projet intramate :
- Ajouter colonne `payment_status` (enum `pending | paid | refunded | failed`) sur `orders`
- Renommer `orders.shipping_city` → `city` **OU** adapter le code (à décider selon usage réel — je vérifie avant)
- Créer table `customer_segments` (store_id, name, criteria JSONB) avec RLS store_member
- Supprimer la colonne morte `profiles.facebook_id`

### Phase 2 — Atomicité création/édition de commande
- Créer RPC PL/pgSQL `create_order_atomic(p_store_id, p_customer, p_items[], p_shipping, p_notes)` qui :
  - Verrouille les produits via `SELECT ... FOR UPDATE` (anti race-condition stock)
  - Vérifie stock suffisant pour chaque ligne, sinon `RAISE EXCEPTION`
  - Crée/réutilise le customer
  - Insère `order` + `order_items` + décrémente le `stock`
  - Retourne l'ID de la commande
- Tout dans une seule transaction PostgreSQL → zéro orphelin possible
- Refactor `NewOrderDialog.tsx` pour appeler `supabase.rpc('create_order_atomic', ...)` au lieu des 4 inserts séparés

### Phase 3 — Corrections UX création de commande
- État `submitting` + spinner sur bouton "Créer la commande" (désactivé pendant la requête)
- Modale ne se ferme **qu'après** confirmation du backend
- Toast enrichi : `"Commande #N°123 créée"` + bouton "Voir"
- Update optimiste TanStack Query (commande visible instantanément, rollback si erreur)
- Highlight visuel 2 s sur la nouvelle ligne dans la liste

### Phase 4 — Realtime
Migration : ajouter `orders`, `order_items`, `customers`, `products` à la publication `supabase_realtime` + `REPLICA IDENTITY FULL`. Côté front, hook `useRealtimeSync` dans `Orders.tsx` et `Products.tsx`.

### Phase 5 — Durcissement sécurité
- Restreindre les fonctions `SECURITY DEFINER` au rôle `authenticated` uniquement (révoquer `public`)
- Bucket `product-images` : ajouter policy de listage restreint aux membres du store propriétaire (l'upload reste public-read pour affichage)
- Vérifier que `is_superadmin()` est bien utilisé partout (pas de comparaison email côté client)

### Phase 6 — Rapport + smoke test
- Génération `/mnt/documents/audit-intramate-2026-05-04.md` avec : findings Manus confirmés/réfutés, problèmes additionnels trouvés, corrections appliquées, captures avant/après
- Smoke test manuel guidé (création commande, multi-onglet realtime, login admin)
- Mise à jour de la mémoire `auth/primary-superadmin-account` avec `contact@intramate.pro`

---

## Détails techniques (pour ton dev)

- **RPC `create_order_atomic`** : signature `(p_store_id uuid, p_customer jsonb, p_items jsonb[], p_shipping jsonb, p_notes text) RETURNS uuid`, langage PL/pgSQL, `SECURITY DEFINER`, search_path = public, garde-fou `is_store_member(p_store_id)`.
- **Génération `order_number`** : séquence par store ou format `ORD-YYYYMMDD-XXXX` calculé dans le RPC.
- **Stock** : `UPDATE products SET stock = stock - qty WHERE id = ... AND stock >= qty RETURNING stock` ; si 0 lignes → `RAISE EXCEPTION 'Stock insuffisant pour %', product_name`.
- **Realtime** : pas de SUBSCRIBE par store côté front (un seul channel filtré côté serveur via RLS).
- **Migration `shipping_city → city`** : à décider après lecture finale d'`Orders.tsx` ligne par ligne — peut-être que c'est plus sûr de garder `shipping_city` et corriger le code.

---

## Estimation
~1 h 30 (hors temps que tu prends pour connecter Supabase à Lovable).

## Livrables
- Migrations SQL exécutées sur `gtfpzxbtcgbyxvwptexr`
- Code refactoré (`NewOrderDialog.tsx`, `Orders.tsx`, `Products.tsx`, hook realtime)
- Rapport Markdown téléchargeable dans `/mnt/documents/`
- Mémoire superadmin mise à jour

---

## Ce que je ne vais PAS faire
- Toucher au `.env` (correct)
- Modifier le projet Lovable Cloud `swereqlfseezobfmmrrg` (inactif)
- Refondre l'UI globale (hors scope audit)
- Ajouter de nouvelles fonctionnalités métier

Confirme que tu as connecté Supabase intramate à Lovable (ou dis-moi si tu préfères le mode "SQL à copier-coller"), et je démarre Phase 1.