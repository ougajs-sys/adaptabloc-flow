import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Settings, Server, Database, Globe } from "lucide-react";

export default function SuperAdminConfig() {
  const [stats, setStats] = useState({
    totalStores: 0,
    totalUsers: 0,
    totalModules: 0,
  });
  const [maintenance, setMaintenance] = useState(
    () => localStorage.getItem("intramate_maintenance") === "true"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [storesRes, profilesRes, modulesRes] = await Promise.all([
        supabase.from("stores").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("store_modules").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        totalStores: storesRes.count || 0,
        totalUsers: profilesRes.count || 0,
        totalModules: modulesRes.count || 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  function toggleMaintenance(val: boolean) {
    setMaintenance(val);
    localStorage.setItem("intramate_maintenance", String(val));
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
                  Les clients verront un message de maintenance (MVP : localStorage uniquement)
                </p>
              </div>
              <Switch checked={maintenance} onCheckedChange={toggleMaintenance} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
