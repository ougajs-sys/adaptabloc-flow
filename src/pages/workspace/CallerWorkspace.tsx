import { useState, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Phone, MapPin, CheckCircle2, XCircle, ArrowRight, MessageSquare, Package } from "lucide-react";
import { initialOrders, type Order } from "@/lib/orders-store";
import { getStageByStatus, type OrderPipelineStatus } from "@/lib/team-roles";

const CallerWorkspace = () => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [note, setNote] = useState("");

  // Caller sees: new + caller_pending orders
  const callerOrders = orders.filter((o) =>
    ["new", "caller_pending"].includes(o.status)
  );
  const confirmedToday = orders.filter(
    (o) => o.status === "confirmed" && new Date(o.date).toDateString() === new Date().toDateString()
  ).length;
  const cancelledToday = orders.filter(
    (o) => o.status === "cancelled" && new Date(o.date).toDateString() === new Date().toDateString()
  ).length;

  const handlePickUp = useCallback((order: Order) => {
    // Move from "new" → "caller_pending" (caller picks it up)
    if (order.status === "new") {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "caller_pending" as OrderPipelineStatus } : o))
      );
    }
    setSelectedOrder(orders.find((o) => o.id === order.id) || order);
    setNote("");
  }, [orders]);

  const handleConfirm = useCallback(() => {
    if (!selectedOrder) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id
          ? { ...o, status: "confirmed" as OrderPipelineStatus, callerNote: note || undefined }
          : o
      )
    );
    setSelectedOrder(null);
  }, [selectedOrder, note]);

  const handleCancel = useCallback(() => {
    if (!selectedOrder) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id
          ? { ...o, status: "cancelled" as OrderPipelineStatus, callerNote: note || undefined }
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
                  <Phone size={18} className="text-blue-500" />
                  Appel — {selectedOrder.id}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Client info */}
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
                  </CardContent>
                </Card>

                {/* Items */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Package size={14} /> Articles commandés
                  </p>
                  <div className="space-y-1">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>
                          {item.name}
                          {item.variant && <span className="text-muted-foreground ml-1">({item.variant})</span>}
                          <span className="text-muted-foreground"> ×{item.qty}</span>
                        </span>
                        <span className="font-medium">{(item.price * item.qty).toLocaleString("fr-FR")} F</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-border">
                    <span>Total</span>
                    <span>{selectedOrder.total.toLocaleString("fr-FR")} F</span>
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="text-sm font-medium flex items-center gap-1 mb-1">
                    <MessageSquare size={14} /> Note d'appel
                  </label>
                  <Textarea
                    placeholder="Adresse confirmée, client joignable, remarques..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="destructive" onClick={handleCancel} className="gap-1">
                  <XCircle size={16} /> Annuler la commande
                </Button>
                <Button onClick={handleConfirm} className="gap-1">
                  <CheckCircle2 size={16} /> Confirmer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <DashboardLayout title="Espace Caller" subtitle="Confirmation des commandes">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">À traiter</p>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-blue-500">{callerOrders.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Confirmées aujourd'hui</p>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-accent">{confirmedToday}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Annulées aujourd'hui</p>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-destructive">{cancelledToday}</p>
            </CardContent>
          </Card>
        </div>

        {/* Order queue */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-[Space_Grotesk]">
              File d'attente — Commandes à confirmer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {callerOrders.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                🎉 Aucune commande en attente ! Tout est confirmé.
              </p>
            )}
            {callerOrders.map((order) => {
              const stage = getStageByStatus(order.status);
              return (
                <div
                  key={order.id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-500/10 text-blue-500 text-xs font-bold">
                      {order.customer.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium">{order.id}</span>
                      <Badge variant="outline" className={`text-[10px] ${stage.color} border-0`}>
                        {stage.shortLabel}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">{order.phone} · {order.items.length} article{order.items.length > 1 ? "s" : ""} · {order.total.toLocaleString("fr-FR")} F</p>
                  </div>
                  <Button size="sm" className="gap-1 shrink-0" onClick={() => handlePickUp(order)}>
                    <Phone size={14} /> Appeler
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

export default CallerWorkspace;
