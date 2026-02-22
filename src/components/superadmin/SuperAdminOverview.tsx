import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Users, DollarSign, Puzzle, TrendingUp } from "lucide-react";

export default function SuperAdminOverview() {
  const [stats, setStats] = useState({
    totalStores: 0,
    newStores7d: 0,
    totalRevenue: 0,
    topModules: [] as { module_id: string; count: number }[],
    sectorDistribution: [] as { sector: string; count: number }[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [storesRes, modulesRes] = await Promise.all([
        supabase.from("stores").select("id, created_at, sector, country"),
        supabase.from("store_modules").select("module_id"),
      ]);

      const stores = storesRes.data || [];
      const modules = modulesRes.data || [];
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Count modules
      const moduleCounts: Record<string, number> = {};
      modules.forEach((m) => {
        moduleCounts[m.module_id] = (moduleCounts[m.module_id] || 0) + 1;
      });
      const topModules = Object.entries(moduleCounts)
        .map(([module_id, count]) => ({ module_id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Sector distribution
      const sectorCounts: Record<string, number> = {};
      stores.forEach((s) => {
        const sector = s.sector || "Non défini";
        sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
      });
      const sectorDistribution = Object.entries(sectorCounts)
        .map(([sector, count]) => ({ sector, count }))
        .sort((a, b) => b.count - a.count);

      setStats({
        totalStores: stores.length,
        newStores7d: stores.filter((s) => new Date(s.created_at) >= sevenDaysAgo).length,
        totalRevenue: 0, // Will come from transactions later
        topModules,
        sectorDistribution,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Boutiques actives</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalStores}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nouvelles (7j)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.newStores7d}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} FCFA</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Modules activés</CardTitle>
            <Puzzle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.topModules.reduce((s, m) => s + m.count, 0)}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Top 5 Modules</CardTitle></CardHeader>
          <CardContent>
            {stats.topModules.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun module activé</p>
            ) : (
              <ul className="space-y-2">
                {stats.topModules.map((m) => (
                  <li key={m.module_id} className="flex justify-between text-sm">
                    <span className="font-medium">{m.module_id}</span>
                    <span className="text-muted-foreground">{m.count} boutiques</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Répartition par secteur</CardTitle></CardHeader>
          <CardContent>
            {stats.sectorDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            ) : (
              <ul className="space-y-2">
                {stats.sectorDistribution.map((s) => (
                  <li key={s.sector} className="flex justify-between text-sm">
                    <span className="font-medium">{s.sector}</span>
                    <span className="text-muted-foreground">{s.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
