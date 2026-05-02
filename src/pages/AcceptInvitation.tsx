import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type State = "loading" | "success" | "error" | "already_member";

export default function AcceptInvitation() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Lien d'invitation invalide ou expiré.");
      return;
    }

    async function accept() {
      // Supabase redirects here after authenticating the user via magic link.
      // The session is already set in the Supabase client via the URL hash tokens.
      // We poll briefly to give the client time to exchange the hash tokens.
      let session = null;
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        session = data.session;
        if (session) break;
        await new Promise((r) => setTimeout(r, 300));
      }

      if (!session?.user) {
        setState("error");
        setMessage("Session expirée. Demandez à l'administrateur de renvoyer l'invitation.");
        return;
      }

      const userId = session.user.id;

      // Look up the invitation by token
      const { data: invitation, error: invErr } = await supabase
        .from("team_invitations")
        .select("*")
        .eq("token", token)
        .eq("status", "pending")
        .maybeSingle();

      if (invErr || !invitation) {
        setState("error");
        setMessage("Invitation introuvable, déjà acceptée ou expirée.");
        return;
      }

      // Check if user_role already exists for this store
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

      // Create profile if missing
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

      // Mark invitation as accepted
      await supabase
        .from("team_invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);

      setState("success");
      setMessage("Votre accès a été activé avec succès !");
    }

    accept();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border p-8 text-center shadow-sm space-y-5">
        {state === "loading" && (
          <>
            <Loader2 size={40} className="animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Activation de votre accès…</p>
          </>
        )}
        {state === "success" && (
          <>
            <CheckCircle2 size={40} className="text-green-500 mx-auto" />
            <h1 className="text-xl font-bold font-[Space_Grotesk]">Bienvenue dans l'équipe !</h1>
            <p className="text-muted-foreground text-sm">{message}</p>
            <Button className="w-full" onClick={() => navigate("/dashboard")}>
              Accéder au tableau de bord
            </Button>
          </>
        )}
        {state === "already_member" && (
          <>
            <CheckCircle2 size={40} className="text-primary mx-auto" />
            <h1 className="text-xl font-bold font-[Space_Grotesk]">Accès déjà actif</h1>
            <p className="text-muted-foreground text-sm">{message}</p>
            <Button className="w-full" onClick={() => navigate("/dashboard")}>
              Aller au tableau de bord
            </Button>
          </>
        )}
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
