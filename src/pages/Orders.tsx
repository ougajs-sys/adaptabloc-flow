import { useState, useCallback, useEffect } from "react";
import { usePagination } from "@/hooks/usePagination";
import { DataPagination } from "@/components/ui/data-pagination";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Eye, Package, MapPin, Phone, LayoutGrid, List, Pencil, Trash2, Loader2 } from "lucide-react";
import { OrderPipeline, type PipelineOrder } from "@/components/orders/OrderPipeline";
import { getStageByStatus, pipelineStages, type OrderPipelineStatus } from "@/lib/team-roles";
import { NewOrderDialog, type NewOrderFormValues } from "@/components/orders/NewOrderDialog";
import { EditOrderDialog, type EditOrderFormValues } from "@/components/orders/EditOrderDialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OrderItem {
  name: string;
  qty: number;
  price: number;
  variant?: string;
}

interface Order {
  id: string;
  dbId: string; // uuid from DB
  customer: string;
  phone: string;
  email: string;
  items: OrderItem[];
  total: number;
  status: OrderPipelineStatus;
  paymentStatus: string;
  date: string;
  address: string;
  assignee?: string;
}

const paymentConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  paid: { label: "Payé", variant: "default" },
  pending: { label: "En attente", variant: "outline" },
  refunded: { label: "Remboursé", variant: "destructive" },
};

// Map DB order_status to frontend OrderPipelineStatus
function mapDbStatus(dbStatus: string): OrderPipelineStatus {
  if (dbStatus === "shipping") return "in_transit";
  return dbStatus as OrderPipelineStatus;
}
function mapToDbStatus(frontStatus: OrderPipelineStatus): string {
  if (frontStatus === "in_transit") return "shipping";
  return frontStatus;
}

