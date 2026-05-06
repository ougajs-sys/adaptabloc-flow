import { useState, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/contexts/ModulesContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Lock, Plus, Trash2, Copy, Key, Webhook, FileText,
  Activity, CheckCircle2, XCircle, Loader2, Eye, EyeOff,
  AlertTriangle, RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
}

interface WebhookLog {
  id: string;
  webhook_id: string | null;
  event_type: string;
  status_code: number | null;
  duration_ms: number | null;
  success: boolean;
  error: string | null;
  sent_at: string;
}

// ── Available events ───────────────────────────────────────────────────────────

const WEBHOOK_EVENTS = [
  { value: "order.created",        label: "Commande créée" },
  { value: "order.status_changed", label: "Statut commande changé" },
  { value: "order.confirmed",      label: "Commande confirmée" },
  { value: "order.delivered",      label: "Commande livrée" },
  { value: "order.cancelled",      label: "Commande annulée" },
  { value: "customer.created",     label: "Nouveau client" },
  { value: "product.updated",      label: "Produit mis à jour" },
  { value: "stock.low",            label: "Alerte stock bas" },
];

// ── Crypto helper ─────────────────────────────────────────────────────────────

async function sha256hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function genRandomKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return "IM_" + Array.from(crypto.getRandomValues(new Uint8Array(40)))
    .map((b) => chars[b % chars.length]).join("");
}

