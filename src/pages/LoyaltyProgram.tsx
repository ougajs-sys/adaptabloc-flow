import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/contexts/ModulesContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Lock, Plus, Pencil, Trash2, Award, Settings2, Loader2,
  Star, Gift, TrendingUp, Users,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface LoyaltyConfig {
  id?: string;
  store_id: string;
  points_per_1000_xof: number;
  welcome_bonus: number;
  is_active: boolean;
}

interface LoyaltyTier {
  id: string;
  store_id: string;
  name: string;
  min_points: number;
  color: string;
  benefits: string | null;
}

interface LoyaltyBalance {
  customer_id: string;
  current_balance: number;
  total_earned: number;
  total_redeemed: number;
  last_transaction_at: string | null;
  customer_name?: string;
  customer_phone?: string;
}

// ── Tier defaults ──────────────────────────────────────────────────────────────

const DEFAULT_TIERS = [
  { name: "Bronze", min_points: 0, color: "#cd7f32", benefits: "Accès au programme de fidélité" },
  { name: "Argent", min_points: 500, color: "#9ca3af", benefits: "5% de réduction sur votre prochain achat" },
  { name: "Or", min_points: 2000, color: "#f59e0b", benefits: "10% de réduction · Livraison prioritaire" },
  { name: "Platine", min_points: 5000, color: "#6366f1", benefits: "15% de réduction · Livraison offerte · Support dédié" },
];

// ── Main component ─────────────────────────────────────────────────────────────