const Orders = () => {
  const { user } = useAuth();
  const storeId = user?.store_id;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);

    const { data: dbOrders, error } = await supabase
      .from("orders")
      .select("*, customers(name, phone, email), order_items(*)")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const mapped: Order[] = (dbOrders || []).map((o) => {
      const items: OrderItem[] = (o.order_items || []).map((oi: any) => ({
        name: oi.product_name,
        qty: oi.quantity,
        price: oi.unit_price,
        variant: undefined,
      }));
      return {
        id: o.order_number,
        dbId: o.id,
        customer: (o.customers as any)?.name || "Client inconnu",
        phone: (o.customers as any)?.phone || "",
        email: (o.customers as any)?.email || "",
        items,
        total: o.total_amount,
        status: mapDbStatus(o.status),
        paymentStatus: "pending", // TODO: add payment_status column
        date: o.created_at,
        address: o.shipping_address || "",
        assignee: undefined,
      };
    });

    setOrders(mapped);
    setLoading(false);
  }, [storeId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleNewOrder = async (values: NewOrderFormValues) => {
    if (!storeId) return;

    // Generate order number
    const orderNumber = `CMD-${Date.now().toString().slice(-6)}`;
    const totalAmount = values.items.reduce((s, i) => s + i.qty * i.price, 0);

    // Find or create customer
    let customerId: string | null = null;
    if (values.customer && values.phone) {
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("store_id", storeId)
        .eq("phone", values.phone)
        .limit(1);

      if (existing && existing.length > 0) {
        customerId = existing[0].id;
      } else {
        const { data: newCust } = await supabase
          .from("customers")
          .insert({ store_id: storeId, name: values.customer, phone: values.phone, email: values.email || null })
          .select("id")
          .single();
        customerId = newCust?.id || null;
      }
    }

    const { data: newOrder, error } = await supabase
      .from("orders")
      .insert({
        store_id: storeId,
        order_number: orderNumber,
        customer_id: customerId,
        total_amount: totalAmount,
        shipping_address: values.address,
        status: "new",
        created_by: user?.id,
      })
      .select()
      .single();

    if (error || !newOrder) {
      toast({ title: "Erreur", description: error?.message, variant: "destructive" });
      return;
    }

    // Insert order items with product_id lookup + stock deduction
    if (values.items.length > 0) {
      // Lookup product IDs by name for this store
      const { data: storeProducts } = await supabase
        .from("products")
        .select("id, name, stock")
        .eq("store_id", storeId)
        .eq("is_active", true);

      const productMap = new Map(
        (storeProducts || []).map((p) => [p.name, p])
      );

      const itemsToInsert = values.items.map((i) => {
        const product = productMap.get(i.name);
        return {
          order_id: newOrder.id,
          product_id: product?.id || null,
          product_name: i.name,
          quantity: i.qty,
          unit_price: i.price,
          total_price: i.qty * i.price,
        };
      });

      await supabase.from("order_items").insert(itemsToInsert);

      // Deduct stock for each product
      for (const item of itemsToInsert) {
        if (item.product_id) {
          const product = productMap.get(item.product_name);
          if (product && product.stock != null) {
            const newStock = Math.max(0, product.stock - item.quantity);
            await supabase
              .from("products")
              .update({ stock: newStock })
              .eq("id", item.product_id);
          }
        }
      }
    }

    toast({ title: "Commande créée" });
    fetchOrders();
  };

  const handleEditOrder = async (values: EditOrderFormValues) => {
    if (!editingOrder) return;
    const totalAmount = values.items.reduce((s, i) => s + i.qty * i.price, 0);

    await supabase.from("orders").update({
      shipping_address: values.address,
      total_amount: totalAmount,
    }).eq("id", editingOrder.dbId);

    // Replace order items
    await supabase.from("order_items").delete().eq("order_id", editingOrder.dbId);
    await supabase.from("order_items").insert(
      values.items.map((i) => ({
        order_id: editingOrder.dbId,
        product_name: i.name,
        quantity: i.qty,
        unit_price: i.price,
        total_price: i.qty * i.price,
      }))
    );

    toast({ title: "Commande modifiée" });
    setEditingOrder(null);
    fetchOrders();
  };

  const handleDeleteOrder = async () => {
    if (!deletingOrder) return;
    await supabase.from("order_items").delete().eq("order_id", deletingOrder.dbId);
    const { error } = await supabase.from("orders").delete().eq("id", deletingOrder.dbId);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Commande supprimée" });
    }
    setDeletingOrder(null);
    fetchOrders();
  };

  const filtered = orders.filter((o) => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const PAGE_SIZE = 20;
  const { page, totalPages, paginated: paginatedOrders, next, prev, goTo, total: filteredTotal } = usePagination(filtered, PAGE_SIZE);

  const handleAdvance = useCallback(async (orderId: string, nextStatus: OrderPipelineStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const dbStatus = mapToDbStatus(nextStatus);
    await supabase.from("orders").update({ status: dbStatus as any }).eq("id", order.dbId);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
  }, [orders]);

  const handleCancel = useCallback(async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    await supabase.from("orders").update({ status: "cancelled" as any }).eq("id", order.dbId);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" as OrderPipelineStatus } : o)));
  }, [orders]);

  const pipelineOrders: PipelineOrder[] = (viewMode === "kanban" ? filtered : paginatedOrders).map((o) => ({
    id: o.id, customer: o.customer, phone: o.phone, address: o.address,
    total: o.total, itemCount: o.items.length, status: o.status, assignee: o.assignee, date: o.date,
  }));

  const total = orders.length;
  const inProgress = orders.filter((o) => ["caller_pending", "confirmed", "preparing", "ready", "in_transit"].includes(o.status)).length;
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;

  if (loading) {
    return (
      <DashboardLayout title="Commandes">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
    <NewOrderDialog open={newOrderOpen} onOpenChange={setNewOrderOpen} onSubmit={handleNewOrder} />
    {editingOrder && (
      <EditOrderDialog
        open={!!editingOrder}
        onOpenChange={(v) => { if (!v) setEditingOrder(null); }}
        onSubmit={handleEditOrder}
        defaultValues={{
          customer: editingOrder.customer,
          phone: editingOrder.phone,
          email: editingOrder.email,
          address: editingOrder.address,
          paymentStatus: editingOrder.paymentStatus as "pending" | "paid" | "refunded",
          items: editingOrder.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price, variant: i.variant || "" })),
        }}
      />
    )}
    <AlertDialog open={!!deletingOrder} onOpenChange={(v) => { if (!v) setDeletingOrder(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer la commande {deletingOrder?.id} ?</AlertDialogTitle>
          <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <DashboardLayout
      title="Commandes"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border overflow-hidden">
            <Button size="sm" variant={viewMode === "kanban" ? "default" : "ghost"} className="rounded-none h-8 px-2" onClick={() => setViewMode("kanban")}><LayoutGrid size={14} /></Button>
            <Button size="sm" variant={viewMode === "list" ? "default" : "ghost"} className="rounded-none h-8 px-2" onClick={() => setViewMode("list")}><List size={14} /></Button>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setNewOrderOpen(true)}><Plus size={16} /> Nouvelle commande</Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: total, color: "text-foreground" },
          { label: "En cours", value: inProgress, color: "text-primary" },
          { label: "Livrées", value: delivered, color: "text-accent" },
          { label: "Annulées", value: cancelled, color: "text-destructive" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold font-[Space_Grotesk] ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par ID ou client..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {pipelineStages.map((s) => <SelectItem key={s.status} value={s.status}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {viewMode === "kanban" ? (
        <OrderPipeline orders={pipelineOrders} onAdvance={handleAdvance} onCancel={handleCancel} />
      ) : (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Étape</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => {
                  const stage = getStageByStatus(order.status);
                  const payment = paymentConfig[order.paymentStatus] || paymentConfig.pending;
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs font-medium">{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{order.customer}</p>
                          <p className="text-xs text-muted-foreground">{order.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{order.items.length} article{order.items.length > 1 ? "s" : ""}</TableCell>
                      <TableCell className="font-medium">{order.total.toLocaleString("fr-FR")} F</TableCell>
                      <TableCell><Badge variant={payment.variant} className="text-xs">{payment.label}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={`text-xs ${stage.color} border-0`}>{stage.label}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(order.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}><Eye size={14} /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingOrder(order)}><Pencil size={14} /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingOrder(order)}><Trash2 size={14} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <DataPagination page={page} totalPages={totalPages} total={filteredTotal} pageSize={PAGE_SIZE} onPrev={prev} onNext={next} onGoTo={goTo} />
          </CardContent>
        </Card>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="font-[Space_Grotesk]">Commande {selectedOrder.id}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge variant="outline" className={`${getStageByStatus(selectedOrder.status).color} border-0`}>{getStageByStatus(selectedOrder.status).label}</Badge>
                  <Badge variant={(paymentConfig[selectedOrder.paymentStatus] || paymentConfig.pending).variant}>{(paymentConfig[selectedOrder.paymentStatus] || paymentConfig.pending).label}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><Phone size={14} /><span>{selectedOrder.customer} — {selectedOrder.phone}</span></div>
                  <div className="flex items-center gap-2 text-muted-foreground"><MapPin size={14} /><span>{selectedOrder.address}</span></div>
                  {selectedOrder.assignee && <div className="flex items-center gap-2 text-muted-foreground"><Package size={14} /><span>Assigné à : {selectedOrder.assignee}</span></div>}
                </div>
                <div className="border-t border-border pt-3">
                  <p className="text-sm font-medium mb-2">Articles</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <div>
                          <span>{item.name}</span>
                          {item.variant && <span className="text-xs text-muted-foreground ml-1">({item.variant})</span>}
                          <span className="text-muted-foreground"> ×{item.qty}</span>
                        </div>
                        <span className="font-medium">{(item.price * item.qty).toLocaleString("fr-FR")} F</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm font-bold mt-3 pt-2 border-t border-border">
                    <span>Total</span>
                    <span>{selectedOrder.total.toLocaleString("fr-FR")} F</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => { setSelectedOrder(null); setEditingOrder(selectedOrder); }}>
                    <Pencil size={14} /> Modifier
                  </Button>
                  <Button variant="destructive" className="flex-1 gap-2" onClick={() => { setSelectedOrder(null); setDeletingOrder(selectedOrder); }}>
                    <Trash2 size={14} /> Supprimer
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
    </>
  );
};

export default Orders;
