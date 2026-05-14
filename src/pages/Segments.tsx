import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Users,
  Trash2,
  Pencil,
  Loader2,
  X,
  Filter,
  TrendingUp,
  MapPin,
  Calendar,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type FilterType =
  | "city"
  | "min_orders"
  | "min_spent"
  | "last_order_within_days"
  | "inactive_for_days";

interface SegmentFilter {
  type: FilterType;
  value: string | number;
}

interface Segment {
  id: string;
  name: string;
  description: string | null;
  filters: { items: SegmentFilter[] };
  customer_count: number;
  color: string;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  shipping_city?: string | null;
  total_orders?: number;
  total_spent?: number;
  last_order_at?: string | null;
}

const FILTER_TYPES: { type: FilterType; label: string; icon: typeof Filter; placeholder: string }[] = [
  { type: "city", label: "Ville", icon: MapPin, placeholder: "Ex: Abidjan" },
  { type: "min_orders", label: "Commandes minimum", icon: TrendingUp, placeholder: "Ex: 3" },
  { type: "min_spent", label: "Dépense totale ≥ (FCFA)", icon: TrendingUp, placeholder: "Ex: 50000" },
  { type: "last_order_within_days", label: "Commande il y a moins de X jours", icon: Calendar, placeholder: "Ex: 30" },
  { type: "inactive_for_days", label: "Inactif depuis X jours", icon: Calendar, placeholder: "Ex: 60" },
];

const PRESET_COLORS = ["#6366f1", "#22c55e", "#f97316", "#ec4899", "#06b6d4", "#8b5cf6"];

const PRESETS: { name: string; description: string; color: string; filters: SegmentFilter[] }[] = [
  {
    name: "VIP",
    description: "Clients ayant dépensé plus de 100 000 F",
    color: "#8b5cf6",
    filters: [{ type: "min_spent", value: 100000 }],
  },
  {
    name: "Fidèles",
    description: "3 commandes ou plus",
    color: "#22c55e",
    filters: [{ type: "min_orders", value: 3 }],
  },
  {
    name: "Inactifs",
    description: "Aucune commande depuis 60 jours",
    color: "#f97316",
    filters: [{ type: "inactive_for_days", value: 60 }],
  },
];

function applyFilters(customers: Customer[], filters: SegmentFilter[]): Customer[] {
  if (filters.length === 0) return customers;
  const now = Date.now();
  return customers.filter((c) =>
    filters.every((f) => {
      if (f.type === "city") {
        return c.shipping_city?.toLowerCase().includes(String(f.value).toLowerCase());
      }
      if (f.type === "min_orders") {
        return (c.total_orders ?? 0) >= Number(f.value);
      }
      if (f.type === "min_spent") {
        return (c.total_spent ?? 0) >= Number(f.value);
      }
      if (f.type === "last_order_within_days") {
        if (!c.last_order_at) return false;
        const days = (now - new Date(c.last_order_at).getTime()) / 86400000;
        return days <= Number(f.value);
      }
      if (f.type === "inactive_for_days") {
        if (!c.last_order_at) return true;
        const days = (now - new Date(c.last_order_at).getTime()) / 86400000;
        return days >= Number(f.value);
      }
      return true;
    })
  );
}

