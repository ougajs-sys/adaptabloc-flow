import { useState, useCallback, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Phone, MapPin, MessageSquare, Package, Loader2,
  FileText, ChevronDown, ChevronUp, Timer, CheckCircle2,
  XCircle, PhoneOff, PhoneMissed, PhoneCall, Calendar,
  Voicemail, RefreshCw,
} from "lucide-react";
import { useWorkspaceOrders, type WorkspaceOrder } from "@/hooks/useWorkspaceOrders";
import { getStageByStatus } from "@/lib/team-roles";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

type CallOutcome =
  | "confirmed"
  | "rejected"
  | "no_answer"
  | "busy"
  | "wrong_number"
  | "callback"
  | "reschedule"
  | "voicemail";

interface CallScript {
  id: string;
  title: string;
  content: string;
  is_default: boolean;
  is_active: boolean;
}

// ── Outcome config ─────────────────────────────────────────────────────────────

const OUTCOMES: {
  value: CallOutcome;
  label: string;
  icon: typeof CheckCircle2;
  className: string;
}[] = [
  { value: "confirmed",    label: "Confirmée",      icon: CheckCircle2, className: "border-emerald-500/60 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100" },
  { value: "rejected",     label: "Annulée",        icon: XCircle,      className: "border-red-500/60 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 hover:bg-red-100" },
  { value: "no_answer",    label: "Pas de réponse", icon: PhoneMissed,  className: "border-slate-400/60 bg-slate-50 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 hover:bg-slate-100" },
  { value: "busy",         label: "Occupé",         icon: PhoneOff,     className: "border-orange-400/60 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 hover:bg-orange-100" },
  { value: "wrong_number", label: "Mauvais numéro", icon: XCircle,      className: "border-yellow-400/60 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 hover:bg-yellow-100" },
  { value: "callback",     label: "Rappel demandé", icon: Calendar,     className: "border-blue-500/60 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 hover:bg-blue-100" },
  { value: "reschedule",   label: "Replanifier",    icon: RefreshCw,    className: "border-violet-500/60 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 hover:bg-violet-100" },
  { value: "voicemail",    label: "Messagerie",     icon: Voicemail,    className: "border-slate-400/60 bg-slate-50 text-slate-600 dark:bg-slate-800/40 dark:text-slate-300 hover:bg-slate-100" },
];

// ── Script variable substitution ───────────────────────────────────────────────

function fillScript(template: string, order: WorkspaceOrder, storeName = "notre boutique"): string {
  const articles = order.items
    .map((i) => `- ${i.name}${i.variant ? ` (${i.variant})` : ""} ×${i.qty} → ${(i.price * i.qty).toLocaleString("fr-FR")} F`)
    .join("\n");
  return template
    .replace(/\{nom_client\}/g, order.customer)
    .replace(/\{numero_commande\}/g, order.id)
    .replace(/\{liste_articles\}/g, articles)
    .replace(/\{total\}/g, order.total.toLocaleString("fr-FR"))
    .replace(/\{adresse\}/g, order.address || "—")
    .replace(/\{boutique\}/g, storeName);
}

// ── Call timer hook ────────────────────────────────────────────────────────────

function useCallTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active) {
      setSeconds(0);
      ref.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (ref.current) clearInterval(ref.current);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [active]);

  const fmt = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return { seconds, fmt };
}

// ── Main component ─────────────────────────────────────────────────────────────

