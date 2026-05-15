import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type SignupState = "loading" | "success" | "expired" | "error";
type InviteState = "loading_inv" | "show_form" | "submitting" | "inv_success" | "inv_error";

const Logo = () => (
  <Link to="/" className="flex items-center justify-center gap-2 mb-8">
    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
      <span className="text-primary-foreground font-bold text-lg font-[Space_Grotesk]">IM</span>
    </div>
    <span className="text-2xl font-bold font-[Space_Grotesk] text-foreground">
      Intra<span className="text-primary">mate</span>
    </span>
  </Link>
);

// ── Invitation flow ──────────────────────────────────────────────────────────

function InvitationFlow({ invToken }: { invToken: string }) {
  const navigate = useNavigate();
  const [state, setState]       = useState<InviteState>("loading_inv");
  const [storeName, setStoreName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [formError, setFormError] = useState("");

  // Load invitation info (store name) for display
  useEffect(() => {
    (async () => {
      const { data: inv } = await supabase
        .from("team_invitations")
        .select("stores(name)")
        .eq("token", invToken)
        .eq("status", "pending")
        .maybeSingle();

      if (!inv) {
        setState("inv_error");
        setErrorMsg("Invitation introuvable, déjà acceptée ou expirée.");
        return;
      }
      setStoreName((inv as any).stores?.name ?? "votre boutique");
      setState("show_form");
    })();
  }, [invToken]);

  const handleSubmit = async () => {
    setFormError("");
    if (!name.trim()) { setFormError("Votre nom est requis."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFormError("Email invalide."); return; }
    if (password.length < 8) { setFormError("Mot de passe trop court (8 caractères minimum)."); return; }
    if (password !== confirm) { setFormError("Les mots de passe ne correspondent pas."); return; }

    setState("submitting");

    const { data, error } = await supabase.functions.invoke("whatsapp-accept-invitation", {
      body: { invitation_token: invToken, email, password, name: name.trim() },
    });

    if (error || !data?.success) {
      const msg = data?.error || error?.message || "Erreur inattendue.";
      if (data?.email_exists) {
        setFormError("Ce compte existe déjà. Connectez-vous puis acceptez l'invitation.");
        setState("show_form");
      } else {
        setState("inv_error");
        setErrorMsg(msg);
      }
      return;
    }

    setState("inv_success");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
      <Logo />

      {state === "loading_inv" && (
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin mx-auto text-primary" size={48} />
          <p className="text-sm text-muted-foreground">Chargement de l'invitation…</p>
        </div>
      )}

      {state === "show_form" && (
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold font-[Space_Grotesk]">Rejoindre {storeName}</h1>
            <p className="text-sm text-muted-foreground">Créez votre compte pour accepter l'invitation.</p>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="inv-name">Votre nom</Label>
              <Input id="inv-name" className="mt-1" placeholder="Prénom Nom" value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>
            <div>
              <Label htmlFor="inv-email">Email</Label>
              <Input id="inv-email" type="email" className="mt-1" placeholder="vous@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="inv-pwd">Mot de passe</Label>
              <div className="relative mt-1">
                <Input id="inv-pwd" type={showPwd ? "text" : "password"} placeholder="8 caractères minimum" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="inv-confirm">Confirmer le mot de passe</Label>
              <Input id="inv-confirm" type="password" className="mt-1" placeholder="Retapez le mot de passe" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>
            {formError && <p className="text-destructive text-sm">{formError}</p>}
          </div>

          <Button className="w-full" onClick={handleSubmit}>
            Créer mon compte et rejoindre l'équipe
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Déjà un compte ?{" "}
            <button className="underline text-primary" onClick={() => navigate("/login")}>Se connecter</button>
          </p>
        </div>
      )}

      {state === "submitting" && (
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin mx-auto text-primary" size={48} />
          <p className="text-sm text-muted-foreground">Création de votre compte…</p>
        </div>
      )}

      {state === "inv_success" && (
        <div className="text-center space-y-4">
          <CheckCircle2 className="mx-auto text-green-500" size={64} />
          <h1 className="text-2xl font-bold font-[Space_Grotesk]">Bienvenue dans l'équipe !</h1>
          <p className="text-sm text-muted-foreground">
            Votre compte est créé et votre accès à <strong>{storeName}</strong> est activé.
          </p>
          <Button className="w-full" onClick={() => navigate("/login")}>
            Se connecter maintenant
          </Button>
        </div>
      )}

      {state === "inv_error" && (
        <div className="text-center space-y-4">
          <XCircle className="mx-auto text-destructive" size={64} />
          <h1 className="text-xl font-semibold">Erreur</h1>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
          <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
            <ArrowLeft size={16} className="mr-2" /> Retour
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// ── Signup flow (existing) ───────────────────────────────────────────────────

function SignupFlow({ waToken }: { waToken: string }) {
  const navigate = useNavigate();
  const [state, setState] = useState<SignupState>("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("whatsapp-verify-magic-link", {
          body: { token: waToken },
        });
        if (error) throw error;
        if (data?.success) {
          setEmail(data.email);
          setState("success");
          setTimeout(() => navigate("/login"), 3000);
        } else if (data?.expired) {
          setState("expired");
          setMessage(data.error);
        } else {
          setState("error");
          setMessage(data?.error || "Vérification échouée.");
        }
      } catch (err: any) {
        setState("error");
        setMessage(err.message || "Vérification échouée.");
      }
    })();
  }, [waToken, navigate]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
      <Logo />

      {state === "loading" && (
        <div className="space-y-4">
          <Loader2 className="animate-spin mx-auto text-primary" size={48} />
          <h1 className="text-xl font-semibold">Vérification en cours...</h1>
          <p className="text-sm text-muted-foreground">On active ton compte, ça prend quelques secondes.</p>
        </div>
      )}

      {state === "success" && (
        <div className="space-y-4">
          <CheckCircle2 className="mx-auto text-green-500" size={64} />
          <h1 className="text-2xl font-bold">Compte activé !</h1>
          <p className="text-sm text-muted-foreground">Bienvenue sur Intramate. Tu vas être redirigé vers la page de connexion.</p>
          <p className="text-xs text-muted-foreground">Email: {email}</p>
          <Button onClick={() => navigate("/login")} className="w-full">Se connecter maintenant</Button>
        </div>
      )}

      {state === "expired" && (
        <div className="space-y-4">
          <XCircle className="mx-auto text-orange-500" size={64} />
          <h1 className="text-xl font-semibold">Lien expiré</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button onClick={() => navigate("/login")} variant="outline" className="w-full">
            <ArrowLeft size={16} className="mr-2" /> Recommencer l'inscription
          </Button>
        </div>
      )}

      {state === "error" && (
        <div className="space-y-4">
          <XCircle className="mx-auto text-destructive" size={64} />
          <h1 className="text-xl font-semibold">Erreur</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button onClick={() => navigate("/login")} variant="outline" className="w-full">
            <ArrowLeft size={16} className="mr-2" /> Retour
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// ── Router ───────────────────────────────────────────────────────────────────

const VerifyWhatsApp = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const invToken = params.get("inv");
  const waToken  = params.get("t");

  if (invToken) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <InvitationFlow invToken={invToken} />
    </div>
  );

  if (waToken) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <SignupFlow waToken={waToken} />
    </div>
  );

  // No valid param
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center space-y-4">
        <Logo />
        <XCircle className="mx-auto text-destructive" size={64} />
        <h1 className="text-xl font-semibold">Lien invalide</h1>
        <Button onClick={() => navigate("/login")} variant="outline" className="w-full">
          <ArrowLeft size={16} className="mr-2" /> Retour
        </Button>
      </motion.div>
    </div>
  );
};

export default VerifyWhatsApp;