const Segments = () => {
  const { user } = useAuth();
  const storeId = user?.store_id;

  const [segments, setSegments] = useState<Segment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Segment | null>(null);
  const [deleting, setDeleting] = useState<Segment | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    color: PRESET_COLORS[0],
    filters: [] as SegmentFilter[],
  });

  const fetchData = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);

    // Customers + their order stats
    const [{ data: cust }, { data: orders }] = await Promise.all([
      supabase
        .from("customers")
        .select("id, name, shipping_city")
        .eq("store_id", storeId),
      supabase
        .from("orders")
        .select("customer_id, total_amount, created_at, status")
        .eq("store_id", storeId)
        .not("status", "in", '("cancelled","returned")'),
    ]);

    const statMap = new Map<string, { total_orders: number; total_spent: number; last_order_at: string }>();
    (orders || []).forEach((o: { customer_id?: string | null; total_amount?: number; created_at?: string; status?: string }) => {
      if (!o.customer_id) return;
      const cur = statMap.get(o.customer_id) || { total_orders: 0, total_spent: 0, last_order_at: "" };
      cur.total_orders++;
      cur.total_spent += o.total_amount ?? 0;
      if (!cur.last_order_at || (o.created_at ?? "") > cur.last_order_at) {
        cur.last_order_at = o.created_at ?? "";
      }
      statMap.set(o.customer_id, cur);
    });

    const enrichedCustomers: Customer[] = (cust || []).map((c) => ({
      id: c.id,
      name: c.name,
      shipping_city: c.shipping_city ?? null,
      ...(statMap.get(c.id) || { total_orders: 0, total_spent: 0, last_order_at: null }),
    }));

    const { data: segs } = await supabase
      .from("customer_segments" as never)
      .select("*")
      .eq("store_id" as never, storeId as never)
      .order("created_at", { ascending: false });

    setCustomers(enrichedCustomers);
    setSegments((segs as unknown as Segment[]) || []);
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const previewCount = applyFilters(customers, form.filters).length;

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", description: "", color: PRESET_COLORS[0], filters: [] });
    setDialogOpen(true);
  };

  const openEdit = (s: Segment) => {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description ?? "",
      color: s.color,
      filters: s.filters?.items ?? [],
    });
    setDialogOpen(true);
  };

  const usePreset = (p: typeof PRESETS[number]) => {
    setEditing(null);
    setForm({
      name: p.name,
      description: p.description,
      color: p.color,
      filters: p.filters,
    });
    setDialogOpen(true);
  };

  const addFilter = (type: FilterType) => {
    setForm((prev) => ({
      ...prev,
      filters: [...prev.filters, { type, value: type === "city" ? "" : 0 }],
    }));
  };

  const updateFilter = (i: number, value: string | number) => {
    setForm((prev) => {
      const filters = [...prev.filters];
      filters[i] = { ...filters[i], value };
      return { ...prev, filters };
    });
  };

  const removeFilter = (i: number) => {
    setForm((prev) => ({ ...prev, filters: prev.filters.filter((_, idx) => idx !== i) }));
  };

  const handleSubmit = async () => {
    if (!storeId || !form.name.trim()) return;

    const payload = {
      name: form.name,
      description: form.description || null,
      color: form.color,
      filters: { items: form.filters },
      customer_count: previewCount,
    };

    if (editing) {
      const { error } = await supabase
        .from("customer_segments" as never)
        .update(payload as never)
        .eq("id" as never, editing.id as never);
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Segment modifié" });
    } else {
      const { error } = await supabase.from("customer_segments" as never).insert({
        ...payload,
        store_id: storeId,
        created_by: user?.id ?? null,
      } as never);
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Segment créé" });
    }

    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase
      .from("customer_segments" as never)
      .delete()
      .eq("id" as never, deleting.id as never);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Segment supprimé" });
    }
    setDeleting(null);
    fetchData();
  };

  if (loading) {
    return (
      <DashboardLayout title="Segments clients">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Segments clients"
      actions={
        <Button size="sm" onClick={openNew} className="gap-2">
          <Plus size={16} /> Nouveau segment
        </Button>
      }
    >
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="text-sm text-foreground">
          <Users className="inline mr-2" size={14} />
          Créez des segments pour cibler vos campagnes SMS / WhatsApp / Email avec précision.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Filtres combinables : ville, nombre de commandes, dépense totale, fraîcheur d'achat.
        </p>
      </div>

      {/* Presets / Empty state */}
      {segments.length === 0 && (
        <div className="space-y-3">
          <div className="text-center py-10 border border-dashed border-border/60 rounded-xl">
            <Users size={48} className="mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="font-medium">Aucun segment</p>
            <p className="text-sm text-muted-foreground mt-1">Démarrez avec un modèle :</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => usePreset(p)}
                className="text-left rounded-lg border border-border/60 hover:border-primary/40 hover:bg-primary/5 p-3 transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="font-semibold text-sm">{p.name}</span>
                  <Plus size={12} className="ml-auto text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">{p.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {segments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((s) => {
            const liveCount = applyFilters(customers, s.filters?.items ?? []).length;
            return (
              <Card key={s.id} className="border-border/60 hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <h3 className="font-semibold text-card-foreground truncate">{s.name}</h3>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {liveCount} client{liveCount > 1 ? "s" : ""}
                    </Badge>
                  </div>
                  {s.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {(s.filters?.items ?? []).slice(0, 3).map((f, i) => {
                      const cfg = FILTER_TYPES.find((t) => t.type === f.type);
                      return (
                        <span
                          key={i}
                          className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5"
                        >
                          {cfg?.label}: {f.value}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex gap-1.5 pt-2 border-t border-border/40">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(s)}
                      className="flex-1 h-8 text-xs gap-1.5"
                    >
                      <Pencil size={11} /> Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleting(s)}
                      className="h-8 px-2 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 size={11} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le segment" : "Nouveau segment"}</DialogTitle>
            <DialogDescription>
              Combinez plusieurs filtres pour cibler un groupe précis de clients.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nom du segment</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Clients VIP Abidjan"
                />
              </div>
              <div>
                <Label>Couleur</Label>
                <div className="flex gap-1.5 mt-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-7 h-7 rounded-full transition-all ${
                        form.color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optionnel"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Filtres ({form.filters.length})</Label>
                <Select onValueChange={(v) => addFilter(v as FilterType)}>
                  <SelectTrigger className="w-[200px] h-8 text-xs">
                    <SelectValue placeholder="+ Ajouter un filtre" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_TYPES.map((f) => (
                      <SelectItem key={f.type} value={f.type}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.filters.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                  Sans filtre, le segment contient tous les clients
                </div>
              ) : (
                <div className="space-y-2">
                  {form.filters.map((f, i) => {
                    const cfg = FILTER_TYPES.find((t) => t.type === f.type);
                    if (!cfg) return null;
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 p-2"
                      >
                        <Icon size={14} className="text-primary shrink-0" />
                        <span className="text-xs font-medium flex-1">{cfg.label}</span>
                        <Input
                          value={f.value}
                          onChange={(e) =>
                            updateFilter(
                              i,
                              f.type === "city" ? e.target.value : parseInt(e.target.value) || 0
                            )
                          }
                          placeholder={cfg.placeholder}
                          className="h-7 text-xs w-32"
                          type={f.type === "city" ? "text" : "number"}
                        />
                        <button
                          type="button"
                          onClick={() => removeFilter(i)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Aperçu :</span>
              <span className="text-lg font-bold text-primary font-[Space_Grotesk]">
                {previewCount} client{previewCount > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim()}>
              {editing ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer "{deleting?.name}" ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Segments;
