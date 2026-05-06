import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/contexts/ModulesContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Warehouse, Lock, MapPin } from "lucide-react";

interface WarehousePost {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export default function WarehousePosts() {
  const { user } = useAuth();
  const storeId = user?.store_id;
  const { hasModule, isLoading: modulesLoading } = useModules();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Partial<WarehousePost> | null>(null);

  const moduleEnabled = hasModule("warehouse_team");

  const { data: posts = [], isLoading } = useQuery<WarehousePost[]>({
    queryKey: ["warehouse-posts", storeId],
    enabled: !!storeId && moduleEnabled,
    queryFn: async () => {
      const { data, error } = await (supabase.from("warehouse_posts" as any) as any)
        .select("*")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as WarehousePost[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (p: Partial<WarehousePost>) => {
      const payload = {
        store_id: storeId,
        name: p.name!,
        description: p.description || null,
        is_active: p.is_active ?? true,
      };
      const q = p.id
        ? (supabase.from("warehouse_posts" as any) as any).update(payload).eq("id", p.id)
        : (supabase.from("warehouse_posts" as any) as any).insert(payload);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-posts", storeId] });
      setEditing(null);
      toast({ title: "Poste enregistré" });
    },
    onError: (err: any) =>
      toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("warehouse_posts" as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-posts", storeId] });
      toast({ title: "Poste supprimé" });
    },
  });

  if (modulesLoading) {
    return (
      <DashboardLayout title="Postes entrepôt">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </DashboardLayout>
    );
  }

  if (!moduleEnabled) {
    return (
      <DashboardLayout title="Postes entrepôt" subtitle="Module Équipe entrepôt">
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Lock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold mb-1">Module non activé</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Activez le module <span className="font-medium">Équipe entrepôt</span> pour gérer vos postes et obtenir des préparateurs illimités.
            </p>
            <Button onClick={() => navigate("/dashboard/modules")}>Voir les modules</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const activePosts = posts.filter((p) => p.is_active);

  return (
    <DashboardLayout title="Postes entrepôt" subtitle="Gérez les stations de préparation de votre entrepôt">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {activePosts.length} poste{activePosts.length > 1 ? "s" : ""} actif{activePosts.length > 1 ? "s" : ""}
            {posts.length > activePosts.length && (
              <span className="ml-1 text-muted-foreground/60">
                · {posts.length - activePosts.length} inactif{posts.length - activePosts.length > 1 ? "s" : ""}
              </span>
            )}
          </p>
          <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setEditing({ is_active: true, name: "", description: "" })}
              >
                <Plus className="mr-2 h-4 w-4" /> Nouveau poste
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editing?.id ? "Modifier" : "Nouveau"} poste</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Nom du poste</Label>
                  <Input
                    value={editing?.name || ""}
                    onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))}
                    placeholder="ex: Station A, Emballage 1, Contrôle qualité..."
                  />
                </div>
                <div>
                  <Label>Description (optionnel)</Label>
                  <Textarea
                    value={editing?.description || ""}
                    onChange={(e) => setEditing((s) => ({ ...s, description: e.target.value }))}
                    placeholder="Zone dédiée aux commandes lourdes..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editing?.is_active ?? true}
                    onCheckedChange={(v) => setEditing((s) => ({ ...s, is_active: v }))}
                  />
                  <Label className="font-normal">Poste actif</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
                <Button
                  onClick={() => editing && upsert.mutate(editing)}
                  disabled={!editing?.name || upsert.isPending}
                >
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : posts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Warehouse className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground mb-3">
                Aucun poste défini. Créez des stations pour que vos préparateurs puissent s'y assigner.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {posts.map((p) => (
              <Card key={p.id} className={!p.is_active ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        p.is_active ? "bg-amber-500/10" : "bg-muted"
                      }`}>
                        <MapPin size={16} className={p.is_active ? "text-amber-500" : "text-muted-foreground"} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm leading-none truncate">{p.name}</p>
                        {!p.is_active && (
                          <Badge variant="secondary" className="text-[10px] mt-1">Inactif</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => setEditing(p)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => { if (confirm(`Supprimer "${p.name}" ?`)) remove.mutate(p.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