function genWebhookSecret(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── API Docs component ─────────────────────────────────────────────────────────

function ApiDocs({ storeId }: { storeId: string }) {
  const baseUrl = `${window.location.origin.replace(/:\d+$/, "")}/api/v1`;
  return (
    <div className="space-y-5 text-sm">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Authentification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-muted-foreground text-xs">
            Incluez votre clé API dans l'en-tête <code className="bg-muted px-1 rounded">Authorization</code> de chaque requête.
          </p>
          <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto">
{`curl -H "Authorization: Bearer IM_yourkey..." \\
     ${baseUrl}/orders`}
          </pre>
        </CardContent>
      </Card>

      {[
        {
          method: "GET", endpoint: "/orders", description: "Lister les commandes",
          params: "?status=confirmed&limit=50&offset=0",
          response: `{ "data": [{ "id": "...", "status": "confirmed", "total": 15000, ... }], "count": 120 }`,
        },
        {
          method: "GET", endpoint: "/orders/:id", description: "Détail d'une commande",
          response: `{ "id": "...", "customer": {...}, "items": [...], "total": 15000, "status": "confirmed" }`,
        },
        {
          method: "PATCH", endpoint: "/orders/:id/status", description: "Changer le statut",
          body: `{ "status": "confirmed" }`,
          response: `{ "success": true }`,
          permission: "write",
        },
        {
          method: "GET", endpoint: "/customers", description: "Lister les clients",
          params: "?limit=50&offset=0",
          response: `{ "data": [{ "id": "...", "name": "...", "phone": "..." }], "count": 80 }`,
        },
        {
          method: "GET", endpoint: "/products", description: "Lister les produits",
          response: `{ "data": [{ "id": "...", "name": "...", "price": 5000, "stock": 12 }] }`,
        },
        {
          method: "POST", endpoint: "/orders", description: "Créer une commande",
          permission: "write",
          body: `{ "customer_id": "...", "items": [{ "product_id": "...", "qty": 2 }] }`,
          response: `{ "id": "...", "status": "new" }`,
        },
      ].map((ep) => (
        <Card key={ep.endpoint + ep.method}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={`text-[11px] font-mono ${ep.method === "GET" ? "bg-blue-500" : ep.method === "POST" ? "bg-emerald-500" : "bg-orange-500"} text-white border-0`}>
                {ep.method}
              </Badge>
              <code className="text-xs font-mono">{baseUrl}{ep.endpoint}</code>
              {ep.permission === "write" && (
                <Badge variant="outline" className="text-[10px]">Permission: write</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{ep.description}</p>
            {ep.params && (
              <pre className="bg-muted rounded p-2 text-xs font-mono mb-2 overflow-x-auto">{`# Paramètres\n${ep.params}`}</pre>
            )}
            {ep.body && (
              <pre className="bg-muted rounded p-2 text-xs font-mono mb-2 overflow-x-auto">{`# Body (JSON)\n${ep.body}`}</pre>
            )}
            <pre className="bg-muted rounded p-2 text-xs font-mono overflow-x-auto">{`# Réponse\n${ep.response}`}</pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ApiManager() {
  const { user } = useAuth();
  const storeId = user?.store_id;
  const { hasModule, isLoading: modulesLoading } = useModules();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPerms, setNewKeyPerms] = useState<string[]>(["read"]);
  const [newKeyExpires, setNewKeyExpires] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const [newWebhookName, setNewWebhookName] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);

  const moduleEnabled = hasModule("api");

  // ── API Keys ──────────────────────────────────────────────────────────────────

  const { data: apiKeys = [], isLoading: keysLoading } = useQuery<ApiKey[]>({
    queryKey: ["api-keys", storeId],
    enabled: !!storeId && moduleEnabled,
    queryFn: async () => {
      const { data, error } = await (supabase.from("api_keys" as any) as any)
        .select("id, name, key_prefix, permissions, is_active, last_used_at, expires_at, created_at")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ApiKey[];
    },
  });

  const createKey = useMutation({
    mutationFn: async () => {
      const raw = genRandomKey();
      const hash = await sha256hex(raw);
      const payload = {
        store_id: storeId,
        name: newKeyName,
        key_hash: hash,
        key_prefix: raw.slice(0, 8),
        permissions: newKeyPerms,
        expires_at: newKeyExpires || null,
        created_by: user?.id,
      };
      const { error } = await (supabase.from("api_keys" as any) as any).insert(payload);
      if (error) throw error;
      return raw;
    },
    onSuccess: (raw) => {
      queryClient.invalidateQueries({ queryKey: ["api-keys", storeId] });
      setGeneratedKey(raw);
      setNewKeyName("");
      setNewKeyPerms(["read"]);
      setNewKeyExpires("");
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const revokeKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("api_keys" as any) as any)
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api-keys", storeId] }),
  });

  const deleteKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("api_keys" as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api-keys", storeId] }),
  });

  // ── Webhooks ─────────────────────────────────────────────────────────────────

  const { data: webhooks = [], isLoading: webhooksLoading } = useQuery<Webhook[]>({
    queryKey: ["webhooks", storeId],
    enabled: !!storeId && moduleEnabled,
    queryFn: async () => {
      const { data, error } = await (supabase.from("webhooks" as any) as any)
        .select("*")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Webhook[];
    },
  });

  const createWebhook = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from("webhooks" as any) as any).insert({
        store_id: storeId,
        name: newWebhookName,
        url: newWebhookUrl,
        secret: genWebhookSecret(),
        events: newWebhookEvents,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", storeId] });
      setWebhookDialogOpen(false);
      setNewWebhookName("");
      setNewWebhookUrl("");
      setNewWebhookEvents([]);
      toast({ title: "Webhook créé" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const toggleWebhook = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase.from("webhooks" as any) as any)
        .update({ is_active: active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["webhooks", storeId] }),
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("webhooks" as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["webhooks", storeId] }),
  });

  // ── Webhook logs ─────────────────────────────────────────────────────────────

  const { data: logs = [], isLoading: logsLoading } = useQuery<WebhookLog[]>({
    queryKey: ["webhook-logs", storeId],
    enabled: !!storeId && moduleEnabled,
    queryFn: async () => {
      const { data, error } = await (supabase.from("webhook_logs" as any) as any)
        .select("id, webhook_id, event_type, status_code, duration_ms, success, error, sent_at")
        .eq("store_id", storeId!)
        .order("sent_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as WebhookLog[];
    },
    refetchInterval: 30_000,
  });

  if (modulesLoading) {
    return <DashboardLayout title="API & Webhooks"><p className="text-sm text-muted-foreground">Chargement...</p></DashboardLayout>;
  }

  if (!moduleEnabled) {
    return (
      <DashboardLayout title="API & Webhooks" subtitle="Module API">
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Lock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold mb-1">Module non activé</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Activez le module <span className="font-medium">API complète</span> pour connecter Intramate à vos outils via REST API et webhooks.
            </p>
            <Button onClick={() => navigate("/dashboard/modules")}>Voir les modules</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="API & Webhooks" subtitle="Connectez Intramate à vos outils externes">
      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys"><Key size={14} className="mr-1" /> Clés API</TabsTrigger>
          <TabsTrigger value="webhooks"><Webhook size={14} className="mr-1" /> Webhooks</TabsTrigger>
          <TabsTrigger value="logs"><Activity size={14} className="mr-1" /> Logs</TabsTrigger>
          <TabsTrigger value="docs"><FileText size={14} className="mr-1" /> Documentation</TabsTrigger>
        </TabsList>

        {/* ── API Keys tab ──────────────────────────────────────────────── */}
        <TabsContent value="keys" className="space-y-4">

          {/* Generated key alert */}
          {generatedKey && (
            <Card className="border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                      Copiez votre clé maintenant — elle ne sera plus affichée
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="flex-1 text-xs font-mono bg-white dark:bg-black/40 px-3 py-2 rounded border border-emerald-300 truncate">
                        {generatedKey}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { navigator.clipboard.writeText(generatedKey); toast({ title: "Clé copiée" }); }}
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setGeneratedKey(null)}>✕</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create key form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Plus size={14} /> Créer une clé API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <Label className="text-xs">Nom</Label>
                  <Input
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="ex: Intégration WooCommerce"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Expire le (optionnel)</Label>
                  <Input
                    type="date"
                    value={newKeyExpires}
                    onChange={(e) => setNewKeyExpires(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Permissions</Label>
                  <div className="flex gap-3 mt-2">
                    {["read", "write"].map((p) => (
                      <label key={p} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <Checkbox
                          checked={newKeyPerms.includes(p)}
                          onCheckedChange={(v) =>
                            setNewKeyPerms((prev) => v ? [...prev, p] : prev.filter((x) => x !== p))
                          }
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => createKey.mutate()}
                disabled={!newKeyName || createKey.isPending}
              >
                {createKey.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : <Key size={14} className="mr-1" />}
                Générer la clé
              </Button>
            </CardContent>
          </Card>

          {/* Keys list */}
          <Card>
            <CardContent className="p-0">
              {keysLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Key className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p className="text-sm">Aucune clé API créée.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Préfixe</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Dernière utilisation</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((k) => (
                      <TableRow key={k.id}>
                        <TableCell className="font-medium text-sm">{k.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{k.key_prefix}••••••••</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {k.permissions.map((p) => (
                              <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {k.last_used_at
                            ? formatDistanceToNow(new Date(k.last_used_at), { addSuffix: true, locale: fr })
                            : "Jamais"}
                        </TableCell>
                        <TableCell>
                          {k.is_active
                            ? <Badge variant="default" className="text-[10px]">Active</Badge>
                            : <Badge variant="secondary" className="text-[10px]">Révoquée</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {k.is_active && (
                              <Button
                                variant="ghost" size="icon" className="h-7 w-7"
                                title="Révoquer"
                                onClick={() => revokeKey.mutate(k.id)}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => { if (confirm("Supprimer cette clé ?")) deleteKey.mutate(k.id); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Webhooks tab ──────────────────────────────────────────────── */}
        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
              <Button size="sm" onClick={() => setWebhookDialogOpen(true)}>
                <Plus className="mr-1 h-4 w-4" /> Nouveau webhook
              </Button>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nouveau webhook</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Nom</Label>
                    <Input value={newWebhookName} onChange={(e) => setNewWebhookName(e.target.value)} placeholder="ex: Notifier mon CRM" className="mt-1" />
                  </div>
                  <div>
                    <Label>URL de destination</Label>
                    <Input value={newWebhookUrl} onChange={(e) => setNewWebhookUrl(e.target.value)} placeholder="https://..." className="mt-1" type="url" />
                  </div>
                  <div>
                    <Label className="mb-2 block">Événements</Label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {WEBHOOK_EVENTS.map((ev) => (
                        <label key={ev.value} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={newWebhookEvents.includes(ev.value)}
                            onCheckedChange={(v) =>
                              setNewWebhookEvents((prev) =>
                                v ? [...prev, ev.value] : prev.filter((x) => x !== ev.value)
                              )
                            }
                          />
                          <span className="font-mono text-xs text-muted-foreground">{ev.value}</span>
                          <span className="text-xs">{ev.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setWebhookDialogOpen(false)}>Annuler</Button>
                  <Button
                    onClick={() => createWebhook.mutate()}
                    disabled={!newWebhookName || !newWebhookUrl || newWebhookEvents.length === 0 || createWebhook.isPending}
                  >
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {webhooksLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin" size={20} /></div>
          ) : webhooks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <Webhook className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Aucun webhook configuré.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {webhooks.map((wh) => (
                <Card key={wh.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{wh.name}</span>
                          {!wh.is_active && <Badge variant="secondary" className="text-[10px]">Désactivé</Badge>}
                        </div>
                        <p className="text-xs font-mono text-muted-foreground truncate">{wh.url}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {wh.events.map((ev) => (
                            <Badge key={ev} variant="outline" className="text-[10px] font-mono">{ev}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={wh.is_active}
                          onCheckedChange={(v) => toggleWebhook.mutate({ id: wh.id, active: v })}
                        />
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => { if (confirm("Supprimer ce webhook ?")) deleteWebhook.mutate(wh.id); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Logs tab ──────────────────────────────────────────────────── */}
        <TabsContent value="logs">
          <Card>
            <CardContent className="p-0">
              {logsLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin" size={20} /></div>
              ) : logs.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Activity className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p className="text-sm">Aucun log de webhook pour l'instant.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Événement</TableHead>
                      <TableHead className="text-center">Statut</TableHead>
                      <TableHead className="text-right">Code HTTP</TableHead>
                      <TableHead className="text-right">Durée</TableHead>
                      <TableHead className="text-right">Envoyé</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">{log.event_type}</TableCell>
                        <TableCell className="text-center">
                          {log.success
                            ? <CheckCircle2 size={15} className="text-emerald-500 mx-auto" />
                            : <XCircle size={15} className="text-red-500 mx-auto" />}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono">
                          {log.status_code ?? "—"}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {log.duration_ms != null ? `${log.duration_ms}ms` : "—"}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.sent_at), { addSuffix: true, locale: fr })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Docs tab ──────────────────────────────────────────────────── */}
        <TabsContent value="docs">
          <ScrollArea className="h-[70vh]">
            <ApiDocs storeId={storeId || ""} />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
