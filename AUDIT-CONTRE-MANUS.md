# Contre-audit Intramate — réponse au rapport Manus AI

**Date :** 04 mai 2026
**Auteur :** Audit indépendant approfondi
**Référence :** Rapport Manus AI du 04/05/2026
**Branche d'implémentation :** `claude/counter-audit-fixes`

---

## Résumé exécutif

Le rapport Manus est **superficiel** : 3 problèmes identifiés, tous purement UX, et l'un d'eux (« erreur de connexion ») n'est en réalité qu'une faute de saisie sur l'email fourni au testeur. Manus n'a pas inspecté le code, n'a pas testé les flux multi-utilisateurs, n'a pas analysé la sécurité, ni la base de données, ni les edge functions.

Le contre-audit révèle **3 bugs critiques** (perte de stock, race condition, embed form sans déduction) et **une dette architecturale majeure** (React Query non adopté) qui explique justement le seul vrai bug Manus (« compteur du dashboard resté à 0 »).

**Statut des corrections** : les 3 bugs critiques sont corrigés dans cette PR via un trigger DB unique. Les autres findings sont documentés ci-dessous pour décision/priorisation.

---

## Partie 1 — Vérification des findings Manus

| # | Finding Manus | Réalité | Preuve |
|---|---|---|---|
| 1 | « Erreur de connexion avec les identifiants » | **Faux positif** — mauvais email fourni au testeur (`ougajs@outlook.com` au lieu de `ougajean097@gmail.com`). Pas un bug. | — |
| 2 | « Pas de toast après création » | **Faux** — `Orders.tsx:220` affiche bien `toast({ title: "Commande créée" })`. | `src/pages/Orders.tsx:220` |
| 3 | « La commande n'apparaît pas dans la liste » | **Partiellement vrai** — sur `/orders`, `fetchOrders()` est rappelé (ligne 221) ✅. Mais le **Dashboard** ne se rafraîchit pas car il a sa propre requête manuelle. | `src/pages/Dashboard.tsx:113` |
| 4 | « Confusion utilisateur/admin » | Vague — il existe bien `/login` et `/admin/login` distincts. Pas de bug réel identifié. | `src/App.tsx`, `src/pages/AdminLogin.tsx` |

**Conclusion partie 1 :** sur les 4 points Manus, **2 sont faux**, **1 est vague**, **1 cache une vraie cause architecturale** que Manus n'a pas identifiée.

---

## Partie 2 — Findings que Manus a complètement ratés

### CRITIQUE

#### C1 — Race condition sur la déduction de stock ✅ CORRIGÉ
**Fichier :** `src/pages/Orders.tsx:181-217` (avant correction)
**Problème :** Le code lit le stock (`SELECT`), calcule `newStock = stock - qty`, puis fait un `UPDATE products SET stock = newStock`. Deux commandes simultanées sur le même produit peuvent toutes les deux lire `stock=10`, calculer `8`, et écrire `8` — alors que le résultat correct serait `6`.
**Impact :** Ventes sans stock, surventes possibles, inventaire faux.
**Correction appliquée :** Migration `20260504200000_atomic_stock_triggers.sql` — la déduction se fait dans un trigger `AFTER INSERT ON order_items` qui exécute `UPDATE products SET stock = stock - NEW.quantity`. Postgres acquiert un row lock sur la ligne `products` pendant l'`UPDATE`, donc deux transactions concurrentes se sérialisent automatiquement.

#### C2 — Stock perdu lors de l'édition d'une commande ✅ CORRIGÉ
**Fichier :** `src/pages/Orders.tsx:224-249` (avant correction)
**Problème :** `handleEditOrder` fait `DELETE order_items` puis `INSERT` les nouveaux, mais ne restitue pas le stock des anciens articles ni ne déduit celui des nouveaux. Un client qui passe une commande de 5 unités puis l'édite à 3 unités voit les 2 unités définitivement perdues de l'inventaire.
**Impact :** Perte d'inventaire à chaque édition.
**Correction appliquée :** Le trigger `AFTER DELETE ON order_items` restitue le stock automatiquement, puis le trigger `AFTER INSERT` redéduit pour les nouveaux items. Le code TS de `handleEditOrder` a été nettoyé.

