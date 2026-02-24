import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Users, DollarSign, Puzzle, TrendingUp, TrendingDown } from "lucide-react";

export default function SuperAdminOverview() {
  const [stats, setStats] = useState({
    totalStores: 0,
    newStores7d: 0,
    prevNewStores7d: 0,
    totalRevenue: 0,
    prevRevenue7d: 0,
    currentRevenue7d: 0,
    totalModules: 0,
    topModules: [] as { module_id: string; count: number }[],
    sectorDistribution: [] as { sector: string; count: number }[],
    recentEvents: [] as { type: string; title: string; detail: string; date: string }[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [storesRes, modulesRes, transactionsRes] = await Promise.all([
        supabase.from("stores").select("id, created_at, sector, country"),
        supabase.from("store_modules").select("module_id, activated_at"),
        supabase.from("transactions").select("gross_amount, status, created_at").eq("status", "completed"),
      ]);

      const stores = storesRes.data || [];
      const modules = modulesRes.data || [];
      const transactions = transactionsRes.data || [];

      const now = new Date();
      const d7 = new Date(now.getTime() - 7 * 86400000);
      const d14 = new Date(now.getTime() - 14 * 86400000);

      // Store growth
      const newStores7d = stores.filter((s) => new Date(s.created_at) >= d7).length;
      const prevNewStores7d = stores.filter((s) => { const d = new Date(s.created_at); return d >= d14 && d < d7; }).length;

      // Revenue
      const totalRevenue = transactions.reduce((s, t) => s + t.gross_amount, 0);
      const currentRevenue7d = transactions.filter((t) => new Date(t.created_at) >= d7).reduce((s, t) => s + t.gross_amount, 0);
      const prevRevenue7d = transactions.filter((t) => { const d = new Date(t.created_at); return d >= d14 && d < d7; }).reduce((s, t) => s + t.gross_amount, 0);

      // Modules
      const moduleCounts: Record<string, number> = {};
      modules.forEach((m) => { moduleCounts[m.module_id] = (moduleCounts[m.module_id] || 0) + 1; });
      const topModules = Object.entries(moduleCounts)
        .map(([module_id, count]) => ({ module_id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Sectors
      const sectorCounts: Record<string, number> = {};
      stores.forEach((s) => { const sector = s.sector || "Non défini"; sectorCounts[sector] = (sectorCounts[sector] || 0) + 1; });
      const sectorDistribution = Object.entries(sectorCounts)
        .map(([sector, count]) => ({ sector, count }))
        .sort((a, b) => b.count - a.count);

      // Recent events
      const recentStores = stores
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)
        .map((s) => ({ type: "store", title: "Nouvelle boutique", detail: s.sector || "—", date: s.created_at }));

      const recentModules = [...modules]
        .sort((a, b) => new Date(b.activated_at).getTime() - new Date(a.activated_at).getTime())
        .slice(0, 2)
        .map((m) => ({ type: "module", title: "Module activé", detail: m.module_id, date: m.activated_at }));

      const recentEvents = [...recentStores, ...recentModules]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      setStats({
        totalStores: stores.length,
        newStores7d,
        prevNewStores7d,
        totalRevenue,
        currentRevenue7d,
        prevRevenue7d,
        totalModules: modules.length,
        topModules,
        sectorDistribution,
        recentEvents,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;

  function Trend({ current, previous }: { current: number; previous: number }) {
    if (previous === 0 && current === 0) return null;
    const up = current >= previous;
    return (
      <span className={`flex items-center gap-0.5 text-xs ${up ? "text-emerald-500" : "text-destructive"}`}>
        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {previous > 0 ? `${Math.round(((current - previous) / previous) * 100)}%` : "+∞"}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Boutiques actives</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStores}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">+{stats.newStores7d} cette semaine</span>
              <Trend current={stats.newStores7d} previous={stats.prevNewStores7d} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} FCFA</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">+{stats.currentRevenue7d.toLocaleString()} cette semaine</span>
              <Trend current={stats.currentRevenue7d} previous={stats.prevRevenue7d} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nouvelles (7j)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newStores7d}</div>
            <Trend current={stats.newStores7d} previous={stats.prevNewStores7d} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Modules activés</CardTitle>
            <Puzzle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalModules}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
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
        <Card>
          <CardHeader><CardTitle className="text-sm">Activité récente</CardTitle></CardHeader>
          <CardContent>
            {stats.recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun événement</p>
            ) : (
              <ul className="space-y-3">
                {stats.recentEvents.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${e.type === "store" ? "bg-blue-500" : "bg-violet-500"}`} />
                    <div>
                      <p className="font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{e.detail} · {new Date(e.date).toLocaleDateString("fr-FR")}</p>
                    </div>
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
