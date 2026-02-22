import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SetupAdmin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [setting, setSetting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function check() {
      // Check if any superadmin already exists
      const { data } = await supabase
        .from("user_roles")
        .select("id")
        .eq("role", "superadmin" as any)
        .limit(1);
      setAlreadyExists(!!data && data.length > 0);
      setChecking(false);
    }
    check();
  }, []);

  const handleSetup = async () => {
    if (!user) return;
    setSetting(true);
    try {
      const { error } = await supabase.from("user_roles").insert({
        user_id: user.id,
        store_id: user.store_id!,
        role: "superadmin" as any,
      });
      if (error) throw error;
      setDone(true);
      toast({ title: "Super Admin configuré !", description: "Vous avez maintenant accès au panneau Super Admin." });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSetting(false);
    }
  };

  if (isLoading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle>Accès refusé</CardTitle>
            <CardDescription>Vous devez être connecté pour accéder à cette page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/login")}>Se connecter</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (alreadyExists && !done) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
            <CardTitle>Setup déjà effectué</CardTitle>
            <CardDescription>Un Super Admin existe déjà. Cette page n'est plus accessible.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/dashboard")}>Retour au dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-primary" />
            <CardTitle>Super Admin configuré !</CardTitle>
            <CardDescription>Vous pouvez maintenant accéder au panneau d'administration.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/super-admin")}>Accéder au Super Admin</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="mx-auto h-12 w-12 text-primary" />
          <CardTitle>Configuration Super Admin</CardTitle>
          <CardDescription>
            Cette page est accessible une seule fois. Le compte connecté ({user?.email}) deviendra le Super Admin de la plateforme.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
            <p><strong>Attention :</strong> Cette action est irréversible. Assurez-vous d'être connecté avec le bon compte.</p>
          </div>
          <Button className="w-full" size="lg" onClick={handleSetup} disabled={setting}>
            {setting ? "Configuration..." : "Me définir comme Super Admin"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
