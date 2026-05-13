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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/contexts/ModulesContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Plus, Pencil, Trash2, Lock, Sparkles, Zap, CheckCircle2,
  XCircle, Clock, Play, ChevronRight, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type TriggerType =
  | "order_created" | "order_confirmed" | "order_delivered" | "order_cancelled"
  | "order_value_above" | "order_not_confirmed_after"
  | "delivery_assigned" | "loyalty_tier_reached";

type ActionType =
  | "send_whatsapp_customer" | "send_sms_customer" | "notify_team"
  | "update_order_status" | "add_loyalty_points" | "add_order_tag";

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger_type: TriggerType;
  trigger_config: Record<string, unknown>;
  action_type: ActionType;
  action_config: Record<string, unknown>;
  is_active: boolean;
  run_count: number;
  last_run_at: string | null;
  created_at: string;
}

interface AutomationLog {
  id: string;
  rule_id: string;
  status: "success" | "failed" | "skipped";
  output: string | null;
  triggered_at: string;
}

// ── Label maps ────────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<TriggerType, string> = {
  order_created: "Nouvelle commande reçue",
  order_confirmed: "Commande confirmée",
  order_delivered: "Commande livrée",
  order_cancelled: "Commande annulée",
  order_value_above: "Montant commande > seuil",
  order_not_confirmed_after: "Commande non confirmée après X min",
  delivery_assigned: "Livreur assigné",
  loyalty_tier_reached: "Client atteint un palier fidélité",
};

const ACTION_LABELS: Record<ActionType, string> = {
  send_whatsapp_customer: "Envoyer WhatsApp au client",
  send_sms_customer: "Envoyer SMS au client",
  notify_team: "Notifier l'équipe",
  update_order_status: "Changer le statut de commande",
  add_loyalty_points: "Ajouter des points fidélité",
  add_order_tag: "Ajouter un tag à la commande",
};

const TRIGGER_COLOR: Record<TriggerType, string> = {
  order_created: "bg-blue-500/10 text-blue-600",
  order_confirmed: "bg-emerald-500/10 text-emerald-600",
  order_delivered: "bg-green-500/10 text-green-600",
  order_cancelled: "bg-red-500/10 text-red-600",
  order_value_above: "bg-amber-500/10 text-amber-600",
  order_not_confirmed_after: "bg-orange-500/10 text-orange-600",
  delivery_assigned: "bg-violet-500/10 text-violet-600",
  loyalty_tier_reached: "bg-pink-500/10 text-pink-600",
};

// ── Action config fields ──────────────────────────────────────────────────────

