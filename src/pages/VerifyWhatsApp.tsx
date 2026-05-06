import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type State = "loading" | "success" | "expired" | "error";

const VerifyWhatsApp = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const token = params.get("t");
    if (!token) {
      setState("error");
      setMessage("Lien invalide.");
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("whatsapp-verify-magic-link", {
          body: { token },
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
  }, [params, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg font-[Space_Grotesk]">IM</span>
          </div>
          <span className="text-2xl font-bold font-[Space_Grotesk] text-foreground">
            Intra<span className="text-primary">mate</span>
          </span>
        </Link>

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
            <p className="text-sm text-muted-foreground">
              Bienvenue sur Intramate. Tu vas être redirigé vers la page de connexion.
            </p>
            <p className="text-xs text-muted-foreground">Email: {email}</p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Se connecter maintenant
            </Button>
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
    </div>
  );
};

export default VerifyWhatsApp;
