import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/contexts/ModulesContext";
import { useNavigate } from "react-router-dom";
import {
  Lock, Loader2, Store, ShoppingCart, Users, TrendingUp,
  CheckCircle2, ArrowRight, RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserStore {
  store_id: string;
  store_name: string;
  store_slug: string;
  is_active: boolean;
  joined_at: string;
}

interface StoreSnapshot {
  orders_today: number;
  orders_pending: number;
  revenue_today: number;
  team_count: number;
}

// ── Store card ─────────────────────────────────────────────────────────────────

function StoreCard({
  store,
  isCurrent,
  onSwitch,
  isSwitching,
}: {
  store: UserStore;
  isCurrent: boolean;
  onSwitch: () => void;
  isSwitching: boolean;
}) {
  const { data: snapshot, isLoading } = useQuery<StoreSnapshot>({
    queryKey: ["store-snapshot", store.store_id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_store_snapshot" as any, {
        p_store_id: store.store_id,
      });
      if (error) throw error;
      return (data?.[0] || { orders_today: 0, orders_pending: 0, revenue_today: 0, team_count: 0 }) as StoreSnapshot;
    },
    refetchInterval: 60_000,
  });

  return (
    <Card className={`transition-all ${isCurrent ? "border-primary/50 shadow-sm bg-primary/5" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${isCurrent ? "bg-primary/20" : "bg-muted"}`}>
              <Store size={18} className={isCurrent ? "text-primary" : "text-muted-foreground"} />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{store.store_name}</CardTitle>
              <p className="text-xs text-muted-foreground font-mono">/{store.store_slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isCurrent && (
              <Badge className="text-[10px] gap-1" variant="default">
                <CheckCircle2 size={10} /> Active
              </Badge>
            )}
            {!store.is_active && (
              <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Metrics grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/50 p-2.5 text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <ShoppingCart size={11} /> Commandes auj.
              </p>
              <p className="text-lg font-bold font-[Space_Grotesk] text-blue-500">
                {snapshot?.orders_today ?? 0}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5 text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <RefreshCw size={11} /> En attente
              </p>
              <p className="text-lg font-bold font-[Space_Grotesk] text-orange-500">
                {snapshot?.orders_pending ?? 0}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5 text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <TrendingUp size={11} /> CA auj.
              </p>
              <p className="text-lg font-bold font-[Space_Grotesk] text-emerald-500">
                {(snapshot?.revenue_today ?? 0).toLocaleString("fr-FR")} F
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5 text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Users size={11} /> Équipe
              </p>
              <p className="text-lg font-bold font-[Space_Grotesk]">
                {snapshot?.team_count ?? 0}
              </p>
            </div>
          </div>
        )}

        {/* Switch button */}
        {!isCurrent && (
          <Button
            variant="outline"
            className="w-full gap-2 text-sm"
            onClick={onSwitch}
            disabled={isSwitching}
          >
            {isSwitching ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ArrowRight size={14} />
            )}
            Basculer vers cette boutique
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function MultiStoreOverview() {
  const { user, refreshProfile } = useAuth();
  const { hasModule, isLoading: modulesLoading } = useModules();
  const navigate = useNavigate();
  const { toast } = useToast();

  const moduleEnabled = hasModule("multi_store");

  const { data: stores = [], isLoading } = useQuery<UserStore[]>({
    queryKey: ["user-stores", user?.id],
    enabled: !!user?.id && moduleEnabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_stores" as any);
      if (error) throw error;
      return (data || []) as UserStore[];
    },
  });

  const switchStore = useMutation({
    mutationFn: async (storeId: string) => {
      const { error } = await supabase.rpc("switch_active_store" as any, {
        p_store_id: storeId,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile();
      toast({ title: "Boutique changée", description: "Vous êtes maintenant sur la nouvelle boutique." });
      navigate("/dashboard");
    },
    onError: (err: any) =>
      toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  if (modulesLoading) {
    return (
      <DashboardLayout title="Mes boutiques">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </DashboardLayout>
    );
  }

  if (!moduleEnabled) {
    return (
      <DashboardLayout title="Mes boutiques" subtitle="Module Multi-boutiques">
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Lock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold mb-1">Module non activé</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Activez le module <span className="font-medium">Multi-boutiques</span> pour gérer plusieurs boutiques depuis un seul tableau de bord.
            </p>
            <Button onClick={() => navigate("/dashboard/modules")}>Voir les modules</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const totalOrdersToday = 0;

  return (
    <DashboardLayout
      title="Mes boutiques"
      subtitle="Vue d'ensemble et changement de boutique active"
    >
      <div className="space-y-5">
        {/* Header info */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {stores.length} boutique{stores.length > 1 ? "s" : ""} administrée{stores.length > 1 ? "s" : ""}
          </p>
          <Badge variant="outline" className="text-xs gap-1">
            <CheckCircle2 size={12} className="text-primary" />
            Active : {stores.find((s) => s.store_id === user?.store_id)?.store_name || "—"}
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : stores.length <= 1 ? (
          <Card className="border-dashed">
            <CardContent className="py-14 text-center">
              <Store className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium mb-1">Vous n'avez qu'une seule boutique</p>
              <p className="text-sm text-muted-foreground">
                Pour gérer plusieurs boutiques, créez une nouvelle boutique via l'onboarding ou demandez à être ajouté comme admin d'une autre boutique.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.map((store) => (
              <StoreCard
                key={store.store_id}
                store={store}
                isCurrent={store.store_id === user?.store_id}
                onSwitch={() => switchStore.mutate(store.store_id)}
                isSwitching={switchStore.isPending && switchStore.variables === store.store_id}
              />
            ))}
          </div>
        )}

        {/* Help note */}
        <p className="text-xs text-muted-foreground text-center">
          Pour ajouter une boutique à votre compte, terminez l'onboarding sur un nouveau compte ou demandez à un admin de vous inviter.
        </p>
      </div>
    </DashboardLayout>
  );
}
