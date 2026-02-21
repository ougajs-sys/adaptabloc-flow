

# Page Statistiques -- Simple, visuelle, comprehensible par tous

## Philosophie
La page sera concue pour etre comprise par n'importe qui, meme sans aucune connaissance en statistiques. Chaque chiffre sera accompagne d'une **explication en langage courant**, d'**icones expressives** et de **couleurs intuitives** (vert = bien, rouge = attention, bleu = info). Pas de jargon technique.

## Structure de la page

### En-tete
- Titre : "Statistiques" via `DashboardLayout`
- Un selecteur de periode simple : "Cette semaine" / "Ce mois" / "Tout" (Select)

---

### Section 1 -- 4 cartes KPI avec explications humaines

Chaque carte affiche : une grosse valeur, une icone, et une **phrase explicative** en dessous.

| Carte | Valeur | Phrase explicative |
|-------|--------|--------------------|
| Taux de confirmation | 75% | "Sur 10 commandes recues, 7 à 8 ont ete confirmees par les callers" |
| Temps moyen de preparation | ~2h | "En moyenne, un colis est pret 2 heures apres la confirmation" |
| Taux de livraison reussie | 85% | "Sur 10 colis envoyes, 8 à 9 arrivent chez le client" |
| Panier moyen | 45 000 F | "En moyenne, chaque client depense 45 000 F par commande" |

Reutilise le composant `KpiCard` existant, enrichi d'un sous-texte explicatif.

---

### Section 2 -- "Ou en sont vos commandes ?" (Funnel visuel)

**BarChart horizontal** montrant le nombre de commandes a chaque etape du pipeline.

- Chaque barre porte le label de l'etape ("Nouvelles", "En confirmation", "En preparation"...)
- Les couleurs suivent celles de `pipelineStages` (bleu caller, ambre preparateur, vert livreur)
- Titre de section : "Ou en sont vos commandes ?"
- Sous-titre : "Ce graphique montre combien de commandes se trouvent a chaque etape"

---

### Section 3 -- Deux graphiques cote a cote

**Gauche : "Vos revenus jour par jour" (AreaChart)**
- Courbe du CA quotidien des commandes livrees sur la periode
- Gradient violet (meme style que `RevenueChart`)
- Sous-titre : "Combien vous avez gagne chaque jour grace aux commandes livrees"

**Droite : "Qui fait quoi dans l'equipe ?" (BarChart vertical)**
- Une barre par membre de l'equipe, coloree selon le role
- Valeur = nombre de commandes traitees (`ordersHandled`)
- Sous-titre : "Nombre de commandes gerees par chaque membre de votre equipe"
- Couleurs : bleu (caller), ambre (preparateur), vert (livreur)

---

### Section 4 -- "Vos livreurs en detail" (Tableau simple)

Un tableau Card avec les colonnes :
- Nom du livreur
- Commandes traitees
- Un badge de performance (Excellent / Bon / A suivre) base sur le nombre de commandes

Sous-titre : "Un resume de l'activite de chaque livreur"

---

## Fichiers

### Nouveau : `src/pages/Statistics.tsx`
- Page complete avec `DashboardLayout`
- Calculs dynamiques via `useMemo` depuis `initialOrders` et `mockTeamMembers`
- Utilise `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` (pattern existant)
- Recharts : `BarChart`, `Bar`, `AreaChart`, `Area`, `XAxis`, `YAxis`, `CartesianGrid`, `Cell`
- Chaque section a un titre en gros + sous-titre explicatif en `text-muted-foreground`
- Selecteur de periode en haut (`Select` de shadcn)

### Modification : `src/App.tsx`
- Ajouter `import Statistics from "./pages/Statistics"`
- Ajouter `<Route path="/dashboard/stats" element={<Statistics />} />`

La sidebar contient deja le lien "Statistiques" vers `/dashboard/stats`, aucune modification necessaire.

## Details techniques

- Taux de confirmation = commandes (confirmed + preparing + ready + in_transit + delivered) / (total - new) x 100
- Taux de livraison = delivered / (in_transit + delivered + returned) x 100
- Panier moyen = somme des totaux des commandes livrees / nombre de commandes livrees
- Temps de preparation : simule a partir des donnees existantes (pas de timestamps par etape), affiche une valeur estimee
- Performance livreur : basee sur `ordersHandled` de `mockTeamMembers` filtre par role "livreur"
- Toutes les donnees sont calculees depuis `initialOrders` et `mockTeamMembers` -- pas de donnees en dur
- Labels 100% generiques, aucune reference a un secteur d'activite specifique

