
## Objectif
Soumettre le template `intramate_account_confirmation` à Meta avec une configuration **100% compatible** avec le code edge function déjà déployé.

## Côté Meta — ce qu'il reste à faire

### ✅ Déjà bon sur ta capture
- **URL du site Web** : `https://intramatepro.lovable.app/verify{{1}}` ✓
- **Type d'URL** : Dynamique ✓
- **Texte du bouton** : "Confirmer mon compte" ✓
- **Aperçu du modèle** : Le rendu du message s'affiche correctement ✓
- **Période de validité** : Activée (recommandé : 30 minutes pour matcher l'expiration du token côté backend) ✓

### ⚠️ À CORRIGER avant de cliquer sur "Soumettre à examen"

**Exemple d'URL** actuel :
```
https://intramatepro.lovable.app/verify
```

**Remplace par** (Meta exige un exemple **complet** incluant la valeur de `{{1}}`, sinon refus quasi systématique) :
```
https://intramatepro.lovable.app/verify?t=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

> 💡 Pourquoi : Meta utilise cet exemple pour vérifier que le lien généré est valide et sûr. Sans valeur factice du paramètre, ils considèrent l'URL comme cassée.

### Vérifications finales avant soumission
- [ ] **Catégorie** : UTILITY (obligatoire — pas Marketing, sinon refus)
- [ ] **Langue** : Français (`fr`) — doit matcher le secret `META_WHATSAPP_LANGUAGE`
- [ ] **Nom du template** : `intramate_account_confirmation` — doit matcher exactement le secret `META_WHATSAPP_TEMPLATE_NAME`
- [ ] **Variable `{{1}}` du body** : doit correspondre au prénom du user (mon code envoie `name` en paramètre body)
- [ ] **Période de validité** : 30 min recommandé (aligné avec le backend)

## Après soumission

1. Tu cliques sur **"Soumettre à examen"**
2. Délai d'approbation Meta : **1 à 24h** (souvent < 2h pour UTILITY)
3. Tu reçois la notification d'approbation dans Meta Business
4. Tu me préviens → on lance un **test end-to-end ensemble** :
   - Inscription depuis `/login` avec ton vrai numéro WhatsApp
   - Réception du message WhatsApp avec le bouton "Confirmer mon compte"
   - Clic → redirection vers `/verify?t=...`
   - Création automatique du compte + redirection vers le dashboard

## Si Meta refuse (plan B)

Causes fréquentes de refus pour ce type de template :
- Mauvaise catégorie (Marketing au lieu de Utility)
- Exemple d'URL incomplet (le problème ci-dessus)
- Mots déclencheurs dans le body ("gratuit", "promo", "offre")
- Numéro WhatsApp Business non vérifié

Copie-colle moi la **raison exacte du refus** et on ajuste ensemble.

## Côté code — rien à faire
Tout est déjà en place et aligné :
- ✅ Edge function `whatsapp-send-magic-link` envoie `{{1}}` = `?t=TOKEN`
- ✅ Edge function `whatsapp-verify-magic-link` lit le token et crée le compte
- ✅ Page `/verify` (`VerifyWhatsApp.tsx`) gère la redirection
- ✅ Tous les secrets Meta sont configurés (`META_WHATSAPP_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID`, `META_WHATSAPP_TEMPLATE_NAME`, `META_WHATSAPP_LANGUAGE`)

**Aucune modification de code requise — uniquement l'action Meta côté toi.**
