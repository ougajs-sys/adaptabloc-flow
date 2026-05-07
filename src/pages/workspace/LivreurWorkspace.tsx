import { useState, useCallback, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Truck, MapPin, Phone, CheckCircle2, RotateCcw, Navigation, Package, Banknote, Loader2, Radio } from "lucide-react";
import { useWorkspaceOrders, type WorkspaceOrder } from "@/hooks/useWorkspaceOrders";
import { getStageByStatus, type OrderPipelineStatus } from "@/lib/team-roles";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/contexts/ModulesContext";
import { useToast } from "@/hooks/use-toast";

// ── GPS sharing hook ───────────────────────────────────────────────────────────

function useGpsSharing(enabled: boolean, storeId: string | null) {
  const watchRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !storeId || !navigator.geolocation) return;

    async function send(pos: GeolocationPosition) {
      await supabase.rpc("upsert_driver_location" as any, {
        p_store_id: storeId,
        p_lat: pos.coords.latitude,
        p_lng: pos.coords.longitude,
        p_accuracy: pos.coords.accuracy ?? null,
        p_speed: pos.coords.speed != null ? pos.coords.speed * 3.6 : null, // m/s → km/h
        p_heading: pos.coords.heading ?? null,
        p_on_duty: true,
      });
    }

    watchRef.current = navigator.geolocation.watchPosition(send, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 10_000,
    });

    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [enabled, storeId]);

  // Mark off-duty when disabled
  useEffect(() => {
    if (enabled || !storeId) return;
    navigator.geolocation?.getCurrentPosition((pos) => {
      supabase.rpc("upsert_driver_location" as any, {
        p_store_id: storeId,
        p_lat: pos.coords.latitude,
        p_lng: pos.coords.longitude,
        p_on_duty: false,
      });
    });
  }, [enabled, storeId]);
}

type DeliveryOutcome = "delivered" | "returned";

