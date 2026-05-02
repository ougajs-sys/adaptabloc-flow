import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type State = "loading" | "set_password" | "success" | "error" | "already_member";

export default function AcceptInvitation() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwdError, setPwdError] = useState("");
  // Keep invitation data for the password step
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Lien d'invitation invalide ou expiré.");
      return;
    }

    async function accept() {
      // Poll briefly to let Supabase exchange the hash tokens from the magic link
      let session = null;
      for (let i = 0; i < 15; i++) {
        const { data } = await supabase.auth.getSession();
        session = data.session;
        if (session) break;
        await new Promise((r) => setTimeout(r, 400));
      }

      if (!session?.user) {
        setState("error");
        setMessage("Session expirée. Demandez à l'administrateur de renvoyer l'invitation.");
        return;
      }

      const userId = session.user.id;

      // Fetch invitation
      const { data: invitation, error: invErr } = await supabase
        .from("team_invitations")
        .select("*, stores(name)")
        .eq("token", token)
        .eq("status", "pending")
        .maybeSingle();

      if (invErr || !invitation) {
        setState("error");
        setMessage("Invitation introuvable, déjà acceptée ou expirée.");
        return;
      }

      // Check existing role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("store_id", invitation.store_id)
        .maybeSingle();

      if (existingRole) {
        setState("already_member");
        setMessage("Vous faites déjà partie de cette équipe.");
        return;
      }

      // Create user_role
      const { error: roleErr } = await supabase.from("user_roles").insert({
        user_id: userId,
        store_id: invitation.store_id,
        role: invitation.role,
      });

      if (roleErr) {
        setState("error");
        setMessage("Impossible de créer votre accès. Contactez l'administrateur.");
        return;
      }

      // Create profile
      const name = session.user.user_metadata?.full_name
        || session.user.user_metadata?.name
        || session.user.email?.split("@")[0]
        || "Membre";

      await supabase.from("profiles").upsert({
        user_id: userId,
        store_id: invitation.store_id,
        name,
        email: session.user.email,
      }, { onConflict: "user_id,store_id" });

      // Mark invitation accepted
      await supabase
        .from("team_invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);

      // Store name for display
      setStoreName((invitation as any).stores?.name || "votre boutique");
      setInvitationId(invitation.id);

      // Move to password setup step — mandatory so the member can log in next time
      setState("set_password");
    }

    accept();
  }, [token]);

  const handleSetPassword = async () => {
    setPwdError("");
    if (password.length < 8) {
      setPwdError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setPwdError("Les mots de passe ne correspondent pas.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setPwdError(error.message);
      return;
    }
    setState("success");
  };

  const roleLabel: Record<string, string> = {
    caller: "Caller",
    preparer: "Préparateur",
    driver: "Livreur",
    admin: "Administrateur",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border p-8 text-center shadow-sm space-y-5">

        {/* Loading */}
        {state === "loading" && (
          <>
            <Loader2 size={40} className="animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Activation de votre accès…</p>
          </>
        )}

        {/* Set password — mandatory step */}
        {state === "set_password" && (
          <>
            <CheckCircle2 size={40} className="text-green-500 mx-auto" />
            <div>
              <h1 className="text-xl font-bold font-[Space_Grotesk]">Accès activé !</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Vous rejoignez <strong>{storeName}</strong>.<br />
                Définissez votre mot de passe pour pouvoir vous reconnecter à tout moment.
              </p>
            </div>
            <div className="text-left space-y-3">
              <div>
                <Label htmlFor="pwd">Mot de passe</Label>
                <div className="relative mt-1">
                  <Input
                    id="pwd"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Retapez le mot de passe"
                  className="mt-1"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSetPassword(); }}
                />
              </div>
              {pwdError && <p className="text-destructive text-sm">{pwdError}</p>}
            </div>
            <Button className="w-full" onClick={handleSetPassword} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Définir mon mot de passe et accéder au tableau de bord
            </Button>
            <p className="text-xs text-muted-foreground">
              Vous pourrez ensuite vous connecter sur{" "}
              <strong>intramate.pro/login</strong> avec votre email et ce mot de passe.
            </p>
          </>
        )}

        {/* Success after password set */}
        {state === "success" && (
          <>
            <CheckCircle2 size={40} className="text-green-500 mx-auto" />
            <h1 className="text-xl font-bold font-[Space_Grotesk]">Tout est prêt !</h1>
            <p className="text-muted-foreground text-sm">
              Votre compte est configuré. Connectez-vous à tout moment sur{" "}
              <strong>intramate.pro/login</strong> avec votre email et mot de passe.
            </p>
            <Button className="w-full" onClick={() => navigate("/dashboard")}>
              Accéder à mon espace de travail
            </Button>
          </>
        )}

        {/* Already member */}
        {state === "already_member" && (
          <>
            <CheckCircle2 size={40} className="text-primary mx-auto" />
            <h1 className="text-xl font-bold font-[Space_Grotesk]">Accès déjà actif</h1>
            <p className="text-muted-foreground text-sm">{message}</p>
            <Button className="w-full" onClick={() => navigate("/dashboard")}>
              Aller à mon espace de travail
            </Button>
          </>
        )}

        {/* Error */}
        {state === "error" && (
          <>
            <AlertCircle size={40} className="text-destructive mx-auto" />
            <h1 className="text-xl font-bold font-[Space_Grotesk]">Problème d'invitation</h1>
            <p className="text-muted-foreground text-sm">{message}</p>
            <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
              Retour à la connexion
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
