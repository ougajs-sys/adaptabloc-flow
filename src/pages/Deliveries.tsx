import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Truck, Clock, CheckCircle2, XCircle, MapPin, PackageCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Truck }> = {
  delivered: { label: "Livré", variant: "default", icon: CheckCircle2 },
  in_transit: { label: "En route", variant: "secondary", icon: Truck },
  picked_up: { label: "Récupéré", variant: "outline", icon: PackageCheck },
  assigned: { label: "Assigné", variant: "outline", icon: Clock },
  pending: { label: "En attente", variant: "outline", icon: Clock },
  failed: { label: "Échoué", variant: "destructive", icon: XCircle },
};

const Deliveries = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const storeId = user?.store_id;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch deliveries with order + customer info
  const { data: deliveries = [] } = useQuery({
    queryKey: ["deliveries", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*, orders!inner(order_number, customers(name, phone, address, city))")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch driver profiles
  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, phone")
        .eq("store_id", storeId!);
      if (error) throw error;
      return data || [];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!storeId) return;
    const channel = supabase
      .channel("deliveries-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries", filter: `store_id=eq.${storeId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["deliveries", storeId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [storeId, queryClient]);

  const getDriverName = (driverId: string | null) => {
    if (!driverId) return null;
    return drivers.find((d) => d.user_id === driverId);
  };

  const filtered = deliveries.filter((d: any) => {
    const customerName = d.orders?.customers?.name || "";
    const driverProfile = getDriverName(d.driver_id);
    const driverName = driverProfile?.name || "";
    const matchSearch =
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      customerName.toLowerCase().includes(search.toLowerCase()) ||
      driverName.toLowerCase().includes(search.toLowerCase()) ||
      (d.orders?.order_number || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const today = new Date().toISOString().split("T")[0];
  const activeCount = deliveries.filter((d: any) => ["in_transit", "picked_up", "assigned"].includes(d.status)).length;
  const todayDelivered = deliveries.filter((d: any) => d.status === "delivered" && d.delivered_at?.startsWith(today)).length;
  const pendingCount = deliveries.filter((d: any) => d.status === "pending").length;
  const totalDone = deliveries.filter((d: any) => ["delivered", "failed"].includes(d.status)).length;
  const successRate = totalDone > 0 ? Math.round((deliveries.filter((d: any) => d.status === "delivered").length / totalDone) * 100) : 0;

  return (
    <DashboardLayout title="Livraisons">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "En cours", value: activeCount, icon: Truck, color: "text-primary" },
          { label: "Livrées aujourd'hui", value: todayDelivered, icon: CheckCircle2, color: "text-accent" },
          { label: "En attente", value: pendingCount, icon: Clock, color: "text-muted-foreground" },
          { label: "Taux de succès", value: totalDone > 0 ? `${successRate}%` : "—", icon: CheckCircle2, color: "text-accent" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={14} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className={`text-xl font-bold font-[Space_Grotesk] ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par client, livreur ou commande..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="assigned">Assigné</SelectItem>
            <SelectItem value="picked_up">Récupéré</SelectItem>
            <SelectItem value="in_transit">En route</SelectItem>
            <SelectItem value="delivered">Livré</SelectItem>
            <SelectItem value="failed">Échoué</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Livreur</TableHead>
                <TableHead>Frais</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucune livraison trouvée
                  </TableCell>
                </TableRow>
              ) : filtered.map((delivery: any) => {
                const st = statusConfig[delivery.status] || statusConfig.pending;
                const StatusIcon = st.icon;
                const customer = delivery.orders?.customers;
                const driverProfile = getDriverName(delivery.driver_id);
                const driverInitials = driverProfile?.name
                  ? driverProfile.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)
                  : "?";
                return (
                  <TableRow key={delivery.id}>
                    <TableCell>
                      <p className="font-mono text-xs font-medium">{delivery.orders?.order_number || "—"}</p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{customer?.name || "—"}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin size={10} />
                          <span>{delivery.delivery_address || customer?.address || "—"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-muted text-muted-foreground rounded px-2 py-0.5">
                        {delivery.delivery_city || customer?.city || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {driverProfile ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-accent/10 text-accent">{driverInitials}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{driverProfile.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Non assigné</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {(delivery.delivery_fee || 0).toLocaleString("fr-FR")} F
                    </TableCell>
                    <TableCell>
                      <Badge variant={st.variant} className="text-xs gap-1">
                        <StatusIcon size={12} />
                        {st.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Deliveries;