function ActionConfigFields({
  actionType,
  config,
  onChange,
}: {
  actionType: ActionType;
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  if (actionType === "send_whatsapp_customer" || actionType === "send_sms_customer") {
    return (
      <div>
        <Label>Message ({"{nom}"}, {"{commande}"}, {"{montant}"} disponibles)</Label>
        <Textarea
          rows={3}
          value={(config.message as string) ?? ""}
          onChange={(e) => onChange({ ...config, message: e.target.value })}
          placeholder={`Bonjour {nom}, votre commande #{commande} de {montant} FCFA a été confirmée !`}
        />
      </div>
    );
  }
  if (actionType === "notify_team") {
    return (
      <div>
        <Label>Message interne</Label>
        <Input
          value={(config.message as string) ?? ""}
          onChange={(e) => onChange({ ...config, message: e.target.value })}
          placeholder="Nouvelle commande prioritaire reçue"
        />
      </div>
    );
  }
  if (actionType === "update_order_status") {
    return (
      <div>
        <Label>Nouveau statut</Label>
        <Select
          value={(config.status as string) ?? ""}
          onValueChange={(v) => onChange({ ...config, status: v })}
        >
          <SelectTrigger><SelectValue placeholder="Choisir un statut" /></SelectTrigger>
          <SelectContent>
            {["pending","confirmed","preparing","ready","assigned","delivered","cancelled","returned"].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (actionType === "add_loyalty_points") {
    return (
      <div>
        <Label>Points à ajouter</Label>
        <Input
          type="number"
          min={1}
          value={(config.points as number) ?? ""}
          onChange={(e) => onChange({ ...config, points: Number(e.target.value) })}
          placeholder="50"
        />
      </div>
    );
  }
  if (actionType === "add_order_tag") {
    return (
      <div>
        <Label>Tag</Label>
        <Input
          value={(config.tag as string) ?? ""}
          onChange={(e) => onChange({ ...config, tag: e.target.value })}
          placeholder="VIP, Urgent, Grosse commande…"
        />
      </div>
    );
  }
  return null;
}

function TriggerConfigFields({
  triggerType,
  config,
  onChange,
}: {
  triggerType: TriggerType;
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  if (triggerType === "order_value_above") {
    return (
      <div>
        <Label>Montant minimum (FCFA)</Label>
        <Input
          type="number"
          min={0}
          value={(config.min_amount as number) ?? ""}
          onChange={(e) => onChange({ ...config, min_amount: Number(e.target.value) })}
          placeholder="50000"
        />
      </div>
    );
  }
  if (triggerType === "order_not_confirmed_after") {
    return (
      <div>
        <Label>Délai (minutes)</Label>
        <Input
          type="number"
          min={1}
          value={(config.minutes as number) ?? ""}
          onChange={(e) => onChange({ ...config, minutes: Number(e.target.value) })}
          placeholder="30"
        />
      </div>
    );
  }
  if (triggerType === "loyalty_tier_reached") {
    return (
      <div>
        <Label>Nom du palier</Label>
        <Input
          value={(config.tier_name as string) ?? ""}
          onChange={(e) => onChange({ ...config, tier_name: e.target.value })}
          placeholder="Gold, Platinum…"
        />
      </div>
    );
  }
  return null;
}

// ── Rule card ─────────────────────────────────────────────────────────────────

function RuleCard({
  rule,
  onEdit,
  onDelete,
  onToggle,
}: {
  rule: AutomationRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <Card className={cn("transition-opacity", !rule.is_active && "opacity-60")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
            rule.is_active ? "bg-violet-500/10" : "bg-muted",
          )}>
            <Zap size={16} className={rule.is_active ? "text-violet-500" : "text-muted-foreground"} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{rule.name}</p>
              {!rule.is_active && <Badge variant="secondary" className="text-[10px]">Désactivé</Badge>}
            </div>
            {rule.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{rule.description}</p>
            )}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <Badge variant="outline" className={cn("text-[10px] font-normal", TRIGGER_COLOR[rule.trigger_type])}>
                {TRIGGER_LABELS[rule.trigger_type]}
              </Badge>
              <ChevronRight size={10} className="text-muted-foreground" />
              <Badge variant="outline" className="text-[10px] font-normal bg-slate-500/10 text-slate-600">
                {ACTION_LABELS[rule.action_type]}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Switch checked={rule.is_active} onCheckedChange={onToggle} />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {rule.run_count > 0 && (
          <p className="text-[10px] text-muted-foreground mt-2">
            {rule.run_count} exécution{rule.run_count > 1 ? "s" : ""}
            {rule.last_run_at && ` · Dernière : ${format(new Date(rule.last_run_at), "d MMM à HH:mm", { locale: fr })}`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const BLANK: Partial<AutomationRule> = {
  name: "",
  description: "",
  trigger_type: "order_created",
  trigger_config: {},
  action_type: "send_whatsapp_customer",
  action_config: {},
  is_active: true,
};

export default function Automations() {
  const { user } = useAuth();
  const storeId = user?.store_id;
  const { hasModule, isLoading: modulesLoading } = useModules();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const moduleEnabled = hasModule("automations");

  const [editing, setEditing] = useState<Partial<AutomationRule> | null>(null);

  // Rules
  const { data: rules = [], isLoading } = useQuery<AutomationRule[]>({
    queryKey: ["automation-rules", storeId],
    enabled: !!storeId && moduleEnabled,
    queryFn: async () => {
      const { data, error } = await (supabase.from("automation_rules" as any) as any)
        .select("*")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AutomationRule[];
    },
  });

  // Logs (last 50)
  const { data: logs = [] } = useQuery<(AutomationLog & { rule_name: string })[]>({
    queryKey: ["automation-logs", storeId],
    enabled: !!storeId && moduleEnabled,
    queryFn: async () => {
      const { data, error } = await (supabase.from("automation_logs" as any) as any)
        .select("id, rule_id, status, output, triggered_at, automation_rules(name)")
        .eq("store_id", storeId!)
        .order("triggered_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return ((data ?? []) as any[]).map((l) => ({
        ...l,
        rule_name: l.automation_rules?.name ?? "Règle supprimée",
      }));
    },
  });

  const upsert = useMutation({
    mutationFn: async (r: Partial<AutomationRule>) => {
      const payload = {
        store_id: storeId,
        name: r.name!,
        description: r.description || null,
        trigger_type: r.trigger_type!,
        trigger_config: r.trigger_config ?? {},
        action_type: r.action_type!,
        action_config: r.action_config ?? {},
        is_active: r.is_active ?? true,
      };
      const q = r.id
        ? (supabase.from("automation_rules" as any) as any).update(payload).eq("id", r.id)
        : (supabase.from("automation_rules" as any) as any).insert(payload);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules", storeId] });
      setEditing(null);
      toast({ title: "Règle enregistrée" });
    },
    onError: (err: any) =>
      toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase.from("automation_rules" as any) as any)
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automation-rules", storeId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("automation_rules" as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules", storeId] });
      toast({ title: "Règle supprimée" });
    },
  });

  if (modulesLoading) {
    return (
      <DashboardLayout title="Automatisations">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </DashboardLayout>
    );
  }

  if (!moduleEnabled) {
    return (
      <DashboardLayout title="Automatisations" subtitle="Module Automatisations IA">
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Lock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold mb-1">Module non activé</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Activez le module <span className="font-medium">Automatisations IA</span> pour créer des règles qui agissent automatiquement sur vos commandes.
            </p>
            <Button onClick={() => navigate("/dashboard/modules")}>Voir les modules</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const activeRules = rules.filter((r) => r.is_active);
  const successCount = logs.filter((l) => l.status === "success").length;

  return (
    <DashboardLayout title="Automatisations" subtitle="Définissez des règles Quand... Alors...">

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Règles totales", value: rules.length, icon: Zap, color: "text-violet-500" },
          { label: "Actives", value: activeRules.length, icon: Play, color: "text-emerald-500" },
          { label: "Exécutions (50 der.)", value: logs.length, icon: Clock, color: "text-blue-500" },
          { label: "Succès", value: successCount, icon: CheckCircle2, color: "text-green-500" },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center bg-muted")}>
                <k.icon size={15} className={k.color} />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{k.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="rules">
        <div className="flex items-center justify-between mb-3">
          <TabsList>
            <TabsTrigger value="rules">Règles</TabsTrigger>
            <TabsTrigger value="logs">Historique</TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={() => setEditing({ ...BLANK })}>
            <Plus className="mr-1.5 h-4 w-4" /> Nouvelle règle
          </Button>
        </div>

        {/* Rules tab */}
        <TabsContent value="rules" className="mt-0">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : rules.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-14 text-center">
                <Sparkles className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground mb-3">
                  Aucune règle. Créez votre première automation pour gagner du temps.
                </p>
                <Button size="sm" onClick={() => setEditing({ ...BLANK })}>
                  <Plus className="mr-1.5 h-4 w-4" /> Créer une règle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {rules.map((r) => (
                <RuleCard
                  key={r.id}
                  rule={r}
                  onEdit={() => setEditing(r)}
                  onDelete={() => { if (confirm(`Supprimer "${r.name}" ?`)) remove.mutate(r.id); }}
                  onToggle={() => toggle.mutate({ id: r.id, is_active: !r.is_active })}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Logs tab */}
        <TabsContent value="logs" className="mt-0">
          {logs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Clock className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Aucune exécution enregistrée pour le moment.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {logs.map((l) => (
                    <div key={l.id} className="flex items-center gap-3 px-4 py-3">
                      {l.status === "success"
                        ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                        : l.status === "failed"
                        ? <XCircle size={15} className="text-red-500 shrink-0" />
                        : <AlertCircle size={15} className="text-amber-500 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{l.rule_name}</p>
                        {l.output && (
                          <p className="text-xs text-muted-foreground truncate">{l.output}</p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(l.triggered_at), "d MMM HH:mm", { locale: fr })}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Modifier" : "Nouvelle"} règle</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom de la règle</Label>
                <Input
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Ex : Confirmer automatiquement les petites commandes"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optionnel)</Label>
                <Input
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Brève description de ce que fait cette règle"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Déclencheur</Label>
                  <Select
                    value={editing.trigger_type}
                    onValueChange={(v) => setEditing((s) => ({
                      ...s, trigger_type: v as TriggerType, trigger_config: {},
                    }))}
                  >
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TRIGGER_LABELS) as TriggerType[]).map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">
                          {TRIGGER_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editing.trigger_type && (
                    <TriggerConfigFields
                      triggerType={editing.trigger_type}
                      config={editing.trigger_config ?? {}}
                      onChange={(c) => setEditing((s) => ({ ...s, trigger_config: c }))}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Action</Label>
                  <Select
                    value={editing.action_type}
                    onValueChange={(v) => setEditing((s) => ({
                      ...s, action_type: v as ActionType, action_config: {},
                    }))}
                  >
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ACTION_LABELS) as ActionType[]).map((a) => (
                        <SelectItem key={a} value={a} className="text-xs">
                          {ACTION_LABELS[a]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editing.action_type && (
                    <ActionConfigFields
                      actionType={editing.action_type}
                      config={editing.action_config ?? {}}
                      onChange={(c) => setEditing((s) => ({ ...s, action_config: c }))}
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editing.is_active ?? true}
                  onCheckedChange={(v) => setEditing((s) => ({ ...s, is_active: v }))}
                />
                <Label className="font-normal">Règle active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
            <Button
              onClick={() => editing && upsert.mutate(editing)}
              disabled={!editing?.name || !editing?.trigger_type || !editing?.action_type || upsert.isPending}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
