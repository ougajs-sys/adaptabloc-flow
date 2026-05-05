
# Inscription avec confirmation WhatsApp (Meta Cloud API)

## Vision

Deux portes d'entrée à l'inscription, une seule porte de sortie de la confirmation :

```text
┌──────────────────┐     ┌──────────────────┐
│ Inscription tel  │     │ Inscription mail │
│ + mot de passe   │     │ + mot de passe   │
│ + n° WhatsApp    │     │ + n° WhatsApp    │
└────────┬─────────┘     └─────────┬────────┘
         │                         │
         └────────────┬────────────┘
                      ▼
        ┌──────────────────────────┐
        │ OTP 6 chiffres → WhatsApp│  (Meta Cloud API)
        │ Saisie + vérification    │
        └────────────┬─────────────┘
                     ▼
        ┌──────────────────────────┐
        │ Compte confirmé          │
        │ Email de bienvenue       │  (Lovable Emails)
        │ Onboarding magasin       │
        └────────────┬─────────────┘
                     ▼
        ┌──────────────────────────┐
        │ Logins suivants :        │
        │ email/tel + mot de passe │
        └──────────────────────────┘
```

Les logins ultérieurs restent classiques (mot de passe), pas d'OTP à chaque connexion.

## Architecture choisie

**Pas de Supabase Phone Auth.** On utilise Supabase Auth en mode email/password classique (le numéro de téléphone est juste une donnée de profil), et on construit un flux OTP WhatsApp custom contrôlé par nos edge functions. Cela permet :
- D'utiliser **Meta Cloud API directement** (gratuit jusqu'à 1000 conversations/mois)
- D'avoir le même flux OTP qu'on choisisse email ou téléphone à l'inscription
- De ne pas dépendre de Twilio
- De gérer rate-limit, expiration, anti-bruteforce nous-mêmes

Le compte Supabase est créé **avec `email_confirm: false`** côté admin, puis activé seulement après vérification OTP WhatsApp réussie.

## Étapes d'implémentation

### 1. Base de données

Nouvelle table `whatsapp_otps` :
- `id`, `user_id` (nullable, lié après création), `phone_e164`, `email`
- `code_hash` (SHA-256, jamais en clair), `purpose` (`signup` | `recovery`)
- `attempts` (max 5), `expires_at` (10 min), `verified_at`, `created_at`
- Index sur `phone_e164` + `purpose`, RLS = aucun accès client direct (tout passe par edge functions service role)

Ajout colonne `phone_e164` + `phone_verified_at` sur `profiles` si absentes.

Table `whatsapp_send_log` (audit + rate-limit) : `phone_e164`, `ip`, `created_at`.

### 2. Secrets Meta Cloud API

Demander à l'utilisateur via `add_secret` :
- `META_WHATSAPP_TOKEN` (token permanent du System User)
- `META_WHATSAPP_PHONE_NUMBER_ID`
- `META_WHATSAPP_TEMPLATE_NAME` (nom du template OTP approuvé par Meta, ex `intramate_otp`)
- `META_WHATSAPP_LANGUAGE` (ex `fr`)

**Action requise du côté de Meta Business Manager** (à faire en parallèle, je guiderai) :
1. Créer un compte WhatsApp Business + numéro vérifié
2. Soumettre un template d'authentification de catégorie **AUTHENTICATION** avec un placeholder `{{1}}` pour le code (Meta exige cette catégorie pour les OTP)
3. Récupérer le Phone Number ID et générer un System User Token permanent

### 3. Edge functions (3 nouvelles)

**`whatsapp-send-otp`** (public, pas de JWT)
- Body : `{ phone, email?, purpose }`
- Validation Zod (E.164, email valide)
- Rate-limit : max 3 envois / numéro / heure, max 10 / IP / heure
- Génère code 6 chiffres aléatoire, hash SHA-256, insert dans `whatsapp_otps`
- Appelle Meta Cloud API : `POST graph.facebook.com/v21.0/{PHONE_ID}/messages` avec template authentication
- Retourne `{ otpId, expiresIn: 600 }` (jamais le code)

**`whatsapp-verify-otp`** (public)
- Body : `{ phone, code, signupData: { email, password, name, fullPhone } }`
- Vérifie hash, expiration, attempts, increment attempts si faux
- Si OK :
  - Crée user Supabase via `admin.createUser({ email, password, email_confirm: true, phone_confirm: false })`
  - Insert profil avec `phone_e164` et `phone_verified_at`
  - Marque OTP `verified_at`
  - Déclenche email de bienvenue via `send-transactional-email`
  - Retourne session (sign-in admin) ou demande au client de faire `signInWithPassword`

