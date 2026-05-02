import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, RefreshCw, LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function VerifyEmail() {
  const { user, logout } = useAuth();
  const [sending, setSending] = useState(false);

  const handleResend = async () => {
    if (!user?.email) return;
    setSending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: user.email });
    setSending(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email envoyé", description: "Vérifiez votre boîte de réception." });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail size={32} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-[Space_Grotesk] mb-1">Confirmez votre adresse email</h1>
            <p className="text-sm text-muted-foreground">
              Un email de confirmation a été envoyé à <strong>{user?.email}</strong>.
              Cliquez sur le lien dans l'email pour activer votre compte.
            </p>
          </div>
          <Button onClick={handleResend} disabled={sending} variant="outline" className="gap-2">
            <RefreshCw size={14} className={sending ? "animate-spin" : ""} />
            {sending ? "Envoi…" : "Renvoyer l'email"}
          </Button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={12} /> Se déconnecter
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
