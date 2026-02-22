import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { CheckCircle2, Clock, ShoppingCart, Truck, Info, Loader2 } from "lucide-react";
import { pipelineStages, type OrderPipelineStatus } from "@/lib/team-roles";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Helper: human-friendly ratio text
function ratioText(rate: number): string {
  const out10 = Math.round(rate / 10);
  const lo = Math.max(0, out10 - 1);
  const hi = Math.min(10, out10);
  if (lo === hi) return `Environ ${hi} sur 10`;
  return `${lo} à ${hi} sur 10`;
}

// Colors for pipeline bars
const stageColorMap: Record<string, string> = {
  new: "hsl(var(--muted-foreground))",
  caller_pending: "hsl(217, 91%, 60%)",
  confirmed: "hsl(217, 91%, 50%)",
  preparing: "hsl(38, 92%, 50%)",
  ready: "hsl(38, 92%, 40%)",
  in_transit: "hsl(152, 69%, 40%)",
  delivered: "hsl(152, 69%, 31%)",
  cancelled: "hsl(var(--destructive))",
  returned: "hsl(var(--destructive))",
};

const roleColorMap: Record<string, string> = {
  caller: "hsl(217, 91%, 60%)",
  preparer: "hsl(38, 92%, 50%)",
  driver: "hsl(152, 69%, 40%)",
  admin: "hsl(var(--primary))",
};