**`whatsapp-resend-otp`** (public)
- Renvoie un nouveau code (invalide les précédents pour ce phone+purpose), respecte rate-limit

### 4. Frontend — refonte page inscription

Modifier `src/pages/Login.tsx` (ou créer `Signup.tsx` séparé) :

**Étape 1 — Choix du mode**
- Onglets : "Avec email" / "Avec téléphone"
- Champs communs : Nom, Mot de passe, **Numéro WhatsApp (obligatoire)**
- Champ spécifique : Email OU Téléphone principal
- Sélecteur indicatif pays (libphonenumber-js) → format E.164

**Étape 2 — Vérification OTP**
- Composant `<OtpInput length={6}>` (shadcn `input-otp`)
- Compte à rebours 60s avant "Renvoyer le code"
- Message : "Code envoyé sur WhatsApp au +XXX XXX XXX XX"
- Sur succès : redirige vers `/onboarding`

**Étape 3 — Email de bienvenue (asynchrone)**
- Template React Email `welcome-signup` créé dans `_shared/transactional-email-templates/`
- Envoyé en fire-and-forget depuis `whatsapp-verify-otp`
- Prérequis : domaine email configuré + `setup_email_infra` + `scaffold_transactional_email`

### 5. Login (inchangé sauf cosmétique)
- Email **ou** téléphone (E.164) + mot de passe
- Si l'utilisateur saisit un téléphone, on résout l'email via `profiles.phone_e164` puis `signInWithPassword({ email, password })`
- Pas de "mot de passe oublié par WhatsApp" dans cette V1 (à voir plus tard)

### 6. Sécurité & garde-fous

- Tous les codes hashés (SHA-256) en base, jamais loggés
- Expiration 10 min, max 5 tentatives, invalidation après succès
- Rate-limit double : par numéro et par IP
- CAPTCHA invisible (Cloudflare Turnstile) sur l'envoi d'OTP — **optionnel V2**
- Logs structurés (sans le code) dans `whatsapp_send_log`
- Détection numéro déjà vérifié → message clair "Ce numéro est déjà associé à un compte"

### 7. Coûts & quotas

- Meta Cloud API : **gratuit jusqu'à 1000 conversations utilitaires/mois**, puis ~0,005 € à 0,08 € selon pays (Sénégal/CI/France varient)
- Pas de coût Twilio, pas de coût Supabase Phone
- Rate-limit applicatif protège du gaspillage

## Détails techniques (section dev)

- **Meta Cloud API endpoint** : `POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`
- **Payload OTP** :
  ```json
  {
    "messaging_product": "whatsapp",
    "to": "221771234567",
    "type": "template",
    "template": {
      "name": "intramate_otp",
      "language": { "code": "fr" },
      "components": [
        { "type": "body", "parameters": [{ "type": "text", "text": "123456" }] },
        { "type": "button", "sub_type": "url", "index": "0",
          "parameters": [{ "type": "text", "text": "123456" }] }
      ]
    }
  }
  ```
- Le template doit être catégorie **AUTHENTICATION** (Meta refuse l'envoi d'OTP via template marketing/utility)
- `auto_confirm_email` reste désactivé : on utilise `admin.createUser({ email_confirm: true })` côté serveur seulement après OTP validé, donc pas de mail Supabase de confirmation envoyé
- Pour `signInWithPassword` côté client après `verify-otp`, l'edge function retourne `{ email, sessionReady: true }` et le client appelle directement `supabase.auth.signInWithPassword`

## Hors scope (pour discussion future)

- Reset mot de passe par WhatsApp
- 2FA WhatsApp pour les comptes superadmin
- Inscription via lien magique WhatsApp (sans mot de passe)
- Notifications transactionnelles (commande confirmée, livraison) sur WhatsApp — réutiliserait la même infra Meta

## Estimation

~2h30 d'implémentation une fois les credentials Meta fournis. Le goulot d'étranglement est l'**approbation du template Meta** (généralement 1-24h, parfois plus) — sans template approuvé, aucun OTP ne peut être envoyé.

## Avant de lancer l'implémentation, j'ai besoin de :

1. Confirmation que tu peux créer le compte Meta Business + numéro WhatsApp Business + template AUTHENTICATION (je peux te guider pas-à-pas)
2. Validation de la stratégie "numéro WhatsApp obligatoire même quand on s'inscrit par email" (sinon, comment confirmer ?)
3. Décision pour le domaine email de bienvenue : tu en as déjà un configuré dans Lovable Cloud ou on en setup un ?
