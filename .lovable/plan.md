

# Strategie d'integration Facebook/Meta pour Intramate

## Analyse des deux options

### Option 1 : App embarquee dans Facebook (Facebook Tab / Embedded App)
**Verdict : Non viable sur Lovable**

Integrer Intramate directement dans Facebook (comme une app Facebook Page Tab ou un Instant Game) necessite :
- Un serveur backend capable de gerer le protocole Facebook Signed Request
- Un hebergement sur un domaine valide par Facebook App Review
- Une certification App Review complete par Meta

Lovable ne permet pas ce type d'architecture serveur. De plus, Facebook a progressivement retire le support des Page Tabs depuis 2020.

### Option 2 : Intramate comme hub central avec APIs Meta (RECOMMANDEE)
**Verdict : Faisable et strategiquement pertinent**

Intramate reste une app web independante, mais s'integre profondement avec l'ecosysteme Meta via les APIs officielles :
- **Facebook Login** pour l'authentification (via Edge Function, pas OAuth Lovable Cloud)
- **WhatsApp Business API** pour les notifications et la prise de commande
- **Messenger Platform** pour les chatbots de vente
- **Instagram Graph API** pour la gestion des DMs commerciaux

---

## Plan d'implementation : Integration Meta via Edge Functions

L'approche technique contourne la limitation de Lovable Cloud (pas de Facebook OAuth natif) en utilisant des Edge Functions comme proxy d'authentification.

### Phase 1 : Facebook Login via Edge Function

Creer une edge function `facebook-auth` qui :
1. Recoit le code OAuth de Facebook (cote client, on ouvre une popup Facebook Login)
2. Echange le code contre un access token via l'API Graph
3. Recupere le profil utilisateur (nom, email, photo, facebook_id)
4. Cree ou connecte l'utilisateur dans la base via le service role Supabase
5. Retourne un token de session Supabase au client

**Fichiers a creer/modifier :**

| Fichier | Description |
|---------|-------------|
| `supabase/functions/facebook-auth/index.ts` | Edge function qui echange le code Facebook contre une session Supabase |
| `src/lib/facebook-login.ts` | Utilitaire client qui ouvre la popup Facebook et recupere le code |
| `src/contexts/AuthContext.tsx` | Ajout de `signInWithFacebook()` |
| `src/pages/Login.tsx` | Ajout du bouton "Continuer avec Facebook" |
| `src/components/landing/HeroSection.tsx` | Restauration du bouton Facebook |
| `src/components/landing/Navbar.tsx` | Mise a jour du bouton CTA |
| `src/components/landing/CTASection.tsx` | Mise a jour du bouton CTA |

**Flux technique :**

```text
1. Client ouvre popup : https://www.facebook.com/v19.0/dialog/oauth?client_id=210441536707008&redirect_uri=...&scope=email,public_profile
2. Utilisateur autorise -> Facebook redirige avec ?code=XXX
3. Client envoie le code a l'edge function /facebook-auth
4. Edge function :
   a. Echange code -> access_token via Graph API
   b. Appelle /me?fields=id,name,email,picture -> profil Facebook
   c. Cherche si un user existe avec cet email dans auth.users
   d. Si oui : genere une session Supabase pour cet user
   e. Si non : cree un nouveau user (signUp server-side) + session
   f. Sauvegarde facebook_id dans la table profiles
   g. Retourne { session, isNewUser }
5. Client recoit la session -> setSession() -> redirection
```

**Secret necessaire :** `FACEBOOK_APP_SECRET` (le secret de l'App ID 210441536707008)

### Phase 2 : Migration base de donnees

Ajouter les colonnes manquantes a la table `profiles` :

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS facebook_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sector TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
CREATE INDEX IF NOT EXISTS idx_profiles_facebook_id ON profiles(facebook_id);
```

### Phase 3 : WhatsApp Business API (module Campagnes)

Creer une edge function `whatsapp-send` qui utilise l'API WhatsApp Business Cloud pour :
- Envoyer des messages templates (confirmations de commande, notifications)
- Recevoir des messages entrants via webhook

Cela connecte directement le module "Campagnes SMS/WhatsApp" existant au vrai backend WhatsApp.

**Secret necessaire :** `WHATSAPP_TOKEN` (token d'acces WhatsApp Business)

### Phase 4 : Messenger Chatbot (futur)

Webhook Messenger pour recevoir des commandes directement depuis Facebook Messenger, creant automatiquement des commandes dans Intramate.

### Phase 5 : Instagram DMs (futur)

Integration Instagram Graph API pour gerer les DMs commerciaux depuis le dashboard Intramate.

---

## Priorite d'implementation immediate

La Phase 1 (Facebook Login) et Phase 2 (migration DB) seront implementees en premier car elles resolvent le probleme principal : permettre aux utilisateurs Facebook de se connecter nativement.

Les phases 3-5 sont des evolutions qui renforcent le positionnement "hub Meta" mais ne bloquent pas le lancement.

## Ce qui restera en place

- Google OAuth (via Lovable Cloud) reste disponible comme methode alternative
- Email/password reste disponible
- Les trois methodes coexistent sur la page login