const LivreurWorkspace = () => {
  const { user } = useAuth();
  const { hasModule } = useModules();
  const { toast } = useToast();
  const storeId = user?.store_id ?? null;

  const { orders, isLoading, todayStats, updateStatus } = useWorkspaceOrders([
    "ready", "in_transit", "shipping", "delivered", "returned",
  ]);
  const [selectedOrder, setSelectedOrder] = useState<WorkspaceOrder | null>(null);
  const [outcome, setOutcome] = useState<DeliveryOutcome>("delivered");
  const [note, setNote] = useState("");
  const [gpsEnabled, setGpsEnabled] = useState(false);

  const geoEnabled = hasModule("geo_tracking");
  useGpsSharing(gpsEnabled, storeId);

  const handleGpsToggle = useCallback((v: boolean) => {
    if (v && !navigator.geolocation) {
      toast({ title: "GPS non supporté", description: "Votre navigateur ne supporte pas la géolocalisation.", variant: "destructive" });
      return;
    }
    setGpsEnabled(v);
    if (v) toast({ title: "Position partagée", description: "Votre position est maintenant visible sur la carte admin." });
  }, [toast]);

  const livreurOrders = orders.filter((o) => ["ready", "in_transit"].includes(o.status));

  const handlePickUp = useCallback((order: WorkspaceOrder) => {
    if (order.status === "ready") {
      updateStatus.mutate({ dbId: order.dbId, status: "in_transit" });
    }
    setSelectedOrder(order);
    setOutcome("delivered");
    setNote("");
  }, [updateStatus]);

  const handleFinalize = useCallback(() => {
    if (!selectedOrder) return;
    updateStatus.mutate(
      { dbId: selectedOrder.dbId, status: outcome as OrderPipelineStatus, notes: note || undefined },
      { onSuccess: () => setSelectedOrder(null) }
    );
  }, [selectedOrder, outcome, note, updateStatus]);

  if (isLoading) {
    return (
      <DashboardLayout title="Espace Livreur" subtitle="Gestion des livraisons">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="font-[Space_Grotesk] flex items-center gap-2">
                  <Truck size={18} className="text-emerald-500" />
                  Livraison — {selectedOrder.id}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <Card className="border-border/60">
                  <CardContent className="p-4 space-y-2">
                    <p className="font-medium">{selectedOrder.customer}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone size={14} />
                      <a href={`tel:${selectedOrder.phone}`} className="underline">{selectedOrder.phone}</a>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin size={14} />
                      <span>{selectedOrder.address}</span>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1 mt-1" asChild>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(selectedOrder.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation size={14} /> Ouvrir dans Maps
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Package size={16} className="text-muted-foreground" />
                  <span className="text-sm">{selectedOrder.items.length} article{selectedOrder.items.length > 1 ? "s" : ""}</span>
                  <span className="ml-auto font-bold font-[Space_Grotesk] flex items-center gap-1">
                    <Banknote size={14} className="text-emerald-500" />
                    {selectedOrder.total.toLocaleString("fr-FR")} F
                  </span>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Résultat de la livraison</label>
                  <Select value={outcome} onValueChange={(v) => setOutcome(v as DeliveryOutcome)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivered">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={14} className="text-emerald-500" /> Livré avec succès
                        </span>
                      </SelectItem>
                      <SelectItem value="returned">
                        <span className="flex items-center gap-1">
                          <RotateCcw size={14} className="text-destructive" /> Retourné
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Note de livraison</label>
                  <Textarea
                    placeholder="Client absent, paiement collecté, remarques..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleFinalize}
                  variant={outcome === "returned" ? "destructive" : "default"}
                  disabled={updateStatus.isPending}
                  className="gap-1"
                >
                  {outcome === "delivered" ? (
                    <><CheckCircle2 size={16} /> Confirmer la livraison</>
                  ) : (
                    <><RotateCcw size={16} /> Marquer retourné</>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <DashboardLayout title="Espace Livreur" subtitle="Gestion des livraisons">
        {/* GPS sharing toggle — only shown when geo_tracking module is active */}
        {geoEnabled && (
          <Card className={`border-2 transition-colors ${gpsEnabled ? "border-emerald-500/50 bg-emerald-500/5" : "border-border/60"}`}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${gpsEnabled ? "bg-emerald-500/20" : "bg-muted"}`}>
                <Radio size={18} className={gpsEnabled ? "text-emerald-500 animate-pulse" : "text-muted-foreground"} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Partage de position GPS</p>
                <p className="text-xs text-muted-foreground">
                  {gpsEnabled ? "Votre position est visible sur la carte admin en temps réel." : "Activez pour que l'admin puisse vous suivre."}
                </p>
              </div>
              <Switch checked={gpsEnabled} onCheckedChange={handleGpsToggle} />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">À livrer</p>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-emerald-500">{livreurOrders.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Livrées aujourd'hui</p>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-accent">{todayStats.delivered}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Retours</p>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-destructive">{todayStats.returned}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Montant collecté</p>
              <p className="text-xl font-bold font-[Space_Grotesk] text-foreground">{todayStats.collected.toLocaleString("fr-FR")} F</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-[Space_Grotesk]">
              Tournée de livraison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {livreurOrders.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                📦 Aucune commande en attente de livraison.
              </p>
            )}
            {livreurOrders.map((order) => {
              const stage = getStageByStatus(order.status);
              const isInTransit = order.status === "in_transit";
              return (
                <div
                  key={order.dbId}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                    isInTransit ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/60 hover:bg-muted/30"
                  }`}
                >
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Truck size={18} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium">{order.id}</span>
                      <Badge variant="outline" className={`text-[10px] ${stage.color} border-0`}>
                        {isInTransit ? "En route" : stage.shortLabel}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{order.customer}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin size={10} /> {order.address}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-[Space_Grotesk]">{order.total.toLocaleString("fr-FR")} F</p>
                    <Button
                      size="sm"
                      variant={isInTransit ? "default" : "outline"}
                      className="gap-1 mt-1"
                      onClick={() => handlePickUp(order)}
                    >
                      <Truck size={14} />
                      {isInTransit ? "Finaliser" : "Prendre en charge"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </DashboardLayout>
    </>
  );
};

export default LivreurWorkspace;
