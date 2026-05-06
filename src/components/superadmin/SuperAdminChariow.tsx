import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, KeyRound, Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import { modulesRegistry } from "@/lib/modules-registry";

interface Mapping {
  id: string;
  bundle_key: string;
  chariow_product_id: string;
  display_name: string | null;
  description: string | null;
  modules: string[];
  amount_xof: number | null;
  is_active: boolean;
}

interface WebhookEvent {
  id: string;
  event_id: string;
  event_type: string;
  signature_valid: boolean;
  processed_at: string | null;
  error: string | null;
  received_at: string;
}

export default function SuperAdminChariow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Partial<Mapping> | null>(null);

  const { data: mappings = [] } = useQuery({
    queryKey: ["chariow-mappings"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("chariow_product_mapping" as any) as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Mapping[];
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["chariow-events"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("chariow_webhook_events" as any) as any)
        .select("id, event_id, event_type, signature_valid, processed_at, error, received_at")
        .order("received_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as WebhookEvent[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (m: Partial<Mapping>) => {
      const payload = {
        bundle_key: m.bundle_key,
        chariow_product_id: m.chariow_product_id,
        display_name: m.display_name || null,
        description: m.description || null,
        modules: m.modules || [],
        amount_xof: m.amount_xof || null,
        is_active: m.is_active ?? true,
      };
      const query = m.id
        ? (supabase.from("chariow_product_mapping" as any) as any).update(payload).eq("id", m.id)
        : (supabase.from("chariow_product_mapping" as any) as any).insert(payload);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chariow-mappings"] });
      setEditing(null);
      toast({ title: "Mapping enregistré" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("chariow_product_mapping" as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chariow-mappings"] });
      toast({ title: "Mapping supprimé" });
    },
  });

  const allModules = modulesRegistry.map((m) => ({ id: m.id, name: m.name }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <KeyRound className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle>Mapping produits Chariow</CardTitle>
                <CardDescription>
                  Associe une combinaison de modules Intramate à un produit (licence) Chariow.
                </CardDescription>
              </div>
            </div>
            <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditing({ is_active: true, modules: [] })}>
                  <Plus className="h-4 w-4 mr-2" /> Ajouter un mapping
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing?.id ? "Modifier" : "Nouveau"} mapping Chariow</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Bundle key (unique)</Label>
                    <Input
                      value={editing?.bundle_key || ""}
                      onChange={(e) => setEditing((s) => ({ ...s, bundle_key: e.target.value }))}
                      placeholder="ex: single:campaigns ou bundle:starter"
                    />
                  </div>
                  <div>
                    <Label>Chariow Product ID</Label>
                    <Input
                      value={editing?.chariow_product_id || ""}
                      onChange={(e) => setEditing((s) => ({ ...s, chariow_product_id: e.target.value }))}
                      placeholder="prod_xxxxx"
                    />
                  </div>
                  <div>
                    <Label>Nom affiché</Label>
                    <Input
                      value={editing?.display_name || ""}
                      onChange={(e) => setEditing((s) => ({ ...s, display_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={editing?.description || ""}
                      onChange={(e) => setEditing((s) => ({ ...s, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Modules débloqués (cochez)</Label>
                    <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto border rounded-md p-2">
                      {allModules.map((m) => {
                        const checked = editing?.modules?.includes(m.id) || false;
                        return (
                          <label key={m.id} className="flex items-center gap-2 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setEditing((s) => {
                                  const cur = s?.modules || [];
                                  return {
                                    ...s,
                                    modules: e.target.checked
                                      ? [...cur, m.id]
                                      : cur.filter((x) => x !== m.id),
                                  };
                                });
                              }}
                            />
                            {m.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label>Prix attendu (XOF, sanity check)</Label>
                    <Input
                      type="number"
                      value={editing?.amount_xof || ""}
                      onChange={(e) => setEditing((s) => ({ ...s, amount_xof: parseInt(e.target.value) || null }))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editing?.is_active ?? true}
                      onCheckedChange={(v) => setEditing((s) => ({ ...s, is_active: v }))}
                    />
                    <Label>Actif</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
                  <Button
                    onClick={() => editing && upsertMutation.mutate(editing)}
                    disabled={!editing?.bundle_key || !editing?.chariow_product_id}
                  >
                    Enregistrer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {mappings.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <KeyRound className="mx-auto mb-2 opacity-30" size={32} />
              <p className="text-sm">Aucun mapping configuré.</p>
              <p className="text-xs mt-1">Ajoutez-en un pour permettre les paiements Chariow.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bundle key</TableHead>
                  <TableHead>Chariow product</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">{m.bundle_key}</TableCell>
                    <TableCell className="font-mono text-xs">{m.chariow_product_id}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(m.modules || []).slice(0, 3).map((mod) => (
                          <Badge key={mod} variant="secondary" className="text-[10px]">{mod}</Badge>
                        ))}
                        {(m.modules?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-[10px]">+{m.modules.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {m.amount_xof ? `${m.amount_xof.toLocaleString("fr-FR")} XOF` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.is_active ? "default" : "secondary"} className="text-xs">
                        {m.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(m)}>Modifier</Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(m.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Activity className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle>Événements webhook récents</CardTitle>
              <CardDescription>Les 20 derniers événements reçus de Chariow.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun événement reçu.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reçu</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Event ID</TableHead>
                  <TableHead>Sig.</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(e.received_at).toLocaleString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{e.event_type}</TableCell>
                    <TableCell className="text-xs font-mono truncate max-w-[180px]">{e.event_id}</TableCell>
                    <TableCell>
                      {e.signature_valid ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      {e.error ? (
                        <Badge variant="destructive" className="text-[10px]" title={e.error}>Erreur</Badge>
                      ) : e.processed_at ? (
                        <Badge variant="default" className="text-[10px]">Traité</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">En attente</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
