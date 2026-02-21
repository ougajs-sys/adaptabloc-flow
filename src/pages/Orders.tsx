import { useState, useCallback } from "react";
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
import { Search, Plus, Eye, Package, MapPin, Phone, LayoutGrid, List, Pencil, Trash2 } from "lucide-react";
import { OrderPipeline, type PipelineOrder } from "@/components/orders/OrderPipeline";
import { getStageByStatus, pipelineStages, type OrderPipelineStatus } from "@/lib/team-roles";
import { NewOrderDialog, type NewOrderFormValues } from "@/components/orders/NewOrderDialog";
import { EditOrderDialog, type EditOrderFormValues } from "@/components/orders/EditOrderDialog";
import { toast } from "@/hooks/use-toast";

interface Order {
  id: string;
  customer: string;
  phone: string;
  email: string;
  items: { name: string; qty: number; price: number; variant?: string }[];
  total: number;
  status: OrderPipelineStatus;
  paymentStatus: string;
  date: string;
  address: string;
  assignee?: string;
}

const initialOrders: Order[] = [
  {
    id: "CMD-1247", customer: "Aminata Diallo", phone: "+225 07 12 34 56", email: "aminata@mail.com",
    items: [
      { name: "Sneakers Urban Pro", qty: 1, price: 25000, variant: "Taille 42 - Noir" },
      { name: "T-Shirt Classic Fit", qty: 2, price: 10000, variant: "Taille M - Blanc" },
    ],
    total: 45000, status: "delivered", paymentStatus: "paid", date: "2026-02-13T14:30:00",
    address: "Cocody, Rue des Jardins, Abidjan", assignee: "Koné Mamadou",
  },
  {
    id: "CMD-1246", customer: "Moussa Koné", phone: "+225 05 98 76 54", email: "moussa.k@mail.com",
    items: [{ name: "Sac Bandoulière Cuir", qty: 1, price: 28500, variant: "Marron" }],
    total: 28500, status: "in_transit", paymentStatus: "paid", date: "2026-02-13T12:15:00",
    address: "Plateau, Av. Terrasson, Abidjan", assignee: "Traoré Issa",
  },
  {
    id: "CMD-1245", customer: "Fatou Sow", phone: "+225 01 23 45 67", email: "fatou.s@mail.com",
    items: [
      { name: "Robe Été Fleurie", qty: 1, price: 18000, variant: "Taille S" },
      { name: "Sandales Dorées", qty: 1, price: 15000, variant: "Pointure 38" },
      { name: "Bracelet Perles", qty: 3, price: 2000 },
      { name: "Lunettes Soleil", qty: 1, price: 12000 },
      { name: "Foulard Soie", qty: 1, price: 16000 },
    ],
    total: 67000, status: "preparing", paymentStatus: "paid", date: "2026-02-13T10:45:00",
    address: "Marcory, Zone 4, Abidjan", assignee: "Sow Mariama",
  },
  {
    id: "CMD-1244", customer: "Ibrahim Traoré", phone: "+225 07 65 43 21", email: "ibrahim.t@mail.com",
    items: [{ name: "Casquette Sport", qty: 1, price: 15000 }],
    total: 15000, status: "delivered", paymentStatus: "paid", date: "2026-02-12T16:00:00",
    address: "Yopougon, Quartier Millionnaire, Abidjan", assignee: "Bamba Ali",
  },
  {
    id: "CMD-1243", customer: "Aïcha Bamba", phone: "+225 05 11 22 33", email: "aicha.b@mail.com",
    items: [
      { name: "Sneakers Urban Pro", qty: 2, price: 25000, variant: "Taille 39 - Blanc" },
      { name: "Sac à Dos Premium", qty: 1, price: 35000 },
      { name: "Montre Sport", qty: 1, price: 22000 },
    ],
    total: 107000, status: "cancelled", paymentStatus: "refunded", date: "2026-02-12T09:30:00",
    address: "Riviera 3, Abidjan",
  },
  {
    id: "CMD-1242", customer: "Oumar Cissé", phone: "+225 01 44 55 66", email: "oumar.c@mail.com",
    items: [
      { name: "Polo Premium", qty: 1, price: 18500, variant: "Taille L - Bleu" },
      { name: "Ceinture Cuir", qty: 1, price: 15000 },
    ],
    total: 33500, status: "confirmed", paymentStatus: "paid", date: "2026-02-12T08:00:00",
    address: "Treichville, Av. 12, Abidjan",
  },
  {
    id: "CMD-1241", customer: "Mariam Touré", phone: "+225 07 77 88 99", email: "mariam.t@mail.com",
    items: [{ name: "Ensemble Sport Femme", qty: 1, price: 32000, variant: "Taille M - Rose" }],
    total: 32000, status: "new", paymentStatus: "pending", date: "2026-02-11T18:20:00",
    address: "Abobo, Rond-point, Abidjan",
  },
  {
    id: "CMD-1240", customer: "Sékou Diarra", phone: "+225 05 00 11 22", email: "sekou.d@mail.com",
    items: [
      { name: "Chemise Lin", qty: 2, price: 22000, variant: "Taille XL - Beige" },
      { name: "Pantalon Chino", qty: 1, price: 18000, variant: "Taille 44 - Kaki" },
    ],
    total: 62000, status: "caller_pending", paymentStatus: "paid", date: "2026-02-11T15:10:00",
    address: "Bingerville, Résidence Palm, Abidjan", assignee: "Diallo Fatoumata",
  },
];

const paymentConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  paid: { label: "Payé", variant: "default" },
  pending: { label: "En attente", variant: "outline" },
  refunded: { label: "Remboursé", variant: "destructive" },
};

let orderCounter = initialOrders.length + 1;

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);

  const handleNewOrder = (values: NewOrderFormValues) => {
    const id = `CMD-${1240 + orderCounter++}`;
    const newOrder: Order = {
      id,
      customer: values.customer,
      phone: values.phone,
      email: values.email,
      items: values.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price, variant: i.variant || undefined })),
      total: values.items.reduce((s, i) => s + i.qty * i.price, 0),
      status: "new",
      paymentStatus: values.paymentStatus,
      date: new Date().toISOString(),
      address: values.address,
    };
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleEditOrder = (values: EditOrderFormValues) => {
    if (!editingOrder) return;
    setOrders((prev) => prev.map((o) => o.id === editingOrder.id ? {
      ...o,
      customer: values.customer,
      phone: values.phone,
      email: values.email,
      address: values.address,
      paymentStatus: values.paymentStatus,
      items: values.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price, variant: i.variant || undefined })),
      total: values.items.reduce((s, i) => s + i.qty * i.price, 0),
    } : o));
    toast({ title: "Commande modifiée" });
  };

  const handleDeleteOrder = () => {
    if (!deletingOrder) return;
    setOrders((prev) => prev.filter((o) => o.id !== deletingOrder.id));
    setDeletingOrder(null);
    toast({ title: "Commande supprimée" });
  };

  const filtered = orders.filter((o) => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAdvance = useCallback((orderId: string, nextStatus: OrderPipelineStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
  }, []);

  const handleCancel = useCallback((orderId: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" as OrderPipelineStatus } : o)));
  }, []);

  const pipelineOrders: PipelineOrder[] = filtered.map((o) => ({
    id: o.id, customer: o.customer, phone: o.phone, address: o.address,
    total: o.total, itemCount: o.items.length, status: o.status, assignee: o.assignee, date: o.date,
  }));

  const total = orders.length;
  const inProgress = orders.filter((o) => ["caller_pending", "confirmed", "preparing", "ready", "in_transit"].includes(o.status)).length;
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;

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
      {/* Summary Cards */}
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

      {/* Filters */}
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
                {filtered.map((order) => {
                  const stage = getStageByStatus(order.status);
                  const payment = paymentConfig[order.paymentStatus];
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
                  <Badge variant={paymentConfig[selectedOrder.paymentStatus].variant}>{paymentConfig[selectedOrder.paymentStatus].label}</Badge>
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
