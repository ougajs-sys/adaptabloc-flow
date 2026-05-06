import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/contexts/ModulesContext";
import { useNavigate } from "react-router-dom";
import {
  Lock, Loader2, PhoneCall, CheckCircle2, XCircle,
  TrendingUp, Clock, Calendar, Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CallerPerf {
  caller_id: string;
  total_calls: number;
  confirmed_count: number;
  rejected_count: number;
  no_answer_count: number;
  callback_count: number;
  conversion_rate: number | null;
  avg_duration_seconds: number | null;
  calls_last_7d: number;
  calls_last_24h: number;
  last_call_at: string | null;
  // joined from auth.users via profiles
  caller_name?: string;
  caller_email?: string;
}

interface PendingCallback {
  id: string;
  order_id: string | null;
  callback_at: string;
  notes: string | null;
  caller_id: string;
  caller_name?: string;
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function fmtDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function conversionColor(rate: number | null): string {
  if (!rate) return "text-muted-foreground";
  if (rate >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (rate >= 40) return "text-orange-500 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CallerStats() {
  const { user } = useAuth();
  const storeId = user?.store_id;
  const { hasModule, isLoading: modulesLoading } = useModules();
  const navigate = useNavigate();

  const moduleEnabled = hasModule("call_center");

  // Caller performance (from VIEW)
  const { data: perfs = [], isLoading: perfsLoading } = useQuery<CallerPerf[]>({
    queryKey: ["caller-performance", storeId],
    enabled: !!storeId && moduleEnabled,
    queryFn: async () => {
      const { data: perfData, error } = await (supabase.from("caller_performance" as any) as any)
        .select("*")
        .eq("store_id", storeId!);
      if (error) throw error;

      // Enrich with profile names
      const callerIds: string[] = (perfData || []).map((p: any) => p.caller_id);
      if (callerIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", callerIds);

      return (perfData || []).map((p: any) => {
        const profile = (profiles || []).find((pr: any) => pr.id === p.caller_id);
        return {
          ...p,
          caller_name: profile?.full_name || "Caller",
          caller_email: profile?.email || "",
        } as CallerPerf;
      });
    },
    refetchInterval: 30_000,
  });

  // Pending callbacks
  const { data: callbacks = [], isLoading: callbacksLoading } = useQuery<PendingCallback[]>({
    queryKey: ["pending-callbacks", storeId],
    enabled: !!storeId && moduleEnabled,
    queryFn: async () => {
      const { data, error } = await (supabase.from("call_logs" as any) as any)
        .select("id, order_id, callback_at, notes, caller_id")
        .eq("store_id", storeId!)
        .eq("outcome", "callback")
        .not("callback_at", "is", null)
        .gte("callback_at", new Date().toISOString())
        .order("callback_at", { ascending: true })
        .limit(20);
      if (error) throw error;

      const callerIds: string[] = [...new Set((data || []).map((d: any) => d.caller_id))];
      const { data: profiles } = callerIds.length
        ? await supabase.from("profiles").select("id, full_name").in("id", callerIds)
        : { data: [] };

      return (data || []).map((d: any) => ({
        ...d,
        caller_name: (profiles || []).find((p: any) => p.id === d.caller_id)?.full_name || "Caller",
      })) as PendingCallback[];
    },
    refetchInterval: 60_000,
  });

  // Today aggregate
  const totalToday = perfs.reduce((s, p) => s + (p.calls_last_24h || 0), 0);
  const totalConfirmed = perfs.reduce((s, p) => s + (p.confirmed_count || 0), 0);
  const totalCalls = perfs.reduce((s, p) => s + (p.total_calls || 0), 0);
  const overallRate = totalCalls > 0 ? Math.round((totalConfirmed / totalCalls) * 100) : 0;

  if (modulesLoading) {
    return (
      <DashboardLayout title="Statistiques callers">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </DashboardLayout>
    );
  }

  if (!moduleEnabled) {
    return (
      <DashboardLayout title="Statistiques callers" subtitle="Module Centre d'appels">
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Lock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold mb-1">Module non activé</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Activez le module <span className="font-medium">Centre d'appels</span> pour accéder aux statistiques callers.
            </p>
            <Button onClick={() => navigate("/dashboard/modules")}>Voir les modules</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const isLoading = perfsLoading || callbacksLoading;

  return (
    <DashboardLayout
      title="Statistiques callers"
      subtitle="Performance de l'équipe de confirmation"
    >
      <div className="space-y-6">

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Callers actifs</p>
              </div>
              <p className="text-2xl font-bold font-[Space_Grotesk]">{perfs.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <PhoneCall size={16} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Appels auj.</p>
              </div>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-blue-500">{totalToday}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={16} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total confirmés</p>
              </div>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-emerald-500">{totalConfirmed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Taux global</p>
              </div>
              <p className={`text-2xl font-bold font-[Space_Grotesk] ${conversionColor(overallRate)}`}>
                {overallRate}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-[Space_Grotesk] flex items-center gap-2">
              <PhoneCall size={16} />
              Performance par caller
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-muted-foreground" size={24} />
              </div>
            ) : perfs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <PhoneCall className="mx-auto mb-2 h-8 w-8 opacity-30" />
                <p className="text-sm">Aucun appel enregistré pour le moment.</p>
                <p className="text-xs mt-1">Les statistiques apparaîtront dès que vos callers commenceront à utiliser l'espace de travail.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caller</TableHead>
                    <TableHead className="text-right">Total appels</TableHead>
                    <TableHead className="text-right">Confirmés</TableHead>
                    <TableHead className="text-right">Annulés</TableHead>
                    <TableHead className="text-right">Taux</TableHead>
                    <TableHead className="text-right">Durée moy.</TableHead>
                    <TableHead className="text-right">Auj.</TableHead>
                    <TableHead className="text-right">Dernier appel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perfs
                    .sort((a, b) => (b.conversion_rate ?? 0) - (a.conversion_rate ?? 0))
                    .map((p) => (
                      <TableRow key={p.caller_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-[10px] bg-blue-500/10 text-blue-600">
                                {(p.caller_name || "C").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium leading-none">{p.caller_name}</p>
                              <p className="text-xs text-muted-foreground">{p.caller_email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{p.total_calls}</TableCell>
                        <TableCell className="text-right">
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                            {p.confirmed_count}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-red-500 font-mono text-sm">
                            {p.rejected_count}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress
                              value={p.conversion_rate ?? 0}
                              className="w-14 h-1.5"
                            />
                            <span className={`text-sm font-semibold tabular-nums ${conversionColor(p.conversion_rate)}`}>
                              {p.conversion_rate != null ? `${p.conversion_rate}%` : "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          <span className="flex items-center justify-end gap-1">
                            <Clock size={12} />
                            {fmtDuration(p.avg_duration_seconds)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="text-[11px] tabular-nums">
                            {p.calls_last_24h}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {p.last_call_at
                            ? formatDistanceToNow(new Date(p.last_call_at), { addSuffix: true, locale: fr })
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pending callbacks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-[Space_Grotesk] flex items-center gap-2">
              <Calendar size={16} />
              Rappels planifiés
              {callbacks.length > 0 && (
                <Badge variant="secondary" className="ml-1">{callbacks.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {callbacksLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-muted-foreground" size={20} />
              </div>
            ) : callbacks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Aucun rappel planifié.
              </p>
            ) : (
              <div className="space-y-2">
                {callbacks.map((cb) => {
                  const cbDate = new Date(cb.callback_at);
                  const isUrgent = cbDate.getTime() - Date.now() < 30 * 60 * 1000;
                  return (
                    <div
                      key={cb.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        isUrgent ? "border-orange-400/60 bg-orange-50 dark:bg-orange-950/20" : "border-border/60"
                      }`}
                    >
                      <Calendar size={16} className={isUrgent ? "text-orange-500 mt-0.5" : "text-muted-foreground mt-0.5"} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {cb.order_id && (
                            <span className="font-mono text-xs font-medium">Commande #{cb.order_id.slice(0, 8)}</span>
                          )}
                          {isUrgent && (
                            <Badge variant="destructive" className="text-[10px]">Urgent</Badge>
                          )}
                        </div>
                        {cb.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{cb.notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Par <span className="font-medium">{cb.caller_name}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium">
                          {cbDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cbDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