const CallerWorkspace = () => {
  const { user } = useAuth();
  const storeId = user?.store_id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { orders, isLoading, todayStats, updateStatus } = useWorkspaceOrders([
    "new", "caller_pending", "confirmed", "cancelled",
  ]);

  const [selectedOrder, setSelectedOrder] = useState<WorkspaceOrder | null>(null);
  const [outcome, setOutcome] = useState<CallOutcome | null>(null);
  const [note, setNote] = useState("");
  const [callbackAt, setCallbackAt] = useState("");
  const [scriptOpen, setScriptOpen] = useState(true);
  const [activeScriptId, setActiveScriptId] = useState<string | null>(null);

  const { seconds: callDuration, fmt: timerFmt } = useCallTimer(!!selectedOrder);

  const callerOrders = orders.filter((o) => ["new", "caller_pending"].includes(o.status));

  // ── Fetch call scripts ───────────────────────────────────────────────────────

  const { data: scripts = [] } = useQuery<CallScript[]>({
    queryKey: ["call-scripts", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("call_scripts" as any) as any)
        .select("id, title, content, is_default, is_active")
        .eq("store_id", storeId!)
        .eq("is_active", true)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return (data || []) as CallScript[];
    },
  });

  const activeScript = scripts.find((s) => s.id === activeScriptId) ?? scripts[0] ?? null;

  // ── Log call mutation ────────────────────────────────────────────────────────

  const logCall = useMutation({
    mutationFn: async ({
      orderId,
      outcome,
      notes,
      durationSeconds,
      callbackAt,
      scriptId,
    }: {
      orderId: string;
      outcome: CallOutcome;
      notes?: string;
      durationSeconds?: number;
      callbackAt?: string;
      scriptId?: string;
    }) => {
      const { error } = await (supabase.from("call_logs" as any) as any).insert({
        store_id: storeId,
        order_id: orderId,
        caller_id: user?.id,
        outcome,
        notes: notes || null,
        duration_seconds: durationSeconds || null,
        callback_at: callbackAt || null,
        script_id: scriptId || null,
      });
      if (error) throw error;
    },
    onError: (err: any) =>
      toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  // ── Handle pick-up ────────────────────────────────────────────────────────────

  const handlePickUp = useCallback((order: WorkspaceOrder) => {
    if (order.status === "new") {
      updateStatus.mutate({ dbId: order.dbId, status: "caller_pending" });
    }
    setSelectedOrder(order);
    setOutcome(null);
    setNote("");
    setCallbackAt("");
    setActiveScriptId(null);
    setScriptOpen(true);
  }, [updateStatus]);

  // ── Handle submit ─────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    if (!selectedOrder || !outcome) return;

    // For confirmed/rejected → updateStatus handles the DB side (order status)
    // The call_log trigger also updates order status, so we only need to log.
    // updateStatus is kept for real-time UI update.
    const logPayload = {
      orderId: selectedOrder.dbId,
      outcome,
      notes: note || undefined,
      durationSeconds: callDuration > 0 ? callDuration : undefined,
      callbackAt: outcome === "callback" && callbackAt ? callbackAt : undefined,
      scriptId: activeScript?.id,
    };

    if (outcome === "confirmed" || outcome === "rejected") {
      const targetStatus = outcome === "confirmed" ? "confirmed" : "cancelled";
      updateStatus.mutate(
        { dbId: selectedOrder.dbId, status: targetStatus, notes: note || undefined },
        {
          onSuccess: () => {
            logCall.mutate(logPayload);
            setSelectedOrder(null);
          },
        }
      );
    } else {
      logCall.mutate(logPayload, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["call-scripts", storeId] });
          setSelectedOrder(null);
          toast({ title: "Appel enregistré", description: `Résultat : ${OUTCOMES.find((o) => o.value === outcome)?.label}` });
        },
      });
    }
  }, [selectedOrder, outcome, note, callDuration, callbackAt, activeScript, updateStatus, logCall, queryClient, storeId, toast]);

  const isPending = updateStatus.isPending || logCall.isPending;

  if (isLoading) {
    return (
      <DashboardLayout title="Espace Caller" subtitle="Confirmation des commandes">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      {/* ── Call dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="font-[Space_Grotesk] flex items-center gap-2">
                  <PhoneCall size={18} className="text-blue-500" />
                  Appel — {selectedOrder.id}
                  <span className="ml-auto flex items-center gap-1 text-sm font-normal text-muted-foreground tabular-nums">
                    <Timer size={14} /> {timerFmt}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Customer info */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="border-border/60">
                    <CardContent className="p-3 space-y-1.5">
                      <p className="font-semibold text-sm">{selectedOrder.customer}</p>
                      <a
                        href={`tel:${selectedOrder.phone}`}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                      >
                        <Phone size={13} /> {selectedOrder.phone}
                      </a>
                      {selectedOrder.address && (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <MapPin size={12} className="mt-0.5 shrink-0" />
                          <span>{selectedOrder.address}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-border/60">
                    <CardContent className="p-3">
                      <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                        <Package size={12} /> Articles
                      </p>
                      <div className="space-y-0.5">
                        {selectedOrder.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="truncate mr-2">
                              {item.name}
                              {item.variant && <span className="text-muted-foreground"> ({item.variant})</span>}
                              <span className="text-muted-foreground"> ×{item.qty}</span>
                            </span>
                            <span className="font-medium shrink-0">{(item.price * item.qty).toLocaleString("fr-FR")} F</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between font-bold text-xs mt-2 pt-1.5 border-t">
                        <span>Total</span>
                        <span>{selectedOrder.total.toLocaleString("fr-FR")} F</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Script panel */}
                {scripts.length > 0 && (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardHeader className="py-2 px-3">
                      <button
                        className="flex items-center justify-between w-full text-left"
                        onClick={() => setScriptOpen((v) => !v)}
                      >
                        <span className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                          <FileText size={13} />
                          Script d'appel
                          {scripts.length > 1 && (
                            <select
                              className="ml-2 text-xs bg-transparent border border-primary/30 rounded px-1 py-0.5"
                              value={activeScriptId ?? ""}
                              onChange={(e) => setActiveScriptId(e.target.value || null)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {scripts.map((s) => (
                                <option key={s.id} value={s.id}>{s.title}</option>
                              ))}
                            </select>
                          )}
                        </span>
                        {scriptOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </CardHeader>
                    {scriptOpen && activeScript && (
                      <CardContent className="px-3 pb-3 pt-0">
                        <ScrollArea className="h-40">
                          <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-mono leading-relaxed">
                            {fillScript(activeScript.content, selectedOrder)}
                          </pre>
                        </ScrollArea>
                      </CardContent>
                    )}
                  </Card>
                )}

                {/* Outcome selector */}
                <div>
                  <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                    Résultat de l'appel
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {OUTCOMES.map(({ value, label, icon: Icon, className }) => (
                      <button
                        key={value}
                        onClick={() => setOutcome(value)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-lg border p-2.5 text-[11px] font-medium transition-all",
                          className,
                          outcome === value && "ring-2 ring-offset-1 ring-primary scale-[0.97]"
                        )}
                      >
                        <Icon size={16} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Callback datetime (conditional) */}
                {outcome === "callback" && (
                  <div>
                    <p className="text-xs font-medium mb-1 flex items-center gap-1">
                      <Calendar size={13} /> Date/heure du rappel
                    </p>
                    <Input
                      type="datetime-local"
                      value={callbackAt}
                      onChange={(e) => setCallbackAt(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="text-xs font-medium flex items-center gap-1 mb-1">
                    <MessageSquare size={13} /> Note d'appel (optionnel)
                  </label>
                  <Textarea
                    placeholder="Adresse confirmée, remarques client..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedOrder(null)}
                    disabled={isPending}
                  >
                    Fermer
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={!outcome || isPending}
                  >
                    {isPending ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : null}
                    Enregistrer
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <DashboardLayout title="Espace Caller" subtitle="Confirmation des commandes">
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">À traiter</p>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-blue-500">{callerOrders.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Confirmées aujourd'hui</p>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-emerald-500">{todayStats.confirmed}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Annulées aujourd'hui</p>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-destructive">{todayStats.cancelled}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-[Space_Grotesk]">
              File d'attente — Commandes à confirmer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {callerOrders.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                🎉 Aucune commande en attente ! Tout est confirmé.
              </p>
            )}
            {callerOrders.map((order) => {
              const stage = getStageByStatus(order.status);
              return (
                <div
                  key={order.dbId}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-500/10 text-blue-500 text-xs font-bold">
                      {order.customer.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium">{order.id}</span>
                      <Badge variant="outline" className={`text-[10px] ${stage.color} border-0`}>
                        {stage.shortLabel}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.phone} · {order.items.length} article{order.items.length > 1 ? "s" : ""} · {order.total.toLocaleString("fr-FR")} F
                    </p>
                  </div>
                  <Button size="sm" className="gap-1 shrink-0" onClick={() => handlePickUp(order)}>
                    <Phone size={14} /> Appeler
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </DashboardLayout>
    </>
  );
};

export default CallerWorkspace;
