import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Truck, Clock, CheckCircle2, XCircle, MapPin, PackageCheck, Plus, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

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
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignDeliveryId, setAssignDeliveryId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");

  // Fetch deliveries with order + customer info
  const { data: deliveries = [] } = useQuery({
    queryKey: ["deliveries", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*, orders!inner(order_number, customers(name, phone, address, city), shipping_address, shipping_city)")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch driver profiles (only users with driver role)
  const { data: driverRoles = [] } = useQuery({
    queryKey: ["driver-roles", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("store_id", storeId!)
        .eq("role", "driver");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["profiles", storeId],
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

  const drivers = allProfiles.filter((p) =>
    driverRoles.some((r) => r.user_id === p.user_id)
  );

  // Fetch orders ready for delivery (status = ready, confirmed, preparing) that don't have a delivery yet
  const existingDeliveryOrderIds = deliveries.map((d: any) => d.order_id);
  const { data: eligibleOrders = [] } = useQuery({
    queryKey: ["eligible-orders-for-delivery", storeId, existingDeliveryOrderIds],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, total_amount, shipping_address, shipping_city, customers(name)")
        .eq("store_id", storeId!)
        .in("status", ["ready", "confirmed", "preparing"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Filter out orders that already have a delivery
      return (data || []).filter((o: any) => !existingDeliveryOrderIds.includes(o.id));
    },
  });

  // Create delivery mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const order = eligibleOrders.find((o: any) => o.id === selectedOrderId);
      if (!order) throw new Error("Commande introuvable");
      const { error } = await supabase.from("deliveries").insert({
        store_id: storeId!,
        order_id: selectedOrderId,
        delivery_address: (order as any).shipping_address || "",
        delivery_city: (order as any).shipping_city || "",
        delivery_fee: parseInt(deliveryFee) || 0,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["eligible-orders-for-delivery"] });
      setCreateOpen(false);
      setSelectedOrderId("");
      setDeliveryFee("");
      toast({ title: "Livraison créée", description: "La livraison a été ajoutée avec succès." });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  // Assign driver mutation
  const assignMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("deliveries")
        .update({ driver_id: selectedDriverId, status: "assigned" })
        .eq("id", assignDeliveryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      setAssignOpen(false);
      setAssignDeliveryId("");
      setSelectedDriverId("");
      toast({ title: "Livreur assigné", description: "Le livreur a été assigné à la livraison." });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
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
    return allProfiles.find((d) => d.user_id === driverId);
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

  const openAssign = (deliveryId: string, currentDriverId: string | null) => {
    setAssignDeliveryId(deliveryId);
    setSelectedDriverId(currentDriverId || "");
    setAssignOpen(true);
  };

  return (
    <DashboardLayout
      title="Livraisons"
      actions={
        <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Nouvelle livraison
        </Button>
      }
    >
      {/* Create delivery dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[Space_Grotesk] flex items-center gap-2">
              <Truck size={18} /> Créer une livraison
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Commande à livrer</Label>
              {eligibleOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Aucune commande prête pour livraison.</p>
              ) : (
                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner une commande" /></SelectTrigger>
                  <SelectContent>
                    {eligibleOrders.map((o: any) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.order_number} — {o.customers?.name || "Client inconnu"} ({o.total_amount?.toLocaleString("fr-FR")} F)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Frais de livraison (FCFA)</Label>
              <Input type="number" placeholder="0" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!selectedOrderId || createMutation.isPending} className="gap-2">
              <Truck size={14} /> Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign driver dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-[Space_Grotesk] flex items-center gap-2">
              <UserPlus size={18} /> Assigner un livreur
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {drivers.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Aucun livreur dans votre équipe.</p>
            ) : (
              <div className="space-y-2">
                <Label>Livreur</Label>
                <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                  <SelectTrigger><SelectValue placeholder="Choisir un livreur" /></SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.user_id} value={d.user_id}>
                        {d.name} {d.phone ? `(${d.phone})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Annuler</Button>
            <Button onClick={() => assignMutation.mutate()} disabled={!selectedDriverId || assignMutation.isPending} className="gap-2">
              <UserPlus size={14} /> Assigner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                    <TableCell>
                      {["pending", "assigned"].includes(delivery.status) && (
                        <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => openAssign(delivery.id, delivery.driver_id)}>
                          <UserPlus size={12} /> {delivery.driver_id ? "Réassigner" : "Assigner"}
                        </Button>
                      )}
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
