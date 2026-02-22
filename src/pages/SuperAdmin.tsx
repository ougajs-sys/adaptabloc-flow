import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, LayoutDashboard, Store, DollarSign, Puzzle, BarChart3, CreditCard } from "lucide-react";
import SuperAdminOverview from "@/components/superadmin/SuperAdminOverview";
import SuperAdminStores from "@/components/superadmin/SuperAdminStores";
import SuperAdminFinances from "@/components/superadmin/SuperAdminFinances";
import SuperAdminModules from "@/components/superadmin/SuperAdminModules";
import SuperAdminAnalytics from "@/components/superadmin/SuperAdminAnalytics";
import SuperAdminProviders from "@/components/superadmin/SuperAdminProviders";

export default function SuperAdmin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    async function check() {
      const { data } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user!.id)
        .eq("role", "superadmin" as any)
        .limit(1);
      setIsSuperAdmin(!!data && data.length > 0);
      setChecking(false);
    }
    check();
  }, [isLoading, isAuthenticated, user]);

  if (isLoading || checking) {
    return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Chargement...</p></div>;
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Shield className="mx-auto h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-bold">Accès refusé</h1>
          <p className="text-muted-foreground">Vous n'avez pas les droits Super Admin.</p>
          <button onClick={() => navigate("/dashboard")} className="text-primary underline">Retour au dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4 flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">Super Admin — Intramate</h1>
        <button onClick={() => navigate("/dashboard")} className="ml-auto text-sm text-muted-foreground hover:text-foreground">
          ← Dashboard
        </button>
      </header>

      <div className="p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs">
              <LayoutDashboard className="h-3.5 w-3.5" /> Vue Globale
            </TabsTrigger>
            <TabsTrigger value="stores" className="flex items-center gap-1.5 text-xs">
              <Store className="h-3.5 w-3.5" /> Boutiques
            </TabsTrigger>
            <TabsTrigger value="finances" className="flex items-center gap-1.5 text-xs">
              <DollarSign className="h-3.5 w-3.5" /> Finances
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex items-center gap-1.5 text-xs">
              <Puzzle className="h-3.5 w-3.5" /> Modules
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-1.5 text-xs">
              <CreditCard className="h-3.5 w-3.5" /> Paiement
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><SuperAdminOverview /></TabsContent>
          <TabsContent value="stores"><SuperAdminStores /></TabsContent>
          <TabsContent value="finances"><SuperAdminFinances /></TabsContent>
          <TabsContent value="modules"><SuperAdminModules /></TabsContent>
          <TabsContent value="analytics"><SuperAdminAnalytics /></TabsContent>
          <TabsContent value="providers"><SuperAdminProviders /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
