

# Plan d'implementation MVP -- Phase 1 + Protection des modules

## Vue d'ensemble

Ce plan couvre 3 axes :
1. Corriger les 3 erreurs de build TypeScript
2. Connecter les donnees reelles (totalOrders/totalSpent des clients, decompte stock)
3. Marquer les modules non fonctionnels comme "Bientot disponible" pour empecher leur achat

---

## 1. Corriger les erreurs de build (3 fichiers)

**Fichiers concernes :**
- `supabase/functions/facebook-auth/index.ts` -- ligne 151 : `(err as Error).message`
- `supabase/functions/send-invitation/index.ts` -- ligne 82 : `(err as Error).message`
- `supabase/functions/submit-form/index.ts` -- ligne 185 : `(error as Error).message`

---

## 2. Calculer totalOrders et totalSpent reels dans Customers

**Fichier :** `src/pages/Customers.tsx`

Actuellement, `totalOrders` et `totalSpent` sont codes en dur a `0` (lignes 81-82). La solution :
- Apres avoir recupere les clients, faire une requete sur `orders` filtree par `store_id`
- Grouper cote client par `customer_id` pour calculer le nombre de commandes et la somme des `total_amount`
- Recuperer la date de la derniere commande pour `lastOrder`

---

## 3. Decompte automatique du stock a la creation de commande

**Fichier :** `src/pages/Orders.tsx`

Dans `handleNewOrder`, apres l'insertion des `order_items`, pour chaque article qui a un `product_id` :
- Lire le stock actuel du produit
- Soustraire la quantite commandee
- Mettre a jour le stock via `supabase.from("products").update({ stock })`

Cela necessite que les items du formulaire de commande referencent un `product_id`. Verification du `NewOrderDialog` pour confirmer si c'est deja le cas.

---

## 4. Marquer les modules non fonctionnels comme "Bientot disponible"

**Fichier :** `src/lib/modules-registry.ts`
- Ajouter un champ `available: boolean` a l'interface `ModuleDefinition`
- Marquer `available: true` pour les modules fonctionnels :
  - Tous les modules gratuits (dashboard, orders_basic, customers_basic, delivery_basic, team_basic)
  - extra_callers, extra_preparers, extra_drivers
  - campaigns
  - embed_forms
  - customer_history (une fois les stats reelles branchees)
  - export (sera implemente en Phase 2)
- Marquer `available: false` pour les modules non implementes :
  - custom_fields, custom_status, message_templates
  - stock_auto, multi_delivery, call_center, warehouse_team
  - segmentation, loyalty
  - geo_tracking, automations, api, multi_store, ai_assistant

**Fichier :** `src/components/modules/ModuleCard.tsx`
- Si `module.available === false` : afficher un badge "Bientot disponible", desactiver le switch, griser la carte

**Fichier :** `src/components/billing/PaymentCheckout.tsx`
- Filtrer les modules non disponibles pour empecher leur inclusion dans le panier de paiement

---

## Resume des fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `supabase/functions/facebook-auth/index.ts` | Cast err as Error |
| `supabase/functions/send-invitation/index.ts` | Cast err as Error |
| `supabase/functions/submit-form/index.ts` | Cast error as Error |
| `src/pages/Customers.tsx` | Requete orders pour totalOrders/totalSpent reels |
| `src/pages/Orders.tsx` | Decompte stock auto apres creation commande |
| `src/lib/modules-registry.ts` | Ajouter champ `available` a chaque module |
| `src/components/modules/ModuleCard.tsx` | UI "Bientot disponible" + switch desactive |
| `src/components/billing/PaymentCheckout.tsx` | Filtrer modules non disponibles |

Aucune migration de base de donnees n'est necessaire pour cette phase.

