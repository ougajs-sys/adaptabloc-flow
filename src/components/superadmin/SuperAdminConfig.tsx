import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, Server, Database } from "lucide-react";

export default function SuperAdminConfig() {
  const { toast } = useToast();
  const [stats, setStats] = useState({ totalStores: 0, totalUsers: 0, totalModules: 0 });
  const [maintenance, setMaintenance] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [storesRes, profilesRes, modulesRes, configRes] = await Promise.all([
        supabase.from("stores").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("store_modules").select("id", { count: "exact", head: true }),
        supabase.from("platform_config" as any).select("key, value").eq("key", "maintenance_mode").maybeSingle(),
      ]);

      setStats({
        totalStores: storesRes.count || 0,
        totalUsers: profilesRes.count || 0,
        totalModules: modulesRes.count || 0,
      });

      if (configRes.data) {
        setMaintenance((configRes.data as any).value === "true");
      }

      setLoading(false);
    }
    load();
  }, []);

  async function toggleMaintenance(val: boolean) {
    setMaintenance(val);
    setSavingMaintenance(true);
    try {
      const { error } = await supabase
        .from("platform_config" as any)
        .upsert({ key: "maintenance_mode", value: String(val) }, { onConflict: "key" });
      if (error) throw error;
      toast({
        title: val ? "Mode maintenance activé" : "Mode maintenance désactivé",
        description: "Le changement est enregistré en base de données.",
      });
    } catch (err: any) {
      setMaintenance(!val);
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSavingMaintenance(false);
    }
  }

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Configuration Système</h2>
        <p className="text-sm text-muted-foreground">Paramètres et informations de la plateforme</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Plateforme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono font-medium">1.0.0-beta</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Environnement</span>
              <span className="font-mono font-medium">Production</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">URL</span>
              <span className="font-mono font-medium text-xs truncate max-w-[200px]">
                {window.location.origin}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Boutiques</span>
              <span className="font-medium">{stats.totalStores}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Utilisateurs</span>
              <span className="font-medium">{stats.totalUsers}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Modules activés</span>
              <span className="font-medium">{stats.totalModules}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Mode maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Activer le mode maintenance</p>
                <p className="text-xs text-muted-foreground">
                  Persisté en base de données — visible par tous les administrateurs.
                </p>
              </div>
              <Switch
                checked={maintenance}
                onCheckedChange={toggleMaintenance}
                disabled={savingMaintenance}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