export default function LoyaltyProgram() {
  const { user } = useAuth();
  const storeId = user?.store_id;
  const { hasModule, isLoading: modulesLoading } = useModules();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editingTier, setEditingTier] = useState<Partial<LoyaltyTier> | null>(null);
  const [manualCustomerId, setManualCustomerId] = useState("");
  const [manualPoints, setManualPoints] = useState("");
  const [manualNote, setManualNote] = useState("");

  const moduleEnabled = hasModule("loyalty");

  // ── Config ───────────────────────────────────────────────────────────────────

  const { data: config, isLoading: configLoading } = useQuery<LoyaltyConfig | null>({
    queryKey: ["loyalty-config", storeId],
    enabled: !!storeId && moduleEnabled,
    queryFn: async () => {
      const { data, error } = await (supabase.from("loyalty_config" as any) as any)
        .select("*")
        .eq("store_id", storeId!)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return (data as LoyaltyConfig) ?? null;
    },
  });

  const [configDraft, setConfigDraft] = useState<Partial<LoyaltyConfig>>({});
  const effectiveConfig: Partial<LoyaltyConfig> = {
    points_per_1000_xof: 10,
    welcome_bonus: 50,
    is_active: true,
    ...config,
    ...configDraft,
  };

  const saveConfig = useMutation({
    mutationFn: async (cfg: Partial<LoyaltyConfig>) => {
      const payload = { store_id: storeId, ...cfg };
      const q = config?.id
        ? (supabase.from("loyalty_config" as any) as any).update(payload).eq("id", config.id)
        : (supabase.from("loyalty_config" as any) as any).upsert(payload, { onConflict: "store_id" });
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-config", storeId] });
      setConfigDraft({});
      toast({ title: "Configuration enregistrée" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  // ── Tiers ─────────────────────────────────────────────────────────────────────

  const { data: tiers = [], isLoading: tiersLoading } = useQuery<LoyaltyTier[]>({
    queryKey: ["loyalty-tiers", storeId],
    enabled: !!storeId && moduleEnabled,
    queryFn: async () => {
      const { data, error } = await (supabase.from("loyalty_tiers" as any) as any)
        .select("*")
        .eq("store_id", storeId!)
        .order("min_points", { ascending: true });
      if (error) throw error;
      return (data || []) as LoyaltyTier[];
    },
  });

  const upsertTier = useMutation({
    mutationFn: async (t: Partial<LoyaltyTier>) => {
      const payload = { store_id: storeId, name: t.name!, min_points: t.min_points ?? 0, color: t.color || "#6b7280", benefits: t.benefits || null };
      const q = t.id
        ? (supabase.from("loyalty_tiers" as any) as any).update(payload).eq("id", t.id)
        : (supabase.from("loyalty_tiers" as any) as any).insert(payload);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-tiers", storeId] });
      setEditingTier(null);
      toast({ title: "Palier enregistré" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const removeTier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("loyalty_tiers" as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["loyalty-tiers", storeId] }),
  });

  const seedDefaultTiers = useMutation({
    mutationFn: async () => {
      const rows = DEFAULT_TIERS.map((t) => ({ ...t, store_id: storeId }));
      const { error } = await (supabase.from("loyalty_tiers" as any) as any).insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-tiers", storeId] });
      toast({ title: "Paliers par défaut créés" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  // ── Balances (top customers) ──────────────────────────────────────────────────

  const { data: balances = [], isLoading: balancesLoading } = useQuery<LoyaltyBalance[]>({
    queryKey: ["loyalty-balances", storeId],
    enabled: !!storeId && moduleEnabled,
    queryFn: async () => {
      const { data, error } = await (supabase.from("loyalty_balances" as any) as any)
        .select("*")
        .eq("store_id", storeId!)
        .order("current_balance", { ascending: false })
        .limit(50);
      if (error) throw error;

      const ids: string[] = (data || []).map((b: any) => b.customer_id);
      if (!ids.length) return [];

      const { data: customers } = await supabase
        .from("customers")
        .select("id, name, phone")
        .in("id", ids);

      return (data || []).map((b: any) => ({
        ...b,
        customer_name: (customers || []).find((c: any) => c.id === b.customer_id)?.name || "Client",
        customer_phone: (customers || []).find((c: any) => c.id === b.customer_id)?.phone || "",
      })) as LoyaltyBalance[];
    },
    refetchInterval: 30_000,
  });

  // ── Manual point adjustment ───────────────────────────────────────────────────

  const manualAdjust = useMutation({
    mutationFn: async ({ customerId, points, notes }: { customerId: string; points: number; notes?: string }) => {
      const { error } = await (supabase.from("loyalty_transactions" as any) as any).insert({
        store_id: storeId,
        customer_id: customerId,
        type: "manual",
        points,
        notes: notes || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-balances", storeId] });
      setManualCustomerId("");
      setManualPoints("");
      setManualNote("");
      toast({ title: "Points ajustés" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  // ── Tier lookup helper ────────────────────────────────────────────────────────

  function getTierForPoints(points: number): LoyaltyTier | null {
    if (!tiers.length) return null;
    return tiers
      .filter((t) => points >= t.min_points)
      .sort((a, b) => b.min_points - a.min_points)[0] ?? null;
  }

  if (modulesLoading) {
    return <DashboardLayout title="Programme fidélité"><p className="text-sm text-muted-foreground">Chargement...</p></DashboardLayout>;
  }

  if (!moduleEnabled) {
    return (
      <DashboardLayout title="Programme fidélité" subtitle="Module Fidélité">
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Lock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold mb-1">Module non activé</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Activez le module <span className="font-medium">Programme fidélité</span> pour fidéliser vos clients avec des points et des paliers.
            </p>
            <Button onClick={() => navigate("/dashboard/modules")}>Voir les modules</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const totalMembers = balances.filter((b) => b.current_balance > 0).length;
  const totalPoints = balances.reduce((s, b) => s + (b.current_balance || 0), 0);

  return (
    <DashboardLayout title="Programme fidélité" subtitle="Fidélisez vos clients avec des points et des récompenses">
      <div className="space-y-6">

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Membres</p>
              </div>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-violet-500">{totalMembers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Star size={16} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Points circulants</p>
              </div>
              <p className="text-2xl font-bold font-[Space_Grotesk]">{totalPoints.toLocaleString("fr-FR")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Taux = {effectiveConfig.points_per_1000_xof} pts/1000 F</p>
              </div>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-amber-500">
                {effectiveConfig.points_per_1000_xof ?? 10} pts
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="members">
          <TabsList>
            <TabsTrigger value="members"><Users size={14} className="mr-1" /> Membres</TabsTrigger>
            <TabsTrigger value="tiers"><Award size={14} className="mr-1" /> Paliers</TabsTrigger>
            <TabsTrigger value="settings"><Settings2 size={14} className="mr-1" /> Configuration</TabsTrigger>
          </TabsList>

          {/* ── Members tab ─────────────────────────────────────────────────── */}
          <TabsContent value="members" className="space-y-4">
            {/* Manual adjustment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Gift size={16} /> Ajustement manuel de points
                </CardTitle>
                <CardDescription className="text-xs">
                  Entrez l'ID du client (visible dans la fiche client) et le nombre de points à ajouter ou retirer (négatif = retrait).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Input
                    placeholder="ID client (UUID)"
                    value={manualCustomerId}
                    onChange={(e) => setManualCustomerId(e.target.value)}
                    className="flex-1 min-w-40 text-sm font-mono"
                  />
                  <Input
                    placeholder="Points (ex: 100 ou -50)"
                    type="number"
                    value={manualPoints}
                    onChange={(e) => setManualPoints(e.target.value)}
                    className="w-40 text-sm"
                  />
                  <Input
                    placeholder="Note (optionnel)"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    className="flex-1 min-w-40 text-sm"
                  />
                  <Button
                    onClick={() =>
                      manualAdjust.mutate({
                        customerId: manualCustomerId,
                        points: parseInt(manualPoints),
                        notes: manualNote || undefined,
                      })
                    }
                    disabled={!manualCustomerId || !manualPoints || manualAdjust.isPending}
                    size="sm"
                  >
                    {manualAdjust.isPending ? <Loader2 size={14} className="animate-spin" /> : "Appliquer"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Top membres par points</CardTitle>
              </CardHeader>
              <CardContent>
                {balancesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-muted-foreground" size={20} />
                  </div>
                ) : balances.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Award className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    <p className="text-sm">Aucun membre pour l'instant.</p>
                    <p className="text-xs mt-1">Les points sont attribués automatiquement lorsqu'une commande est livrée.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Palier</TableHead>
                        <TableHead className="text-right">Solde</TableHead>
                        <TableHead className="text-right">Gagné</TableHead>
                        <TableHead className="text-right">Dépensé</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balances.slice(0, 20).map((b, idx) => {
                        const tier = getTierForPoints(b.current_balance || 0);
                        return (
                          <TableRow key={b.customer_id}>
                            <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                            <TableCell>
                              <p className="text-sm font-medium">{b.customer_name}</p>
                              <p className="text-xs text-muted-foreground">{b.customer_phone}</p>
                            </TableCell>
                            <TableCell>
                              {tier ? (
                                <Badge
                                  className="text-[10px] text-white border-0"
                                  style={{ backgroundColor: tier.color }}
                                >
                                  {tier.name}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-bold font-mono text-sm text-violet-600 dark:text-violet-400">
                              {(b.current_balance || 0).toLocaleString("fr-FR")}
                            </TableCell>
                            <TableCell className="text-right text-sm text-emerald-600">
                              +{(b.total_earned || 0).toLocaleString("fr-FR")}
                            </TableCell>
                            <TableCell className="text-right text-sm text-red-500">
                              -{(b.total_redeemed || 0).toLocaleString("fr-FR")}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tiers tab ───────────────────────────────────────────────────── */}
          <TabsContent value="tiers" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {tiers.length} palier{tiers.length > 1 ? "s" : ""} configuré{tiers.length > 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                {tiers.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => seedDefaultTiers.mutate()}
                    disabled={seedDefaultTiers.isPending}
                  >
                    {seedDefaultTiers.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                    Paliers par défaut
                  </Button>
                )}
                <Dialog open={!!editingTier} onOpenChange={(o) => !o && setEditingTier(null)}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setEditingTier({ color: "#6b7280", min_points: 0 })}>
                      <Plus className="mr-1 h-4 w-4" /> Nouveau palier
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingTier?.id ? "Modifier" : "Nouveau"} palier</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label>Nom</Label>
                        <Input
                          value={editingTier?.name || ""}
                          onChange={(e) => setEditingTier((s) => ({ ...s, name: e.target.value }))}
                          placeholder="ex: Bronze, Argent, Or..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Points minimum</Label>
                          <Input
                            type="number"
                            value={editingTier?.min_points ?? 0}
                            onChange={(e) => setEditingTier((s) => ({ ...s, min_points: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div>
                          <Label>Couleur (hex)</Label>
                          <div className="flex gap-2 items-center">
                            <Input
                              type="color"
                              value={editingTier?.color || "#6b7280"}
                              onChange={(e) => setEditingTier((s) => ({ ...s, color: e.target.value }))}
                              className="w-12 h-9 p-1 cursor-pointer"
                            />
                            <Input
                              value={editingTier?.color || "#6b7280"}
                              onChange={(e) => setEditingTier((s) => ({ ...s, color: e.target.value }))}
                              className="flex-1 font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label>Avantages (optionnel)</Label>
                        <Textarea
                          value={editingTier?.benefits || ""}
                          onChange={(e) => setEditingTier((s) => ({ ...s, benefits: e.target.value }))}
                          placeholder="Description des avantages du palier..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditingTier(null)}>Annuler</Button>
                      <Button
                        onClick={() => editingTier && upsertTier.mutate(editingTier)}
                        disabled={!editingTier?.name || upsertTier.isPending}
                      >
                        Enregistrer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {tiersLoading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : tiers.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Award className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Aucun palier. Créez des paliers ou utilisez les paliers par défaut (Bronze → Platine).
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {tiers.map((t) => (
                  <Card key={t.id}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <div
                        className="h-10 w-10 rounded-lg shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: `${t.color}20` }}
                      >
                        <Award size={20} style={{ color: t.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{t.name}</span>
                          <Badge className="text-[10px] text-white border-0" style={{ backgroundColor: t.color }}>
                            {t.min_points.toLocaleString("fr-FR")} pts min
                          </Badge>
                        </div>
                        {t.benefits && <p className="text-xs text-muted-foreground mt-0.5">{t.benefits}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingTier(t)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => { if (confirm(`Supprimer "${t.name}" ?`)) removeTier.mutate(t.id); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Settings tab ────────────────────────────────────────────────── */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuration du programme</CardTitle>
                <CardDescription>
                  Les points sont attribués automatiquement quand une commande passe au statut "Livrée".
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {configLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 size={16} className="animate-spin" /> Chargement...
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Points par 1 000 FCFA dépensés</Label>
                        <Input
                          type="number"
                          min={1}
                          value={effectiveConfig.points_per_1000_xof ?? 10}
                          onChange={(e) => setConfigDraft((d) => ({ ...d, points_per_1000_xof: parseInt(e.target.value) || 10 }))}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Ex : 10 pts/1000 F → commande 5 000 F = 50 pts
                        </p>
                      </div>
                      <div>
                        <Label>Bonus de bienvenue (pts)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={effectiveConfig.welcome_bonus ?? 50}
                          onChange={(e) => setConfigDraft((d) => ({ ...d, welcome_bonus: parseInt(e.target.value) || 0 }))}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Points offerts sur la première commande livrée.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={effectiveConfig.is_active ?? true}
                        onCheckedChange={(v) => setConfigDraft((d) => ({ ...d, is_active: v }))}
                      />
                      <div>
                        <Label className="font-normal">Programme actif</Label>
                        <p className="text-xs text-muted-foreground">Désactiver arrête l'attribution automatique de points.</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => saveConfig.mutate(effectiveConfig as LoyaltyConfig)}
                      disabled={saveConfig.isPending || Object.keys(configDraft).length === 0}
                    >
                      {saveConfig.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                      Enregistrer la configuration
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
