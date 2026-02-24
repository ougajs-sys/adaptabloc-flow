import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";

export default function SuperAdminAnalytics() {
  const [monthlyGrowth, setMonthlyGrowth] = useState<{ month: string; count: number }[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; amount: number }[]>([]);
  const [modulePopularity, setModulePopularity] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [storesRes, transactionsRes, modulesRes] = await Promise.all([
        supabase.from("stores").select("created_at"),
        supabase.from("transactions").select("gross_amount, created_at, status").eq("status", "completed"),
        supabase.from("store_modules").select("module_id"),
      ]);

      // Store growth by month
      const stores = storesRes.data || [];
      const storeMonthlyCounts: Record<string, number> = {};
      stores.forEach((s) => {
        const month = new Date(s.created_at).toISOString().slice(0, 7);
        storeMonthlyCounts[month] = (storeMonthlyCounts[month] || 0) + 1;
      });
      setMonthlyGrowth(
        Object.entries(storeMonthlyCounts)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, count]) => ({ month, count }))
      );

      // Revenue by month
      const transactions = transactionsRes.data || [];
      const revenueMonthlyCounts: Record<string, number> = {};
      transactions.forEach((t) => {
        const month = new Date(t.created_at).toISOString().slice(0, 7);
        revenueMonthlyCounts[month] = (revenueMonthlyCounts[month] || 0) + t.gross_amount;
      });
      setMonthlyRevenue(
        Object.entries(revenueMonthlyCounts)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, amount]) => ({ month, amount }))
      );

      // Module popularity
      const modules = modulesRes.data || [];
      const moduleCounts: Record<string, number> = {};
      modules.forEach((m) => { moduleCounts[m.module_id] = (moduleCounts[m.module_id] || 0) + 1; });
      setModulePopularity(
        Object.entries(moduleCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      );

      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Croissance des boutiques par mois</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyGrowth.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Revenus mensuels (FCFA)</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyRevenue.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip formatter={(val: number) => `${val.toLocaleString()} FCFA`} />
                  <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Modules les plus populaires</CardTitle>
        </CardHeader>
        <CardContent>
          {modulePopularity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, modulePopularity.length * 40)}>
              <BarChart data={modulePopularity} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
