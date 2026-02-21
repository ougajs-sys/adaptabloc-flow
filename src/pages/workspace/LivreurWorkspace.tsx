import { useState, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Truck, MapPin, Phone, CheckCircle2, RotateCcw, Navigation, Package, Banknote } from "lucide-react";
import { initialOrders, type Order } from "@/lib/orders-store";
import { getStageByStatus, type OrderPipelineStatus } from "@/lib/team-roles";

type DeliveryOutcome = "delivered" | "returned";

const LivreurWorkspace = () => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [outcome, setOutcome] = useState<DeliveryOutcome>("delivered");
  const [note, setNote] = useState("");

  // Livreur sees: ready + in_transit
  const livreurOrders = orders.filter((o) => ["ready", "in_transit"].includes(o.status));
  const deliveredToday = orders.filter(
    (o) => o.status === "delivered" && new Date(o.date).toDateString() === new Date().toDateString()
  ).length;
  const returnedToday = orders.filter(
    (o) => o.status === "returned" && new Date(o.date).toDateString() === new Date().toDateString()
  ).length;
  const totalCollected = orders
    .filter((o) => o.status === "delivered" && o.paymentStatus === "paid")
    .reduce((s, o) => s + o.total, 0);

  const handlePickUp = useCallback((order: Order) => {
    if (order.status === "ready") {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "in_transit" as OrderPipelineStatus } : o))
      );
    }
    setSelectedOrder(order);
    setOutcome("delivered");
    setNote("");
  }, []);

  const handleFinalize = useCallback(() => {
    if (!selectedOrder) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id
          ? { ...o, status: outcome as OrderPipelineStatus, deliveryNote: note || undefined }
          : o
      )
    );
    setSelectedOrder(null);
  }, [selectedOrder, outcome, note]);

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
                {/* Destination */}
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

                {/* Colis summary */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Package size={16} className="text-muted-foreground" />
                  <span className="text-sm">{selectedOrder.items.length} article{selectedOrder.items.length > 1 ? "s" : ""}</span>
                  <span className="ml-auto font-bold font-[Space_Grotesk] flex items-center gap-1">
                    <Banknote size={14} className="text-emerald-500" />
                    {selectedOrder.total.toLocaleString("fr-FR")} F
                  </span>
                </div>

                {/* Outcome */}
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
        {/* KPIs */}
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
              <p className="text-2xl font-bold font-[Space_Grotesk] text-accent">{deliveredToday}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Retours</p>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-destructive">{returnedToday}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Montant collecté</p>
              <p className="text-xl font-bold font-[Space_Grotesk] text-foreground">{totalCollected.toLocaleString("fr-FR")} F</p>
            </CardContent>
          </Card>
        </div>

        {/* Delivery queue */}
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
                  key={order.id}
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
