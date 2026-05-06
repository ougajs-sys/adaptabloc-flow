import { useState, useCallback, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  PackageCheck, Package, CheckCircle2, ClipboardList, Loader2,
  Timer, MapPin,
} from "lucide-react";
import { useWorkspaceOrders, type WorkspaceOrder } from "@/hooks/useWorkspaceOrders";
import { getStageByStatus } from "@/lib/team-roles";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/contexts/ModulesContext";
import { useToast } from "@/hooks/use-toast";

interface WarehousePost {
  id: string;
  name: string;
}

// ── Prep timer ─────────────────────────────────────────────────────────────────

function usePrepTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active) {
      setSeconds(0);
      ref.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (ref.current) clearInterval(ref.current);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [active]);

  const fmt = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return { seconds, fmt };
}

// ── Main component ─────────────────────────────────────────────────────────────

const PreparateurWorkspace = () => {
  const { user } = useAuth();
  const storeId = user?.store_id;
  const { hasModule } = useModules();
  const { toast } = useToast();

  const { orders, isLoading, todayStats, updateStatus } = useWorkspaceOrders([
    "confirmed", "preparing", "ready",
  ]);

  const [selectedOrder, setSelectedOrder] = useState<WorkspaceOrder | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [note, setNote] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const { seconds: prepDuration, fmt: timerFmt } = usePrepTimer(!!selectedOrder);

  const prepOrders = orders.filter((o) => ["confirmed", "preparing"].includes(o.status));

  // ── Fetch warehouse posts (only if module enabled) ──────────────────────────

  const warehouseEnabled = hasModule("warehouse_team");

  const { data: posts = [] } = useQuery<WarehousePost[]>({
    queryKey: ["warehouse-posts", storeId],
    enabled: !!storeId && warehouseEnabled,
    queryFn: async () => {
      const { data, error } = await (supabase.from("warehouse_posts" as any) as any)
        .select("id, name")
        .eq("store_id", storeId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data || []) as WarehousePost[];
    },
  });

  // ── Log preparation mutation ────────────────────────────────────────────────

  const logPrep = useMutation({
    mutationFn: async ({
      orderId,
      durationSeconds,
      notes,
      postId,
      itemsCount,
    }: {
      orderId: string;
      durationSeconds?: number;
      notes?: string;
      postId?: string;
      itemsCount?: number;
    }) => {
      const { error } = await (supabase.from("preparation_logs" as any) as any).insert({
        store_id: storeId,
        order_id: orderId,
        preparer_id: user?.id,
        post_id: postId || null,
        duration_seconds: durationSeconds || null,
        notes: notes || null,
        items_count: itemsCount || null,
        completed_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onError: (err: any) =>
      toast({ title: "Erreur log", description: err.message, variant: "destructive" }),
  });

  const handleStartPrep = useCallback((order: WorkspaceOrder) => {
    if (order.status === "confirmed") {
      updateStatus.mutate({ dbId: order.dbId, status: "preparing" });
    }
    setSelectedOrder(order);
    setCheckedItems({});
    setNote("");
  }, [updateStatus]);

  const allChecked = selectedOrder
    ? selectedOrder.items.every((_, i) => checkedItems[i])
    : false;

  const handleMarkReady = useCallback(() => {
    if (!selectedOrder) return;
    updateStatus.mutate(
      { dbId: selectedOrder.dbId, status: "ready", notes: note || undefined },
      {
        onSuccess: () => {
          if (warehouseEnabled) {
            logPrep.mutate({
              orderId: selectedOrder.dbId,
              durationSeconds: prepDuration > 0 ? prepDuration : undefined,
              notes: note || undefined,
              postId: selectedPostId || undefined,
              itemsCount: selectedOrder.items.reduce((s, i) => s + i.qty, 0),
            });
          }
          setSelectedOrder(null);
        },
      }
    );
  }, [selectedOrder, note, selectedPostId, prepDuration, warehouseEnabled, updateStatus, logPrep]);

  if (isLoading) {
    return (
      <DashboardLayout title="Espace Préparateur" subtitle="Préparation des colis">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      {/* ── Prep dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="font-[Space_Grotesk] flex items-center gap-2">
                  <PackageCheck size={18} className="text-amber-500" />
                  Préparation — {selectedOrder.id}
                  <span className="ml-auto flex items-center gap-1 text-sm font-normal text-muted-foreground tabular-nums">
                    <Timer size={14} /> {timerFmt}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Customer + post selector row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{selectedOrder.customer}</p>
                    {selectedOrder.address && (
                      <p className="text-xs text-muted-foreground truncate">{selectedOrder.address}</p>
                    )}
                  </div>
                  {warehouseEnabled && posts.length > 0 && (
                    <Select
                      value={selectedPostId ?? ""}
                      onValueChange={(v) => setSelectedPostId(v || null)}
                    >
                      <SelectTrigger className="w-44 shrink-0 h-8 text-xs gap-1">
                        <MapPin size={12} className="text-muted-foreground" />
                        <SelectValue placeholder="Choisir un poste" />
                      </SelectTrigger>
                      <SelectContent>
                        {posts.map((post) => (
                          <SelectItem key={post.id} value={post.id} className="text-sm">
                            {post.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Packing list */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <ClipboardList size={14} /> Liste de colisage
                    <span className="ml-auto text-xs text-muted-foreground">
                      {Object.values(checkedItems).filter(Boolean).length}/{selectedOrder.items.length} articles
                    </span>
                  </p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, i) => (
                      <label
                        key={i}
                        className={`flex items-center gap-3 p-2.5 rounded-md border transition-colors cursor-pointer ${
                          checkedItems[i]
                            ? "border-amber-500/40 bg-amber-500/5"
                            : "border-border/60 hover:bg-muted/30"
                        }`}
                      >
                        <Checkbox
                          checked={!!checkedItems[i]}
                          onCheckedChange={(v) =>
                            setCheckedItems((prev) => ({ ...prev, [i]: !!v }))
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{item.name}</span>
                          {item.variant && (
                            <span className="text-xs text-muted-foreground ml-1">({item.variant})</span>
                          )}
                          {item.price > 0 && (
                            <span className="text-xs text-muted-foreground ml-2">
                              {(item.price * item.qty).toLocaleString("fr-FR")} F
                            </span>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">×{item.qty}</Badge>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Note de préparation</label>
                  <Textarea
                    placeholder="Emballage spécial, produit fragile, remarques..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedOrder(null)}
                    disabled={updateStatus.isPending}
                  >
                    Fermer
                  </Button>
                  <Button
                    className="flex-1 gap-1"
                    onClick={handleMarkReady}
                    disabled={!allChecked || updateStatus.isPending}
                  >
                    {updateStatus.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    Colis prêt
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <DashboardLayout title="Espace Préparateur" subtitle="Préparation des colis">
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
              <p className="text-2xl font-bold font-[Space_Grotesk] text-accent">{todayStats.ready}</p>
            </CardContent>
          </Card>
        </div>

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
                  key={order.dbId}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                    isPreparing
                      ? "border-amber-500/40 bg-amber-500/5"
                      : "border-border/60 hover:bg-muted/30"
                  }`}
                >
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
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