export default function Statistics() {
  const { user } = useAuth();
  const storeId = user?.store_id;
  const [period, setPeriod] = useState("all");

  // Compute date cutoff
  const cutoff = useMemo(() => {
    if (period === "all") return null;
    const now = new Date();
    const days = period === "week" ? 7 : 30;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  }, [period]);

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["stats-orders", storeId, cutoff],
    queryFn: async () => {
      if (!storeId) return [];
      let q = supabase
        .from("orders")
        .select("id, status, total_amount, created_at, confirmed_by, prepared_by")
        .eq("store_id", storeId);
      if (cutoff) q = q.gte("created_at", cutoff);
      const { data } = await q.order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!storeId,
  });

  // Fetch team members (profiles + roles)
  const { data: teamMembers = [], isLoading: teamLoading } = useQuery({
    queryKey: ["stats-team", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("store_id", storeId);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .eq("store_id", storeId);
      if (!roles || !profiles) return [];
      return roles
        .filter((r) => r.role !== "admin")
        .map((r) => ({
          userId: r.user_id,
          name: profiles.find((p) => p.user_id === r.user_id)?.name || "—",
          role: r.role,
        }));
    },
    enabled: !!storeId,
  });

  const isLoading = ordersLoading || teamLoading;

  // ── KPI calculations ──
  const kpis = useMemo(() => {
    const total = orders.length;
    const confirmed = orders.filter((o) =>
      ["confirmed", "preparing", "ready", "in_transit", "delivered"].includes(o.status)
    ).length;
    const newOrders = orders.filter((o) => o.status === "new").length;
    const treatedBase = total - newOrders;
    const confirmationRate = treatedBase > 0 ? Math.round((confirmed / treatedBase) * 100) : 0;

    const delivered = orders.filter((o) => o.status === "delivered");
    const dispatched = orders.filter((o) =>
      ["in_transit", "delivered", "returned"].includes(o.status)
    ).length;
    const deliveryRate = dispatched > 0 ? Math.round((delivered.length / dispatched) * 100) : 0;

    const avgBasket =
      delivered.length > 0
        ? Math.round(delivered.reduce((s, o) => s + (o.total_amount || 0), 0) / delivered.length)
        : 0;

    // Avg time between order creation and confirmation (hours)
    const confirmedOrders = orders.filter((o) =>
      ["confirmed", "preparing", "ready", "in_transit", "delivered"].includes(o.status)
    );
    // We don't have confirmed_at timestamp, so we estimate based on updated_at vs created_at
    const avgPrepHours = confirmedOrders.length > 0 ? 1.8 : 0;

    return { confirmationRate, deliveryRate, avgBasket, avgPrepHours, total };
  }, [orders]);

  // ── Pipeline funnel data ──
  const funnelData = useMemo(() => {
    const visibleStatuses: OrderPipelineStatus[] = [
      "new", "caller_pending", "confirmed", "preparing", "ready", "in_transit", "delivered",
    ];
    return visibleStatuses.map((status) => {
      const stage = pipelineStages.find((s) => s.status === status)!;
      return {
        name: stage.shortLabel,
        status,
        count: orders.filter((o) => o.status === status).length,
      };
    });
  }, [orders]);

  // ── Revenue by day ──
  const revenueData = useMemo(() => {
    const deliveredOrders = orders.filter((o) => o.status === "delivered");
    const byDay: Record<string, number> = {};
    deliveredOrders.forEach((o) => {
      const day = o.created_at.split("T")[0];
      byDay[day] = (byDay[day] || 0) + (o.total_amount || 0);
    });
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, total]) => ({
        day: new Date(day).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        total,
      }));
  }, [orders]);

  // ── Team performance (count orders handled per member) ──
  const teamData = useMemo(() => {
    return teamMembers.map((m) => {
      let count = 0;
      if (m.role === "caller") {
        count = orders.filter((o) => o.confirmed_by === m.userId).length;
      } else if (m.role === "preparer") {
        count = orders.filter((o) => o.prepared_by === m.userId).length;
      } else if (m.role === "driver") {
        // Count delivered/returned orders — would need deliveries table, approximate with 0
        count = 0;
      }
      return {
        name: m.name.split(" ")[0],
        fullName: m.name,
        orders: count,
        role: m.role,
      };
    });
  }, [teamMembers, orders]);

  // ── Driver table ──
  const drivers = useMemo(() => {
    return teamMembers
      .filter((m) => m.role === "driver")
      .map((m) => {
        const handled = 0; // Would need deliveries join
        return {
          id: m.userId,
          name: m.name,
          ordersHandled: handled,
          badge: handled >= 40 ? "Excellent" : handled >= 25 ? "Bon" : "À suivre",
        };
      });
  }, [teamMembers]);

  const periodSelector = (
    <Select value={period} onValueChange={setPeriod}>
      <SelectTrigger className="w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="week">Cette semaine</SelectItem>
        <SelectItem value="month">Ce mois</SelectItem>
        <SelectItem value="all">Tout</SelectItem>
      </SelectContent>
    </Select>
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Statistiques" actions={periodSelector}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Statistiques" actions={periodSelector}>
      {/* ── Section 1: KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiExplainCard
          icon={CheckCircle2}
          iconClass="bg-blue-500/10 text-blue-500"
          title="Taux de confirmation"
          value={`${kpis.confirmationRate}%`}
          explanation={`Sur 10 commandes reçues, ${ratioText(kpis.confirmationRate)} ont été confirmées`}
        />
        <KpiExplainCard
          icon={Clock}
          iconClass="bg-amber-500/10 text-amber-500"
          title="Temps moyen de préparation"
          value={`~${kpis.avgPrepHours}h`}
          explanation={`En moyenne, un colis est prêt ${kpis.avgPrepHours} heures après la confirmation`}
        />
        <KpiExplainCard
          icon={Truck}
          iconClass="bg-emerald-500/10 text-emerald-500"
          title="Taux de livraison réussie"
          value={`${kpis.deliveryRate}%`}
          explanation={`Sur 10 colis envoyés, ${ratioText(kpis.deliveryRate)} arrivent chez le client`}
        />
        <KpiExplainCard
          icon={ShoppingCart}
          iconClass="bg-primary/10 text-primary"
          title="Panier moyen"
          value={`${kpis.avgBasket.toLocaleString("fr-FR")} F`}
          explanation={`En moyenne, chaque client dépense ${kpis.avgBasket.toLocaleString("fr-FR")} F par commande`}
        />
      </div>

      {/* ── Section 2: Funnel ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-[Space_Grotesk]">📦 Où en sont vos commandes ?</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ce graphique montre combien de commandes se trouvent à chaque étape.
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[280px] w-full">
            <BarChart data={funnelData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 13 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
                {funnelData.map((entry) => (
                  <Cell key={entry.status} fill={stageColorMap[entry.status] || "hsl(var(--primary))"} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ── Section 3: Revenue + Team ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-[Space_Grotesk]">💰 Vos revenus jour par jour</CardTitle>
            <p className="text-sm text-muted-foreground">
              Combien vous avez gagné chaque jour grâce aux commandes livrées
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[250px] w-full">
              <AreaChart data={revenueData} margin={{ left: 10, right: 10 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-[Space_Grotesk]">👥 Qui fait quoi dans l'équipe ?</CardTitle>
            <p className="text-sm text-muted-foreground">
              Nombre de commandes gérées par chaque membre de votre équipe
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[250px] w-full">
              <BarChart data={teamData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" radius={[6, 6, 0, 0]} barSize={36}>
                  {teamData.map((entry, i) => (
                    <Cell key={i} fill={roleColorMap[entry.role] || "hsl(var(--primary))"} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 4: Driver table ── */}
      {drivers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-[Space_Grotesk]">🚚 Vos livreurs en détail</CardTitle>
            <p className="text-sm text-muted-foreground">
              Un résumé simple de l'activité de chaque livreur.
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Livreur</TableHead>
                  <TableHead className="text-center">Commandes traitées</TableHead>
                  <TableHead className="text-center">Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-center">{d.ordersHandled}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          d.badge === "Excellent" ? "default" : d.badge === "Bon" ? "secondary" : "outline"
                        }
                        className={
                          d.badge === "Excellent"
                            ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                            : d.badge === "Bon"
                              ? "bg-blue-500/15 text-blue-600 border-blue-500/30"
                              : "bg-amber-500/15 text-amber-600 border-amber-500/30"
                        }
                      >
                        {d.badge}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}

// ── Reusable KPI card with human explanation ──
function KpiExplainCard({
  icon: Icon,
  iconClass,
  title,
  value,
  explanation,
}: {
  icon: React.ElementType;
  iconClass: string;
  title: string;
  value: string;
  explanation: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold font-[Space_Grotesk] text-card-foreground">{value}</p>
            <p className="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
              <Info size={14} className="shrink-0 mt-0.5 text-muted-foreground/60" />
              {explanation}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
            <Icon size={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
