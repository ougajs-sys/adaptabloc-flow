import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/contexts/ModulesContext";
import { useNavigate } from "react-router-dom";
import {
  Lock, Loader2, PackageCheck, TrendingUp, Clock, Users, Award,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface PreparerPerf {
  preparer_id: string;
  total_prepared: number;
  avg_duration_seconds: number | null;
  avg_items_per_order: number | null;
  prepared_last_24h: number;
  prepared_last_7d: number;
  last_completed_at: string | null;
  preparer_name?: string;
  preparer_email?: string;
}

function fmtDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function WarehouseStats() {
  const { user } = useAuth();
  const storeId = user?.store_id;
  const { hasModule, isLoading: modulesLoading } = useModules();
  const navigate = useNavigate();

  const moduleEnabled = hasModule("warehouse_team");

  const { data: perfs = [], isLoading } = useQuery<PreparerPerf[]>({
    queryKey: ["preparer-performance", storeId],
    enabled: !!storeId && moduleEnabled,
    queryFn: async () => {
      const { data, error } = await (supabase.from("preparer_performance" as any) as any)
        .select("*")
        .eq("store_id", storeId!);
      if (error) throw error;

      const ids: string[] = (data || []).map((p: any) => p.preparer_id);
      if (!ids.length) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);

      return (data || []).map((p: any) => {
        const profile = (profiles || []).find((pr: any) => pr.id === p.preparer_id);
        return {
          ...p,
          preparer_name: profile?.full_name || "Préparateur",
          preparer_email: profile?.email || "",
        } as PreparerPerf;
      });
    },
    refetchInterval: 30_000,
  });

  const totalToday = perfs.reduce((s, p) => s + (p.prepared_last_24h || 0), 0);
  const totalAll = perfs.reduce((s, p) => s + (p.total_prepared || 0), 0);
  const topPreparer = perfs.length
    ? perfs.reduce((best, p) => p.total_prepared > best.total_prepared ? p : best)
    : null;
  const bestAvgDuration = perfs.length
    ? perfs
        .filter((p) => p.avg_duration_seconds != null)
        .reduce<PreparerPerf | null>(
          (best, p) => (!best || p.avg_duration_seconds! < best.avg_duration_seconds!) ? p : best,
          null
        )
    : null;

  if (modulesLoading) {
    return (
      <DashboardLayout title="Stats préparateurs">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </DashboardLayout>
    );
  }

  if (!moduleEnabled) {
    return (
      <DashboardLayout title="Stats préparateurs" subtitle="Module Équipe entrepôt">
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Lock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold mb-1">Module non activé</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Activez le module <span className="font-medium">Équipe entrepôt</span> pour accéder aux statistiques de préparation.
            </p>
            <Button onClick={() => navigate("/dashboard/modules")}>Voir les modules</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const maxPrepared = Math.max(...perfs.map((p) => p.total_prepared), 1);

  return (
    <DashboardLayout
      title="Stats préparateurs"
      subtitle="Productivité de l'équipe de préparation"
    >
      <div className="space-y-6">

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Préparateurs</p>
              </div>
              <p className="text-2xl font-bold font-[Space_Grotesk]">{perfs.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <PackageCheck size={16} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Préparés auj.</p>
              </div>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-amber-500">{totalToday}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total historique</p>
              </div>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-emerald-500">{totalAll}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Meilleur temps</p>
              </div>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-blue-500">
                {fmtDuration(bestAvgDuration?.avg_duration_seconds ?? null)}
              </p>
              {bestAvgDuration && (
                <p className="text-[10px] text-muted-foreground truncate">{bestAvgDuration.preparer_name}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top performer highlight */}
        {topPreparer && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4 flex items-center gap-4">
              <Award size={28} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Top préparateur</p>
                <p className="font-semibold">{topPreparer.preparer_name}</p>
                <p className="text-sm text-muted-foreground">
                  {topPreparer.total_prepared} colis · durée moy. {fmtDuration(topPreparer.avg_duration_seconds)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-[Space_Grotesk] flex items-center gap-2">
              <PackageCheck size={16} />
              Performance par préparateur
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-muted-foreground" size={24} />
              </div>
            ) : perfs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <PackageCheck className="mx-auto mb-2 h-8 w-8 opacity-30" />
                <p className="text-sm">Aucune préparation enregistrée pour le moment.</p>
                <p className="text-xs mt-1">Les statistiques apparaîtront dès que vos préparateurs commenceront à utiliser l'espace de travail.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Préparateur</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Durée moy.</TableHead>
                    <TableHead className="text-right">Art./commande</TableHead>
                    <TableHead className="text-right">Auj.</TableHead>
                    <TableHead className="text-right">7 jours</TableHead>
                    <TableHead className="text-right">Dernier colis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perfs
                    .sort((a, b) => b.total_prepared - a.total_prepared)
                    .map((p) => (
                      <TableRow key={p.preparer_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-[10px] bg-amber-500/10 text-amber-600">
                                {(p.preparer_name || "P").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium leading-none">{p.preparer_name}</p>
                              <p className="text-xs text-muted-foreground">{p.preparer_email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Progress
                            value={(p.total_prepared / maxPrepared) * 100}
                            className="w-20 h-1.5"
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">
                          {p.total_prepared}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          <span className="flex items-center justify-end gap-1">
                            <Clock size={12} />
                            {fmtDuration(p.avg_duration_seconds)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {p.avg_items_per_order != null ? Math.round(p.avg_items_per_order) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="text-[11px] tabular-nums">
                            {p.prepared_last_24h}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {p.prepared_last_7d}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {p.last_completed_at
                            ? formatDistanceToNow(new Date(p.last_completed_at), { addSuffix: true, locale: fr })
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
