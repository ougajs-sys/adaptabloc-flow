import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function SuperAdminAnalytics() {
  const [monthlyGrowth, setMonthlyGrowth] = useState<{ month: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: stores } = await supabase.from("stores").select("created_at");
      if (!stores) { setLoading(false); return; }

      const monthlyCounts: Record<string, number> = {};
      stores.forEach((s) => {
        const month = new Date(s.created_at).toISOString().slice(0, 7); // YYYY-MM
        monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
      });

      const sorted = Object.entries(monthlyCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }));

      setMonthlyGrowth(sorted);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Croissance des boutiques par mois</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyGrowth.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Aucune donnée disponible</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
