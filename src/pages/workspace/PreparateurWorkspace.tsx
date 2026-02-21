import { useState, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { PackageCheck, Package, CheckCircle2, ClipboardList } from "lucide-react";
import { initialOrders, type Order } from "@/lib/orders-store";
import { getStageByStatus, type OrderPipelineStatus } from "@/lib/team-roles";

const PreparateurWorkspace = () => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [note, setNote] = useState("");

  // Préparateur sees: confirmed + preparing
  const prepOrders = orders.filter((o) => ["confirmed", "preparing"].includes(o.status));
  const readyToday = orders.filter(
    (o) => o.status === "ready" && new Date(o.date).toDateString() === new Date().toDateString()
  ).length;

  const handleStartPrep = useCallback((order: Order) => {
    if (order.status === "confirmed") {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "preparing" as OrderPipelineStatus } : o))
      );
    }
    setSelectedOrder(order);
    setCheckedItems({});
    setNote("");
  }, []);

  const allChecked = selectedOrder
    ? selectedOrder.items.every((_, i) => checkedItems[i])
    : false;

  const handleMarkReady = useCallback(() => {
    if (!selectedOrder) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id
          ? { ...o, status: "ready" as OrderPipelineStatus, prepNote: note || undefined }
          : o
      )
    );
    setSelectedOrder(null);
  }, [selectedOrder, note]);

  return (
    <>
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="font-[Space_Grotesk] flex items-center gap-2">
                  <PackageCheck size={18} className="text-amber-500" />
                  Préparation — {selectedOrder.id}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedOrder.customer}</span> — {selectedOrder.address}
                </div>

                {/* Checklist */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <ClipboardList size={14} /> Liste de colisage
                  </p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, i) => (
                      <label
                        key={i}
                        className={`flex items-center gap-3 p-2.5 rounded-md border transition-colors cursor-pointer ${
                          checkedItems[i] ? "border-amber-500/40 bg-amber-500/5" : "border-border/60"
                        }`}
                      >
                        <Checkbox
                          checked={!!checkedItems[i]}
                          onCheckedChange={(v) =>
                            setCheckedItems((prev) => ({ ...prev, [i]: !!v }))
                          }
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium">{item.name}</span>
                          {item.variant && (
                            <span className="text-xs text-muted-foreground ml-1">({item.variant})</span>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">×{item.qty}</Badge>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Note de préparation</label>
                  <Textarea
                    placeholder="Remarques sur le colis (emballage spécial, produit fragile...)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleMarkReady} disabled={!allChecked} className="gap-1">
                  <CheckCircle2 size={16} /> Colis prêt
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <DashboardLayout title="Espace Préparateur" subtitle="Préparation des colis">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">À préparer</p>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-amber-500">{prepOrders.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">En cours</p>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-foreground">
                {orders.filter((o) => o.status === "preparing").length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Prêts aujourd'hui</p>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-accent">{readyToday}</p>
            </CardContent>
          </Card>
        </div>

        {/* Order queue */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-[Space_Grotesk]">
              Commandes à préparer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {prepOrders.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                ✅ Aucune commande à préparer pour le moment.
              </p>
            )}
            {prepOrders.map((order) => {
              const stage = getStageByStatus(order.status);
              const isPreparing = order.status === "preparing";
              return (
                <div
                  key={order.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                    isPreparing ? "border-amber-500/40 bg-amber-500/5" : "border-border/60 hover:bg-muted/30"
                  }`}
                >
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Package size={18} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium">{order.id}</span>
                      <Badge variant="outline" className={`text-[10px] ${stage.color} border-0`}>
                        {isPreparing ? "En cours" : stage.shortLabel}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} article{order.items.length > 1 ? "s" : ""} · {order.total.toLocaleString("fr-FR")} F
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={isPreparing ? "default" : "outline"}
                    className="gap-1 shrink-0"
                    onClick={() => handleStartPrep(order)}
                  >
                    <PackageCheck size={14} />
                    {isPreparing ? "Continuer" : "Préparer"}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </DashboardLayout>
    </>
  );
};

export default PreparateurWorkspace;
