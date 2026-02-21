

# Plan d'implementation -- Les 20% restants d'EasyFlow

## Vue d'ensemble

Ce plan couvre les 7 chantiers necessaires pour amener le frontend a 100% de completion, sans toucher au backend.

---

## Chantier 1 -- Protection des routes et lien Auth-Onboarding

**Probleme actuel :** N'importe qui peut acceder a `/dashboard` sans etre connecte. L'onboarding ne marque jamais `has_completed_onboarding = true`, donc l'utilisateur revoit l'onboarding a chaque connexion.

**Fichiers concernes :**
- `src/App.tsx` -- Ajouter un composant `ProtectedRoute` qui wrappe toutes les routes `/dashboard/*`
- `src/pages/Onboarding.tsx` -- A l'etape finale (Lancement), appeler `markOnboardingComplete()` du auth-store
- `src/pages/Login.tsx` -- Apres connexion, verifier `has_completed_onboarding` : si `false` -> `/onboarding`, si `true` -> `/dashboard`

**Composant `ProtectedRoute` :**
- Verifie `isAuthenticated` via `useAuth()`
- Si non connecte -> redirige vers `/login`
- Si connecte mais onboarding incomplet -> redirige vers `/onboarding`
- Sinon -> affiche le contenu

---

## Chantier 2 -- Nettoyage du billing-store (coherence modulaire)

**Probleme actuel :** `billing-store.ts` contient des plans fixes (Free/Pro/Enterprise) et des factures mock qui referent "Pro" et "Gratuit". C'est incoherent avec le modele modulaire.

**Fichiers concernes :**
- `src/lib/billing-store.ts` :
  - Supprimer l'interface `Plan`, le tableau `plans[]`, `getPlanById()`, l'interface `Subscription`, `getSubscription()`, `setSubscription()`
  - Modifier l'interface `Invoice` : remplacer le champ `plan: string` par `modules: string[]` (liste des modules actifs ce mois-la)
  - Mettre a jour `mockInvoices` : les montants doivent correspondre a des sommes de modules, pas a des plans fixes
- `src/pages/Settings.tsx` (BillingTab, lignes 196-381) :
  - Supprimer les references a `getSubscription()`, `getPlanById()`, `currentPlan`
  - Remplacer la carte "Abonnement actuel" par un affichage du cout mensuel dynamique base sur `monthlyPrice` du `ModulesContext`
  - Supprimer la colonne "Plan" dans le tableau des factures, la remplacer par "Modules"
- `src/pages/Billing.tsx` :
  - Supprimer la colonne "Plan" du tableau de factures (deja coherent pour le reste)

---

## Chantier 3 -- CRUD Edition et Suppression des Commandes

**Probleme actuel :** On peut creer et visualiser les commandes, mais pas les modifier ni les supprimer.

**Fichiers concernes :**
- Creer `src/components/orders/EditOrderDialog.tsx` -- Formulaire pre-rempli identique a `NewOrderDialog` mais en mode edition
- `src/pages/Orders.tsx` :
  - Ajouter un state `editingOrder` pour l'edition
  - Dans le dialog de detail (ligne 323), ajouter deux boutons : "Modifier" et "Supprimer"
  - Fonction `handleEditOrder` : met a jour l'order dans le state
  - Fonction `handleDeleteOrder` : retire l'order du state avec confirmation via `AlertDialog`
  - Dans la vue liste, ajouter une colonne actions avec icones Edit/Trash

---

## Chantier 4 -- CRUD Edition et Suppression des Produits

**Probleme actuel :** On peut creer et voir les produits mais pas les modifier ni les supprimer. Pas de dialog de detail au clic.

**Fichiers concernes :**
- Creer `src/components/products/EditProductDialog.tsx` -- Formulaire pre-rempli
- Creer `src/components/products/ProductDetailDialog.tsx` -- Vue detail au clic sur une carte produit
- `src/pages/Products.tsx` :
  - Ajouter un state `selectedProduct` pour le detail et `editingProduct` pour l'edition
  - Au clic sur une carte produit -> ouvrir `ProductDetailDialog` avec boutons "Modifier" / "Supprimer"
  - Fonction `handleEditProduct` et `handleDeleteProduct`

---

## Chantier 5 -- CRUD Edition et Suppression des Membres d'equipe

**Probleme actuel :** On peut ajouter des membres mais pas les modifier ni les supprimer.

**Fichiers concernes :**
- Creer `src/components/team/EditMemberDialog.tsx`
- `src/pages/Team.tsx` :
  - Ajouter une colonne "Actions" dans le tableau (ligne 109+)
  - Boutons icones Edit et Trash par ligne
  - Fonction `handleEditMember` et `handleDeleteMember`
  - Confirmation de suppression via `AlertDialog`

---

## Chantier 6 -- Fiche client detaillee

**Probleme actuel :** Les lignes clients ont `cursor-pointer` mais aucun clic ne fait rien.

**Fichiers concernes :**
- Creer `src/components/customers/CustomerDetailDialog.tsx` :
  - Infos completes : nom, email, telephone, segment, date d'inscription
  - Historique d'achats simule (lie aux commandes mock)
  - Points fidelite avec barre de progression
  - Boutons "Modifier" et "Supprimer"
- Creer `src/components/customers/EditCustomerDialog.tsx`
- `src/pages/Customers.tsx` :
  - Ajouter states `selectedCustomer` et `editingCustomer`
  - Au clic sur une ligne -> ouvrir `CustomerDetailDialog`
  - Fonctions `handleEditCustomer` et `handleDeleteCustomer`

---

## Chantier 7 -- Pages manquantes (Aide + Campagnes)

**Probleme actuel :** Les liens "Aide" et "Campagnes" dans la sidebar pointent vers des routes qui n'existent pas (404).

**Fichiers concernes :**
- Creer `src/pages/Help.tsx` :
  - Page FAQ avec accordion (questions courantes)
  - Section contact support avec bouton email/WhatsApp
  - Guide de demarrage rapide en 3 etapes
- Creer `src/pages/Campaigns.tsx` :
  - Page protegee par `ModuleGate` (module "campaigns")
  - Liste de campagnes mock (SMS/WhatsApp/Email)
  - Bouton "Nouvelle campagne" avec formulaire basique
  - KPIs : campagnes envoyees, taux d'ouverture, taux de conversion
- `src/App.tsx` : Ajouter les routes `/dashboard/help` et `/dashboard/campaigns`

---

## Resume de l'impact

| Chantier | Fichiers crees | Fichiers modifies |
|---|---|---|
| 1. Protection routes + Auth-Onboarding | 0 | 3 (App, Onboarding, Login) |
| 2. Nettoyage billing | 0 | 3 (billing-store, Settings, Billing) |
| 3. CRUD Commandes | 1 (EditOrderDialog) | 1 (Orders) |
| 4. CRUD Produits | 2 (EditProduct, ProductDetail) | 1 (Products) |
| 5. CRUD Equipe | 1 (EditMemberDialog) | 1 (Team) |
| 6. Fiche client | 2 (CustomerDetail, EditCustomer) | 1 (Customers) |
| 7. Pages manquantes | 2 (Help, Campaigns) | 1 (App) |
| **Total** | **8 fichiers** | **11 fichiers** |

## Ordre d'implementation recommande

1. Chantier 1 (protection routes) -- fondation securite
2. Chantier 2 (billing) -- coherence du modele economique
3. Chantiers 3-6 (CRUD) -- en parallele, meme pattern repete
4. Chantier 7 (pages manquantes) -- derniere couche

Apres cette implementation, le frontend sera a **100%** et pret pour la connexion Supabase.

