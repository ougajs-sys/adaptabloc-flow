import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Tags, Pencil, Trash2, Loader2, GripVertical } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CustomStatus {
  id: string;
  name: string;
  color: string;
  description: string | null;
  sort_order: number;
}

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#64748b", "#71717a",
];

const SUGGESTED_STATUSES = [
  { name: "À récupérer en boutique", color: "#06b6d4", description: "Le client passe chercher en magasin" },
  { name: "En attente de paiement", color: "#f97316", description: "Paiement Mobile Money non confirmé" },
  { name: "Retour client", color: "#f43f5e", description: "Article retourné par le client" },
  { name: "Réservée", color: "#8b5cf6", description: "Mise de côté pour le client" },
];

const CustomStatuses = () => {
  const { user } = useAuth();
  const storeId = user?.store_id;

  const [statuses, setStatuses] = useState<CustomStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomStatus | null>(null);
  const [deleting, setDeleting] = useState<CustomStatus | null>(null);

  const [form, setForm] = useState({
    name: "",
    color: PRESET_COLORS[0],
    description: "",
  });

  const fetchStatuses = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("order_statuses" as never)
      .select("*")
      .eq("store_id" as never, storeId as never)
      .order("sort_order", { ascending: true });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    setStatuses((data as unknown as CustomStatus[]) || []);
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", color: PRESET_COLORS[0], description: "" });
    setDialogOpen(true);
  };

  const openEdit = (s: CustomStatus) => {
    setEditing(s);
    setForm({ name: s.name, color: s.color, description: s.description ?? "" });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!storeId || !form.name.trim()) return;

    if (editing) {
      const { error } = await supabase
        .from("order_statuses" as never)
        .update({
          name: form.name,
          color: form.color,
          description: form.description || null,
        } as never)
        .eq("id" as never, editing.id as never);
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Statut modifié" });
    } else {
      const { error } = await supabase.from("order_statuses" as never).insert({
        store_id: storeId,
        name: form.name,
        color: form.color,
        description: form.description || null,
        sort_order: statuses.length,
      } as never);
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Statut créé" });
    }

    setDialogOpen(false);
    fetchStatuses();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase
      .from("order_statuses" as never)
      .delete()
      .eq("id" as never, deleting.id as never);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Statut supprimé" });
    }
    setDeleting(null);
    fetchStatuses();
  };

  const useSuggestion = async (s: typeof SUGGESTED_STATUSES[number]) => {
    if (!storeId) return;
    const { error } = await supabase.from("order_statuses" as never).insert({
      store_id: storeId,
      name: s.name,
      color: s.color,
      description: s.description,
      sort_order: statuses.length,
    } as never);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Statut ajouté" });
      fetchStatuses();
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Statuts personnalisés">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Statuts personnalisés"
      actions={
        <Button size="sm" onClick={openNew} className="gap-2">
          <Plus size={16} /> Nouveau statut
        </Button>
      }
    >
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="text-sm text-foreground">
          <Tags className="inline mr-2" size={14} />
          Les statuts personnalisés s'ajoutent en plus des statuts standard (Nouvelle, Confirmée, Préparation, Livraison...)
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Vous pouvez les utiliser comme étiquettes secondaires sur vos commandes.
        </p>
      </div>

      {statuses.length === 0 && (
        <div className="space-y-3">
          <div className="text-center py-10 text-muted-foreground border border-dashed border-border/60 rounded-xl">
            <Tags size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun statut personnalisé</p>
            <p className="text-sm mt-1">Choisissez un modèle ci-dessous ou créez-en un sur mesure.</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
              Suggestions populaires
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_STATUSES.map((s) => (
                <button
                  key={s.name}
                  onClick={() => useSuggestion(s)}
                  className="text-left rounded-lg border border-border/60 hover:border-primary/40 hover:bg-primary/5 p-3 transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="font-semibold text-sm">{s.name}</span>
                    <Plus size={12} className="ml-auto text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {statuses.length > 0 && (
        <div className="space-y-2">
          {statuses.map((s) => (
            <Card key={s.id} className="border-border/60">
              <CardContent className="p-3 flex items-center gap-3">
                <GripVertical className="text-muted-foreground/40" size={16} />
                <div
                  className="w-4 h-4 rounded-full ring-2 ring-offset-2 ring-offset-card shrink-0"
                  style={{ backgroundColor: s.color, boxShadow: `0 0 0 1px ${s.color}40` }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{s.name}</p>
                  {s.description && (
                    <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={() => openEdit(s)} className="h-8 px-2">
                  <Pencil size={12} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleting(s)}
                  className="h-8 px-2 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={12} />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le statut" : "Nouveau statut"}</DialogTitle>
            <DialogDescription>
              Créez une étiquette personnalisée pour vos commandes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="s-name">Nom du statut</Label>
              <Input
                id="s-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: À récupérer en boutique"
              />
            </div>

            <div>
              <Label htmlFor="s-desc">Description (optionnel)</Label>
              <Input
                id="s-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex: Le client vient chercher la commande au magasin"
              />
            </div>

            <div>
              <Label>Couleur</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-full transition-all ${
                      form.color === c
                        ? "ring-2 ring-offset-2 ring-foreground scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground mb-1">Aperçu :</p>
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: `${form.color}20`,
                  color: form.color,
                  border: `1px solid ${form.color}40`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: form.color }} />
                {form.name || "Aperçu"}
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
            <AlertDialogDescription>Les commandes utilisant ce statut le perdront.</AlertDialogDescription>
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

export default CustomStatuses;
