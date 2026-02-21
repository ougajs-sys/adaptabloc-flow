import { useState } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, UserPlus, Star, Users, TrendingUp } from "lucide-react";
import { NewCustomerDialog, type NewCustomerFormValues } from "@/components/customers/NewCustomerDialog";
import { EditCustomerDialog, type EditCustomerFormValues } from "@/components/customers/EditCustomerDialog";
import { CustomerDetailDialog } from "@/components/customers/CustomerDetailDialog";
import { toast } from "@/hooks/use-toast";

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

const mockCustomers: Customer[] = [
  { id: "CLI-001", name: "Aminata Diallo", phone: "+225 07 12 34 56", email: "aminata@mail.com", segment: "vip", totalOrders: 24, totalSpent: 892000, lastOrder: "2026-02-13", loyaltyPoints: 890, joinDate: "2025-06-15" },
  { id: "CLI-002", name: "Moussa Koné", phone: "+225 05 98 76 54", email: "moussa.k@mail.com", segment: "regular", totalOrders: 8, totalSpent: 215000, lastOrder: "2026-02-13", loyaltyPoints: 210, joinDate: "2025-09-20" },
  { id: "CLI-003", name: "Fatou Sow", phone: "+225 01 23 45 67", email: "fatou.s@mail.com", segment: "vip", totalOrders: 18, totalSpent: 645000, lastOrder: "2026-02-13", loyaltyPoints: 640, joinDate: "2025-07-01" },
  { id: "CLI-004", name: "Ibrahim Traoré", phone: "+225 07 65 43 21", email: "ibrahim.t@mail.com", segment: "new", totalOrders: 2, totalSpent: 43000, lastOrder: "2026-02-12", loyaltyPoints: 40, joinDate: "2026-01-28" },
  { id: "CLI-005", name: "Aïcha Bamba", phone: "+225 05 11 22 33", email: "aicha.b@mail.com", segment: "regular", totalOrders: 11, totalSpent: 378000, lastOrder: "2026-02-12", loyaltyPoints: 375, joinDate: "2025-08-10" },
  { id: "CLI-006", name: "Oumar Cissé", phone: "+225 01 44 55 66", email: "oumar.c@mail.com", segment: "inactive", totalOrders: 5, totalSpent: 125000, lastOrder: "2025-12-15", loyaltyPoints: 120, joinDate: "2025-05-22" },
  { id: "CLI-007", name: "Mariam Touré", phone: "+225 07 77 88 99", email: "mariam.t@mail.com", segment: "new", totalOrders: 1, totalSpent: 32000, lastOrder: "2026-02-11", loyaltyPoints: 30, joinDate: "2026-02-10" },
  { id: "CLI-008", name: "Sékou Diarra", phone: "+225 05 00 11 22", email: "sekou.d@mail.com", segment: "regular", totalOrders: 6, totalSpent: 198000, lastOrder: "2026-02-11", loyaltyPoints: 195, joinDate: "2025-10-05" },
  { id: "CLI-009", name: "Kadiatou Sylla", phone: "+225 01 88 99 00", email: "kadiatou.s@mail.com", segment: "vip", totalOrders: 32, totalSpent: 1240000, lastOrder: "2026-02-10", loyaltyPoints: 1240, joinDate: "2025-04-12" },
  { id: "CLI-010", name: "Bakary Sanogo", phone: "+225 07 33 22 11", email: "bakary.s@mail.com", segment: "inactive", totalOrders: 3, totalSpent: 67000, lastOrder: "2025-11-20", loyaltyPoints: 65, joinDate: "2025-07-30" },
];

const segmentConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  vip: { label: "VIP", variant: "default" },
  regular: { label: "Régulier", variant: "secondary" },
  new: { label: "Nouveau", variant: "outline" },
  inactive: { label: "Inactif", variant: "destructive" },
};

let customerCounter = mockCustomers.length + 1;

const Customers = () => {
  const [customers, setCustomers] = useState(mockCustomers);
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  const handleNewCustomer = (values: NewCustomerFormValues) => {
    const id = `CLI-${String(customerCounter++).padStart(3, "0")}`;
    setCustomers((prev) => [{
      id, name: values.name, phone: values.phone, email: values.email || "",
      segment: values.segment, totalOrders: 0, totalSpent: 0,
      lastOrder: new Date().toISOString().split("T")[0], loyaltyPoints: 0,
      joinDate: new Date().toISOString().split("T")[0],
    }, ...prev]);
  };

  const handleEditCustomer = (values: EditCustomerFormValues) => {
    if (!editingCustomer) return;
    setCustomers((prev) => prev.map((c) => c.id === editingCustomer.id ? {
      ...c, name: values.name, phone: values.phone, email: values.email, segment: values.segment,
    } : c));
    toast({ title: "Client modifié" });
  };

  const handleDeleteCustomer = () => {
    if (!deletingCustomer) return;
    setCustomers((prev) => prev.filter((c) => c.id !== deletingCustomer.id));
    setDeletingCustomer(null);
    toast({ title: "Client supprimé" });
  };

  const filtered = customers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchSegment = segmentFilter === "all" || c.segment === segmentFilter;
    return matchSearch && matchSegment;
  });

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const totalOrders = customers.reduce((s, c) => s + c.totalOrders, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return (
    <>
    <NewCustomerDialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen} onSubmit={handleNewCustomer} />
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
      actions={<Button size="sm" className="gap-2" onClick={() => setNewCustomerOpen(true)}><UserPlus size={16} /> Ajouter un client</Button>}
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
              {filtered.map((customer) => {
                const seg = segmentConfig[customer.segment];
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
        </CardContent>
      </Card>
    </DashboardLayout>
    </>
  );
};

export default Customers;
