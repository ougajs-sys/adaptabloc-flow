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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/contexts/ModulesContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, FileText, Star, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CallScript {
  id: string;
  store_id: string;
  title: string;
  content: string;
  language: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

const STARTER_TEMPLATE = `Bonjour {nom_client},

Je vous appelle de la part de {boutique} concernant votre commande #{numero_commande}.

1. Confirmer l'identité du client.
2. Lire la liste des articles (qté + prix unitaire) :
   {liste_articles}
3. Confirmer le total : {total} F.
4. Confirmer l'adresse de livraison : {adresse}.
5. Confirmer la date/horaire de livraison souhaité.
6. Si paiement à la livraison : prévenir d'avoir le montant exact.

Merci pour votre commande !`;

export default function CallScripts() {
  const { user } = useAuth();
  const storeId = user?.store_id;
  const { hasModule, isLoading: modulesLoading } = useModules();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Partial<CallScript> | null>(null);

  const moduleEnabled = hasModule("call_center");

  const { data: scripts = [], isLoading } = useQuery({
    queryKey: ["call-scripts", storeId],
    enabled: !!storeId && moduleEnabled,
    queryFn: async () => {
      const { data, error } = await (supabase.from("call_scripts" as any) as any)
        .select("*")
        .eq("store_id", storeId!)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as CallScript[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (s: Partial<CallScript>) => {
      const payload = {
        store_id: storeId,
        title: s.title!,
        content: s.content!,
        language: s.language || "fr",
        is_default: s.is_default ?? false,
        is_active: s.is_active ?? true,
        created_by: user?.id,
      };
      // Only one default at a time → clear others first
      if (payload.is_default) {
        await (supabase.from("call_scripts" as any) as any)
          .update({ is_default: false })
          .eq("store_id", storeId!)
          .neq("id", s.id ?? "00000000-0000-0000-0000-000000000000");
      }
      const q = s.id
        ? (supabase.from("call_scripts" as any) as any).update(payload).eq("id", s.id)
        : (supabase.from("call_scripts" as any) as any).insert(payload);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call-scripts", storeId] });
      setEditing(null);
      toast({ title: "Script enregistré" });
    },
    onError: (err: any) =>
      toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("call_scripts" as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call-scripts", storeId] });
      toast({ title: "Script supprimé" });
    },
  });

  if (modulesLoading) {
    return (
      <DashboardLayout title="Scripts d'appel">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </DashboardLayout>
    );
  }

  if (!moduleEnabled) {
    return (
      <DashboardLayout title="Scripts d'appel" subtitle="Module Centre d'appels">
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Lock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold mb-1">Module non activé</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Activez le module <span className="font-medium">Centre d'appels</span> pour gérer vos
              scripts et obtenir des callers illimités.
            </p>
            <Button onClick={() => navigate("/dashboard/modules")}>Voir les modules</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Scripts d'appel" subtitle="Préparez vos callers à confirmer plus de commandes">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {scripts.length} script{scripts.length > 1 ? "s" : ""} disponible{scripts.length > 1 ? "s" : ""}
          </p>
          <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
            <DialogTrigger asChild>
              <Button
                onClick={() =>
                  setEditing({
                    is_active: true,
                    is_default: scripts.length === 0,
                    language: "fr",
                    content: STARTER_TEMPLATE,
                    title: "",
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Nouveau script
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing?.id ? "Modifier" : "Nouveau"} script d'appel</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Titre</Label>
                  <Input
                    value={editing?.title || ""}
                    onChange={(e) =>
                      setEditing((s) => ({ ...s, title: e.target.value }))
                    }
                    placeholder="ex: Confirmation standard"
                  />
                </div>
                <div>
                  <Label>Contenu</Label>
                  <Textarea
                    value={editing?.content || ""}
                    onChange={(e) =>
                      setEditing((s) => ({ ...s, content: e.target.value }))
                    }
                    rows={14}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Variables suggérées : <code>{"{nom_client}"}</code>, <code>{"{numero_commande}"}</code>,{" "}
                    <code>{"{liste_articles}"}</code>, <code>{"{total}"}</code>, <code>{"{adresse}"}</code>,{" "}
                    <code>{"{boutique}"}</code>
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editing?.is_default ?? false}
                      onCheckedChange={(v) => setEditing((s) => ({ ...s, is_default: v }))}
                    />
                    <Label className="font-normal">Script par défaut</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editing?.is_active ?? true}
                      onCheckedChange={(v) => setEditing((s) => ({ ...s, is_active: v }))}
                    />
                    <Label className="font-normal">Actif</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Annuler
                </Button>
                <Button
                  onClick={() => editing && upsert.mutate(editing)}
                  disabled={!editing?.title || !editing?.content || upsert.isPending}
                >
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : scripts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground mb-3">
                Aucun script d'appel. Créez-en un pour aider vos callers à confirmer plus de commandes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {scripts.map((s) => (
              <Card key={s.id} className={s.is_default ? "border-primary/40" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {s.title}
                        {s.is_default && (
                          <Badge className="gap-1 text-[10px]">
                            <Star className="h-3 w-3" /> Défaut
                          </Badge>
                        )}
                        {!s.is_active && (
                          <Badge variant="secondary" className="text-[10px]">
                            Inactif
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditing(s)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          if (confirm(`Supprimer "${s.title}" ?`)) remove.mutate(s.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6">
                    {s.content}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
