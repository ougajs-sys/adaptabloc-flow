

# Redesign Premium de la Page d'Accueil -- Concept "Briques Modulaires"

## Vision

Transformer la landing page en une experience visuelle premium qui illustre le concept central d'Intramate : des briques/modules qui s'assemblent comme un puzzle pour creer un systeme sur mesure. L'animation hero montrera les modules flottants qui s'emboitent dynamiquement, evoquant immediatement la modularite et la simplicite.

---

## 1. Hero Section -- Animation "Briques qui s'assemblent"

Remplacer le hero actuel par une animation immersive :

- **Fond** : Gradient fluide violet-vers-mint avec particules lumineuses subtiles
- **Animation centrale** : Une grille de briques/cartes 3D representant les modules (Commandes, Clients, Livraisons, Stock, Campagnes, etc.) qui flottent separement puis s'assemblent progressivement en un tableau de bord unifie
- **Chaque brique** affiche l'icone + le nom du module avec un leger effet de profondeur (ombre, rotation 3D)
- **Sequence** : Les briques arrivent en cascade depuis differentes directions, tournent legerement, puis "cliquent" en place comme un puzzle -- evoquant la personnalisation
- **Texte hero** superpose : "Construisez VOTRE systeme, brique par brique" avec le sous-titre actuel
- **CTA** : Boutons existants (Facebook + Demo) avec un style glass-morphism premium

**Technologie** : Framer Motion `layout` animations + `variants` pour orchestrer l'assemblement des briques.

---

## 2. Section "Modules Interactifs" (remplace FeaturesSection)

Une grille interactive de briques modules :

- **Vue grille isometrique** : Les modules sont presentes comme des briques colorees dans une grille
- **Hover** : Au survol, chaque brique s'eleve avec une ombre portee, revele sa description et pulse avec sa couleur de tier
- **Couleurs par tier** : Gratuit = vert mint, Tier 1 = violet clair, Tier 2 = violet, Tier 3 = violet fonce/dore
- **Effet "drag"** visuel : Les briques semblent deplacables (animation subtile de tremblement au hover)
- **Compteur dynamique** : "22 modules disponibles -- Composez votre systeme ideal"

---

## 3. Section "Comment ca marche" -- Timeline Animee

Ameliorer la section existante :

- **Timeline verticale** avec une ligne animee qui se dessine au scroll
- **Etape 2 revisitee** : Au lieu d'un simple texte, montrer une mini-animation de 3-4 briques qui s'ajoutent a un cadre avec le prix qui se calcule en temps reel
- **Micro-interactions** : Chaque etape s'anime a l'entree dans le viewport

---

## 4. Section "Preuve Sociale / Stats" (nouvelle)

Ajouter une section de confiance entre Features et Pricing :

- Compteurs animes (commandes gerees, utilisateurs, pays)
- Style : grands chiffres en Space Grotesk avec animation de comptage au scroll

---

## 5. Section Pricing -- Glass-morphism

Ameliorer le design existant :

- Cartes en glass-morphism (fond semi-transparent, blur, bordure lumineuse)
- Plan populaire avec un halo lumineux anime
- Les modules inclus dans chaque plan affiches comme des mini-briques colorees

---

## 6. CTA Final -- Parallaxe de Briques

- Fond avec des briques de modules qui flottent en parallaxe leger
- Effet de profondeur immersif
- Texte et bouton au centre avec effet glow

---

## 7. Navbar + Footer

- **Navbar** : Ajouter un effet de scroll progressif (background qui se solidifie au scroll)
- **Footer** : Design plus riche avec colonnes de liens, badges "Fait en Afrique", liens sociaux

---

## Details Techniques

### Fichiers a creer
- `src/components/landing/ModularBricksHero.tsx` -- Nouvelle animation hero avec briques assemblantes
- `src/components/landing/InteractiveModulesSection.tsx` -- Grille interactive de modules
- `src/components/landing/StatsSection.tsx` -- Compteurs animes
- `src/components/landing/FloatingBrick.tsx` -- Composant brique reutilisable avec animations

### Fichiers a modifier
- `src/components/landing/HeroSection.tsx` -- Remplacer par le nouveau hero
- `src/components/landing/FeaturesSection.tsx` -- Remplacer par la grille interactive
- `src/components/landing/HowItWorksSection.tsx` -- Ameliorer avec timeline animee
- `src/components/landing/PricingSection.tsx` -- Glass-morphism + mini-briques
- `src/components/landing/CTASection.tsx` -- Parallaxe de briques flottantes
- `src/components/landing/Navbar.tsx` -- Effet scroll progressif
- `src/components/landing/Footer.tsx` -- Design enrichi
- `src/pages/Landing.tsx` -- Integrer les nouvelles sections
- `src/index.css` -- Ajouter les styles glass-morphism et animations custom

### Dependances
Aucune nouvelle dependance -- tout sera fait avec Framer Motion (deja installe) et Tailwind CSS.

### Donnees dynamiques
Les briques du hero et de la section modules utiliseront directement `modulesRegistry` de `src/lib/modules-registry.ts` pour afficher les vrais noms, icones et couleurs des modules -- garantissant la coherence avec le produit reel.

