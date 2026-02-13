

# Plan : Systeme de Modules Dynamique pour EasyFlow SaaS

## Contexte

Actuellement, toutes les pages du dashboard sont accessibles sans restriction. Pour un SaaS vendant des services, il faut un systeme qui :
- Controle l'acces aux fonctionnalites selon les modules actives par le client
- Connecte le choix des modules (onboarding) au dashboard
- Prepare le terrain pour la facturation et les abonnements

## Approche en 3 phases

### Phase 1 : Registre de modules et acces conditionnel (Frontend)

**1.1 - Creer un registre central des modules**

Fichier `src/lib/modules-registry.ts` qui definit tous les modules avec :
- ID, nom, description, icone
- Niveau de prix (gratuit, niveau1, niveau2, niveau3)
- Routes associees (ex: `stock_auto` donne acces a `/dashboard/products` avec fonctions avancees)
- Fonctionnalites incluses dans chaque module

**1.2 - Creer un contexte React pour les modules actifs**

Fichier `src/contexts/ModulesContext.tsx` :
- Stocke la liste des modules actives pour l'utilisateur courant
- Fournit des fonctions utilitaires : `hasModule(id)`, `getActiveModules()`, `isFeatureEnabled(feature)`
- Pour l'instant, les donnees viennent du localStorage (simule), puis migreront vers la base de donnees

**1.3 - Adapter la sidebar dynamiquement**

Modifier `DashboardSidebar.tsx` pour :
- Afficher uniquement les items de menu correspondant aux modules actifs
- Afficher les items verrouilles (icone cadenas) pour les modules non actives avec un lien "Activer ce module"

**1.4 - Creer un composant ModuleGate**

Composant `src/components/modules/ModuleGate.tsx` qui enveloppe les fonctionnalites payantes :
- Si le module est actif : affiche le contenu normalement
- Si le module n'est pas actif : affiche un ecran d'upsell avec description du module et bouton "Activer"

### Phase 2 : Page de gestion des modules (dans le dashboard)

**2.1 - Page "Mes Modules" (`/dashboard/modules`)**

Interface permettant au client de :
- Voir tous les modules disponibles organises par niveau de prix
- Voir lesquels sont actifs dans son abonnement
- Activer/desactiver des modules (avec impact sur le prix affiche)
- Voir un recapitulatif du cout mensuel en FCFA

**2.2 - Connecter l'onboarding au systeme de modules**

Modifier le flux pour que les modules choisis pendant l'onboarding soient sauvegardes dans le contexte et utilises par le dashboard.

### Phase 3 : Fonctionnalites conditionnelles dans les pages existantes

**3.1 - Page Produits**

- Base gratuite : liste simple des produits
- Module `stock_auto` : ajoute la gestion automatique du stock, alertes, FIFO
- Module `custom_fields` : ajoute des champs personnalises sur les fiches produits

**3.2 - Page Clients**

- Base gratuite : liste et coordonnees
- Module `customer_history` : historique complet des achats
- Module `segmentation` : segmentation avancee et filtres
- Module `loyalty` : onglet programme fidelite

**3.3 - Page Commandes**

- Base gratuite : creation et suivi simple
- Module `custom_status` : statuts personnalisables
- Module `export` : boutons export Excel/PDF

**3.4 - Page Livraisons**

- Base gratuite : suivi basique
- Module `multi_delivery` : multi-livreurs et affectation
- Module `geo_tracking` : carte et geolocalisation temps reel

## Details techniques

### Structure des fichiers a creer/modifier

```text
src/
  lib/
    modules-registry.ts      (nouveau - definition de tous les modules)
  contexts/
    ModulesContext.tsx         (nouveau - contexte React pour modules actifs)
  components/
    modules/
      ModuleGate.tsx           (nouveau - controle d'acces aux fonctionnalites)
      ModuleCard.tsx           (nouveau - carte module pour la page gestion)
      UpgradePrompt.tsx        (nouveau - ecran d'upsell quand module inactif)
  pages/
    ModulesManagement.tsx      (nouveau - page /dashboard/modules)
```

### Fichiers a modifier

- `src/App.tsx` : ajouter route `/dashboard/modules`, wrapper avec ModulesProvider
- `src/components/dashboard/DashboardSidebar.tsx` : sidebar dynamique selon modules
- `src/pages/Orders.tsx` : envelopper fonctionnalites avancees avec ModuleGate
- `src/pages/Products.tsx` : idem
- `src/pages/Customers.tsx` : idem
- `src/pages/Deliveries.tsx` : idem
- `src/pages/Onboarding.tsx` : sauvegarder modules choisis dans le contexte

### Exemple d'utilisation de ModuleGate

```text
// Dans Products.tsx
<ModuleGate moduleId="stock_auto" fallback={<UpgradePrompt module="stock_auto" />}>
  <StockAutomationPanel />
</ModuleGate>
```

### Stockage temporaire (avant backend)

Les modules actifs seront stockes dans localStorage sous la cle `easyflow_active_modules`. Le ModulesContext lira cette valeur au demarrage et la mettra a jour lors des changements. Cette approche permet de tester tout le systeme sans backend, puis de migrer facilement vers Supabase plus tard.

## Resultat attendu

Apres cette implementation :
- Le dashboard s'adapte dynamiquement aux modules choisis par le client
- Les fonctionnalites payantes sont clairement identifiees et verrouillees
- Le client peut gerer ses modules depuis le dashboard
- Le systeme est pret pour l'ajout du backend (auth + paiement) a l'etape suivante