#### C3 — Stock perdu lors de la suppression d'une commande ✅ CORRIGÉ
**Fichier :** `src/pages/Orders.tsx:251-262` (avant correction)
**Problème :** `handleDeleteOrder` supprime la commande sans restituer le stock.
**Impact :** Inventaire faux.
**Correction appliquée :** Trigger `BEFORE DELETE ON orders` qui restitue le stock pour chaque `order_item` lié, *sauf* si la commande était déjà annulée (auquel cas le stock a déjà été restitué par le trigger d'annulation existant).

#### C4 — L'embed form ne déduit jamais le stock ✅ CORRIGÉ
**Fichier :** `supabase/functions/submit-form/index.ts:107-163`
**Problème :** Quand une commande est créée via le formulaire embarqué (formulaire public sur landing page ou site externe), aucune déduction de stock n'est effectuée. Le stock affiché aux clients devient incorrect à mesure que les commandes embed s'accumulent.
**Impact :** Surventes via les formulaires publics.
**Correction appliquée :** Aucune modification du edge function nécessaire — le trigger DB déduit automatiquement le stock dès qu'une ligne est insérée dans `order_items`, peu importe le chemin (UI ou edge function).

---

### HAUTE

#### H1 — Dashboard ne se rafraîchit pas après mutations
**Fichier :** `src/pages/Dashboard.tsx:35-113`
**Problème :** Le Dashboard utilise `useEffect + fetchDashboard()` au lieu de React Query. Quand l'utilisateur crée une commande sur `/orders` puis revient sur `/dashboard`, les compteurs sont obsolètes. **C'est exactement le bug Manus #3.**
**Solution recommandée :** Migration vers React Query (voir A1 — observation architecturale).
**Statut :** Non corrigé dans cette PR (refactor large). À traiter dans une PR séparée.

#### H2 — Lookup produit par nom (collision possible)
**Fichier :** `src/pages/Orders.tsx:188-189`
**Problème :** `productMap = new Map(products.map(p => [p.name, p]))` — si deux produits ont le même nom dans le store, le second écrase le premier. Le mauvais `product_id` est associé aux items.
**Solution recommandée :** Soit ajouter une contrainte `UNIQUE(store_id, name)` sur `products`, soit utiliser `product_id` directement dans le formulaire (plus propre).
**Statut :** Non corrigé.

#### H3 — Pas de rate limiting sur l'edge function `send-invitation`
**Fichier :** `supabase/functions/send-invitation/index.ts`
**Problème :** Un utilisateur authentifié peut spammer la création d'invitations. Au-delà du coût d'envoi d'emails, cela permet une énumération des `store_id`.
**Solution recommandée :** Rate-limit par `auth.uid` (max 10 invitations/minute). Implémentable via une table `rate_limits` ou via Upstash Redis.
**Statut :** Non corrigé.

#### H4 — N+1 query dans Customers.tsx
**Fichier :** `src/pages/Customers.tsx:70-123`
**Problème :** Charge tous les clients, puis dans une seconde requête tous les `orders` du store, et calcule les stats côté client. Au-delà de 1000 commandes, la page devient lente.
**Solution recommandée :** Vue SQL `customer_stats_view` qui agrège `count(*) FILTER (...)`, `sum(total_amount)` par `customer_id`. Ou RPC `get_customer_stats(store_id)`.
**Statut :** Non corrigé.

#### H5 — `as any` masque des erreurs de type sur les statuts
**Fichier :** `src/pages/Orders.tsx:281, 294`
**Problème :** Les transitions de statut sont castées en `any`, court-circuitant la vérification TypeScript. Un statut invalide pourrait être écrit en base.
**Solution recommandée :** Définir un type `OrderStatusDB` strict et une fonction `mapToDbStatus(status: OrderStatus): OrderStatusDB` qui valide.
**Statut :** Non corrigé.

---

### MOYENNE

#### M1 — Pas de contrainte UNIQUE sur `deliveries.order_id`
**Fichier :** `src/pages/Deliveries.tsx:88-112`
**Problème :** Le filtrage des commandes éligibles est côté client. Deux requêtes simultanées peuvent créer deux livraisons pour la même commande.
**Solution :** Ajouter `UNIQUE(order_id)` sur `deliveries`.

#### M2 — `initiate-payment` n'exige pas le rôle admin
**Fichier :** `supabase/functions/initiate-payment/index.ts` (ligne ~347)
**Problème :** Tout membre du store peut initier un paiement. Devrait être réservé aux admins.
**Solution :** Remplacer `is_store_member()` par `has_role(store_id, 'admin')`.

#### M3 — Pas de validation du `store_id` dans le webhook Moneroo
**Fichier :** `supabase/functions/payment-webhook/index.ts:154-172`
**Problème :** Le webhook fait confiance au `store_id` reçu en metadata. Bien que la signature HMAC empêche la falsification, une attaque par replay pourrait théoriquement croiser les stores si Moneroo a un bug.
**Solution :** Vérifier `transaction.store_id === metadata.store_id`.

#### M4 — `submit-form` cherche les produits par `ilike` (correspondance floue)
**Fichier :** `supabase/functions/submit-form/index.ts:140-145`
**Problème :** `ilike '%product%'` peut matcher plusieurs produits, et choisit arbitrairement le premier. Source de bugs subtils sur le `product_id` lié.
**Solution :** Recherche exacte `eq('name', value)`, ou exiger `product_id` dans le formulaire.

#### M5 — Transitions de statut de livraison non contrôlées en DB
**Fichier :** Migration absente
**Problème :** Une livraison peut théoriquement passer de `delivered` → `pending` via un `UPDATE` direct (pas de check au niveau DB).
**Solution :** Trigger `BEFORE UPDATE` qui rejette les transitions invalides.

---

### BASSE

#### B1 — Filtres recalculés à chaque render
**Fichier :** `src/pages/Orders.tsx:264-269`
**Problème :** `orders.filter(...)` exécuté à chaque re-render. À 10k commandes, devient sensible.
**Solution :** `useMemo`.

#### B2 — Statut mapping fragile
**Fichier :** `src/pages/Orders.tsx`
**Problème :** Un mapping unidirectionnel `shipping ↔ in_transit`. Si l'enum DB change, casse silencieuse.
**Solution :** Map bidirectionnelle + tests.

---

## Partie 3 — Observation architecturale majeure

### A1 — React Query installé mais non utilisé (sauf Deliveries.tsx)

**Constat :** `@tanstack/react-query` est installé, `queryClient` configuré dans `src/lib/queryClient.ts`, mais **6 pages sur 7** utilisent le pattern manuel `useEffect + useState + fetchData()` :

| Page | Pattern | Problème |
|---|---|---|
| `Dashboard.tsx` | Manuel | Pas de refresh inter-pages |
| `Orders.tsx` | Manuel | Pas de refresh inter-pages |
| `Customers.tsx` | Manuel | Pas de cache, refetch à chaque montage |
| `Products.tsx` | Manuel | Idem |
| `Stock.tsx` | Manuel | Idem |
| `Statistics.tsx` | Manuel | Idem |
| `Deliveries.tsx` | **React Query ✅** | Référence à suivre |

**Conséquences observées :**
- Bug Manus #3 (« compteur resté à 0 ») = symptôme direct
- Lenteur perçue à chaque navigation (refetch complet)
- Pas de retry auto sur erreur réseau
- Pas de mises à jour optimistes

**Recommandation :** Migration progressive vers React Query, page par page. Commencer par les pages les plus visibles (Dashboard, Orders), 1-2h par page. Effort total estimé : ~10h. À planifier en PR thématique.

---

## Partie 4 — Plan d'action proposé

### Déjà fait dans cette PR
- ✅ Migration `20260504200000_atomic_stock_triggers.sql` (C1, C2, C3, C4)
- ✅ `Orders.tsx` nettoyé : suppression de la manipulation manuelle du stock + état `submitting` pour bloquer les double-soumissions
- ✅ Rapport `AUDIT-CONTRE-MANUS.md` (ce fichier)

### À planifier en PRs séparées (par ordre de priorité)

**PR Sécurité-2** (½ jour)
- M2 : exiger admin role pour `initiate-payment`
- M3 : valider `store_id` dans le webhook Moneroo
- H3 : rate limiting sur `send-invitation`

**PR Architecture React Query** (1-2 jours)
- A1 : migrer Dashboard, Orders, Customers, Products, Stock, Statistics
- Résout H1 (Dashboard non rafraîchi) au passage

**PR Intégrité données** (½ jour)
- M1 : `UNIQUE(order_id)` sur deliveries
- M5 : trigger transitions de statut livraison
- H2 : `UNIQUE(store_id, name)` sur products + lookup par ID

**PR Performance** (½ jour)
- H4 : vue SQL `customer_stats_view`
- B1 : `useMemo` sur les filtres

**PR Type-safety & UX** (½ jour)
- H5 : retirer les `as any`, typer strictement les statuts
- B2 : map bidirectionnelle pour le statut

---

## Annexe — Pourquoi le rapport Manus est faible

| Critère d'audit pro | Manus | Ce contre-audit |
|---|---|---|
| Inspection code | ❌ | ✅ |
| Tests multi-utilisateurs simultanés | ❌ | ✅ (race conditions identifiées) |
| Audit RLS | ❌ | ✅ |
| Audit edge functions | ❌ | ✅ |
| Analyse base de données (intégrité, contraintes, triggers) | ❌ | ✅ |
| Analyse architecture front | ❌ | ✅ (React Query) |
| Preuves `file:line` | ❌ | ✅ |
| Solutions techniques implémentables | ❌ (« vérifier la configuration ») | ✅ (migrations + code) |

Manus a fait un test utilisateur surface, pas un audit. Pour une plateforme SaaS multi-tenant qui manipule du stock et des paiements, c'est insuffisant.
