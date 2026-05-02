import { useState, useEffect, useCallback } from "react";
import { normalize } from "@/lib/normalize";
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus, Star, Users, TrendingUp, Loader2, Upload } from "lucide-react";
import { NewCustomerDialog, type NewCustomerFormValues } from "@/components/customers/NewCustomerDialog";
import { EditCustomerDialog, type EditCustomerFormValues } from "@/components/customers/EditCustomerDialog";
import { CustomerDetailDialog } from "@/components/customers/CustomerDetailDialog";
import { ExportButton } from "@/components/shared/ExportButton";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  segment: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
  loyaltyPoints: number;
  joinDate: string;
}

const segmentConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  vip: { label: "VIP", variant: "default" },
  regular: { label: "Régulier", variant: "secondary" },
  new: { label: "Nouveau", variant: "outline" },
  inactive: { label: "Inactif", variant: "destructive" },
  standard: { label: "Standard", variant: "secondary" },
};

const Customers = () => {
  const { user } = useAuth();
  const storeId = user?.store_id;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fetch order stats per customer
    const { data: ordersData } = await supabase
      .from("orders")
      .select("customer_id, total_amount, created_at")
      .eq("store_id", storeId);

    // Build stats map
    const statsMap: Record<string, { count: number; spent: number; lastDate: string }> = {};
    (ordersData || []).forEach((o) => {
      if (!o.customer_id) return;
      if (!statsMap[o.customer_id]) {
        statsMap[o.customer_id] = { count: 0, spent: 0, lastDate: o.created_at };
      }
      statsMap[o.customer_id].count++;
      statsMap[o.customer_id].spent += o.total_amount || 0;
      if (o.created_at > statsMap[o.customer_id].lastDate) {
        statsMap[o.customer_id].lastDate = o.created_at;
      }
    });

    const mapped: Customer[] = (data || []).map((c) => {
      const stats = statsMap[c.id];
      return {
        id: c.id,
        name: c.name,
        phone: c.phone || "",
        email: c.email || "",
        segment: c.segment || "standard",
        totalOrders: stats?.count ?? 0,
        totalSpent: stats?.spent ?? 0,
        lastOrder: stats?.lastDate ?? c.updated_at,
        loyaltyPoints: c.loyalty_points ?? 0,
        joinDate: c.created_at,
      };
    });

    setCustomers(mapped);
    setLoading(false);
  }, [storeId]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleNewCustomer = async (values: NewCustomerFormValues) => {
    if (!storeId) return;
    const { error } = await supabase.from("customers").insert({
      store_id: storeId,
      name: values.name,
      phone: values.phone,
      email: values.email || null,
      segment: values.segment,
      address: values.address || null,
      notes: values.notes || null,
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Client ajouté" });
    fetchCustomers();
  };

  const handleEditCustomer = async (values: EditCustomerFormValues) => {
    if (!editingCustomer) return;
    const { error } = await supabase.from("customers").update({
      name: values.name,
      phone: values.phone,
      email: values.email || null,
      segment: values.segment,
    }).eq("id", editingCustomer.id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Client modifié" });
    }
    setEditingCustomer(null);
    fetchCustomers();
  };

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    const { error } = await supabase.from("customers").delete().eq("id", deletingCustomer.id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Client supprimé" });
    }
    setDeletingCustomer(null);
    fetchCustomers();
  };

  const filtered = customers.filter((c) => {
    const q = normalize(search);
    const matchSearch = normalize(c.name).includes(q) || c.phone.includes(search);
    const matchSegment = segmentFilter === "all" || c.segment === segmentFilter;
    return matchSearch && matchSegment;
  });

  const PAGE_SIZE = 20;
  const { page, totalPages, paginated: paginatedCustomers, next, prev, goTo, total: filteredTotal } = usePagination(filtered, PAGE_SIZE);

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const totalOrders = customers.reduce((s, c) => s + c.totalOrders, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  if (loading) {
    return (
      <DashboardLayout title="Clients">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  // ── CSV import handler ──────────────────────────────────────────────────────
  const handleCsvImport = async (file: File) => {
    if (!storeId) return;
    setImporting(true);
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      toast({ title: "Fichier vide ou invalide", variant: "destructive" });
      setImporting(false);
      return;
    }

    // Detect delimiter (comma or semicolon)
    const delim = lines[0].includes(";") ? ";" : ",";
    const headers = lines[0].split(delim).map((h) => h.trim().toLowerCase().replace(/[^a-z0-9éèêëàâîïôùûü]/g, ""));

    const findCol = (...keys: string[]) => headers.findIndex((h) => keys.some((k) => h.includes(k)));
    const colName  = findCol("nom", "name", "prenom");
    const colPhone = findCol("tel", "phone", "mobile");
    const colEmail = findCol("email", "mail");
    const colAddr  = findCol("adresse", "address", "ville");

    const rows = lines.slice(1).map((l) => l.split(delim).map((v) => v.trim().replace(/^"|"$/g, "")));
    const customers = rows
      .filter((r) => r.length > 1)
      .map((r) => ({
        store_id: storeId,
        name:    colName  >= 0 ? r[colName]  || "Sans nom" : "Sans nom",
        phone:   colPhone >= 0 ? r[colPhone] || null        : null,
        email:   colEmail >= 0 ? r[colEmail] || null        : null,
        address: colAddr  >= 0 ? r[colAddr]  || null        : null,
        source:  "import_csv",
        segment: "new",
      }))
      .filter((c) => c.name !== "Sans nom" || c.phone);

    if (customers.length === 0) {
      toast({ title: "Aucun client valide trouvé dans le fichier", variant: "destructive" });
      setImporting(false);
      return;
    }

    // Upsert by phone to avoid duplicates (ignore conflicts)
    const { error } = await supabase.from("customers").upsert(customers, {
      onConflict: "store_id,phone",
      ignoreDuplicates: true,
    } as any);

    setImporting(false);
    setImportOpen(false);
    if (error) {
      toast({ title: "Erreur import", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${customers.length} client(s) importé(s) avec succès` });
      fetchCustomers();
    }
  };

  return (
    <>
    <NewCustomerDialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen} onSubmit={handleNewCustomer} />

      {/* ── CSV Import Dialog ──────────────────────────────────────── */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importer des clients (CSV)</DialogTitle>
            <DialogDescription>
              Le fichier doit contenir au moins une colonne <strong>nom</strong> et/ou <strong>téléphone</strong>.
              Les colonnes reconnues : <code>nom</code>, <code>téléphone</code>, <code>email</code>, <code>adresse</code>.
              Séparateur virgule ou point-virgule. Les doublons (même téléphone) sont ignorés.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="csv-file">Fichier CSV</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              disabled={importing}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleCsvImport(f);
              }}
            />
          </div>
          <DialogFooter>
            {importing && <span className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={14} className="animate-spin" /> Importation…</span>}
            <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importing}>Annuler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    <CustomerDetailDialog
      customer={selectedCustomer}
      open={!!selectedCustomer}
      onOpenChange={(v) => { if (!v) setSelectedCustomer(null); }}
      onEdit={(c) => setEditingCustomer(c)}
      onDelete={(c) => setDeletingCustomer(c)}
    />
    {editingCustomer && (
      <EditCustomerDialog
        open={!!editingCustomer}
        onOpenChange={(v) => { if (!v) setEditingCustomer(null); }}
        onSubmit={handleEditCustomer}
        defaultValues={{ name: editingCustomer.name, phone: editingCustomer.phone, email: editingCustomer.email, segment: editingCustomer.segment as "new" | "regular" | "vip" | "inactive" }}
      />
    )}
    <AlertDialog open={!!deletingCustomer} onOpenChange={(v) => { if (!v) setDeletingCustomer(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer {deletingCustomer?.name} ?</AlertDialogTitle>
          <AlertDialogDescription>Ce client sera définitivement supprimé.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <DashboardLayout
      title="Clients"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            data={customers.map((c) => ({
              name: c.name,
              phone: c.phone,
              email: c.email,
              segment: c.segment,
              total_orders: c.totalOrders,
              total_spent: c.totalSpent,
              last_order: c.lastOrder ? new Date(c.lastOrder).toLocaleDateString("fr-FR") : "",
              join_date: c.joinDate ? new Date(c.joinDate).toLocaleDateString("fr-FR") : "",
              loyalty_points: c.loyaltyPoints,
            }))}
            columns={[
              { key: "name", label: "Nom" },
              { key: "phone", label: "Téléphone" },
              { key: "email", label: "Email" },
              { key: "segment", label: "Segment" },
              { key: "total_orders", label: "Commandes" },
              { key: "total_spent", label: "Total dépensé (FCFA)" },
              { key: "last_order", label: "Dernière commande" },
              { key: "join_date", label: "Inscription" },
              { key: "loyalty_points", label: "Points fidélité" },
            ]}
            filename="clients"
            printTitle="Clients Intramate"
          />
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
            <Upload size={16} /> Importer CSV
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setNewCustomerOpen(true)}><UserPlus size={16} /> Ajouter un client</Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Clients total", value: customers.length, icon: Users },
          { label: "Clients VIP", value: customers.filter((c) => c.segment === "vip").length, icon: Star },
          { label: "Panier moyen", value: `${avgOrderValue.toLocaleString("fr-FR")} F`, icon: TrendingUp },
          { label: "Nouveaux (ce mois)", value: customers.filter((c) => c.segment === "new").length, icon: UserPlus },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={14} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-xl font-bold font-[Space_Grotesk] text-card-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par nom ou téléphone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={segmentFilter} onValueChange={setSegmentFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Segment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="regular">Régulier</SelectItem>
            <SelectItem value="new">Nouveau</SelectItem>
            <SelectItem value="inactive">Inactif</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p>Aucun client trouvé</p>
          <p className="text-sm">Ajoutez votre premier client pour commencer.</p>
        </div>
      ) : (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Total dépensé</TableHead>
                  <TableHead>Points fidélité</TableHead>
                  <TableHead>Dernière commande</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.map((customer) => {
                  const seg = segmentConfig[customer.segment] || segmentConfig.standard;
                  const initials = customer.name.split(" ").map((n) => n[0]).join("");
                  return (
                    <TableRow key={customer.id} className="cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback></Avatar>
                          <div>
                            <p className="font-medium text-sm">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">{customer.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={seg.variant} className="text-xs">{seg.label}</Badge></TableCell>
                      <TableCell className="font-medium">{customer.totalOrders}</TableCell>
                      <TableCell className="font-medium">{customer.totalSpent.toLocaleString("fr-FR")} F</TableCell>
                      <TableCell><span className="text-xs text-accent font-medium">{customer.loyaltyPoints} pts</span></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(customer.lastOrder).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <DataPagination page={page} totalPages={totalPages} total={filteredTotal} pageSize={PAGE_SIZE} onPrev={prev} onNext={next} onGoTo={goTo} />
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
    </>
  );
};

export default Customers;
