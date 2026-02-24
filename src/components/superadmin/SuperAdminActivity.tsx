import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Puzzle, DollarSign } from "lucide-react";

interface ActivityEvent {
  id: string;
  type: "store" | "module" | "transaction";
  title: string;
  detail: string;
  date: string;
}

export default function SuperAdminActivity() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [filter, setFilter] = useState<"all" | "store" | "module" | "transaction">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [storesRes, modulesRes, transactionsRes] = await Promise.all([
        supabase.from("stores").select("id, name, created_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("store_modules").select("id, module_id, store_id, activated_at").order("activated_at", { ascending: false }).limit(50),
        supabase.from("transactions").select("id, gross_amount, currency, provider, created_at, store_id").order("created_at", { ascending: false }).limit(50),
      ]);

      const storeEvents: ActivityEvent[] = (storesRes.data || []).map((s) => ({
        id: `store-${s.id}`,
        type: "store",
        title: "Nouvelle boutique",
        detail: s.name,
        date: s.created_at,
      }));

      const moduleEvents: ActivityEvent[] = (modulesRes.data || []).map((m) => ({
        id: `mod-${m.id}`,
        type: "module",
        title: "Module activé",
        detail: m.module_id,
        date: m.activated_at,
      }));

      const txEvents: ActivityEvent[] = (transactionsRes.data || []).map((t) => ({
        id: `tx-${t.id}`,
        type: "transaction",
        title: "Transaction",
        detail: `${t.gross_amount.toLocaleString()} ${t.currency} via ${t.provider}`,
        date: t.created_at,
      }));

      const all = [...storeEvents, ...moduleEvents, ...txEvents].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setEvents(all);
      setLoading(false);
    }
    load();
  }, []);

  const iconMap = { store: Store, module: Puzzle, transaction: DollarSign };
  const colorMap = { store: "text-blue-500", module: "text-violet-500", transaction: "text-emerald-500" };
  const filtered = filter === "all" ? events : events.filter((e) => e.type === filter);

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Journal d'activité</h2>
        <p className="text-sm text-muted-foreground">{events.length} événements récents</p>
      </div>

      <div className="flex gap-2">
        {(["all", "store", "module", "transaction"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f === "all" ? "Tout" : f === "store" ? "Boutiques" : f === "module" ? "Modules" : "Transactions"}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun événement</p>
          ) : (
            <div className="space-y-0">
              {filtered.slice(0, 100).map((event) => {
                const Icon = iconMap[event.type];
                return (
                  <div key={event.id} className="flex items-start gap-3 py-3 border-b last:border-0">
                    <div className={`mt-0.5 ${colorMap[event.type]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{event.detail}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(event.date).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
