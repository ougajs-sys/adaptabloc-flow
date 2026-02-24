import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { modulesRegistry, type ModuleDefinition, type ModuleTier } from "@/lib/modules-registry";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, RotateCcw, DollarSign } from "lucide-react";

interface PriceOverride {
  module_id: string;
  price: number;
}

const tierColors: Record<ModuleTier, string> = {
  free: "default",
  tier1: "secondary",
  tier2: "outline",
  tier3: "destructive",
};

export default function SuperAdminPricing() {
  const { toast } = useToast();
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [editedPrices, setEditedPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | ModuleTier>("all");

  // Load existing price overrides
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("module_pricing")
        .select("module_id, price");
      if (data) {
        const map: Record<string, number> = {};
        data.forEach((r: any) => { map[r.module_id] = r.price; });
        setOverrides(map);
      }
    };
    load();
  }, []);

  const fcfaToEur = (fcfa: number) => (fcfa / 655.957).toFixed(2);

  const getEffectivePrice = (mod: ModuleDefinition): number => {
    if (editedPrices[mod.id] !== undefined) return parseInt(editedPrices[mod.id]) || 0;
    if (overrides[mod.id] !== undefined) return overrides[mod.id];
    return mod.price;
  };

  const hasChanges = Object.keys(editedPrices).length > 0;

  const filteredModules = filter === "all"
    ? modulesRegistry
    : modulesRegistry.filter((m) => m.tier === filter);

  const handlePriceChange = (moduleId: string, value: string) => {
    // Only allow numbers
    if (value && !/^\d*$/.test(value)) return;
    setEditedPrices((prev) => ({ ...prev, [moduleId]: value }));
  };

  const handleReset = (moduleId: string) => {
    const original = modulesRegistry.find((m) => m.id === moduleId);
    if (original) {
      setEditedPrices((prev) => ({ ...prev, [moduleId]: String(original.price) }));
    }
  };

  const handleSaveAll = async () => {
    if (!hasChanges) return;
    setSaving(true);

    try {
      const upserts = Object.entries(editedPrices).map(([module_id, priceStr]) => ({
        module_id,
        price: parseInt(priceStr) || 0,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("module_pricing")
        .upsert(upserts, { onConflict: "module_id" });

      if (error) throw error;

      // Update local overrides
      const newOverrides = { ...overrides };
      upserts.forEach((u) => { newOverrides[u.module_id] = u.price; });
      setOverrides(newOverrides);
      setEditedPrices({});

      toast({ title: "Tarifs mis à jour", description: `${upserts.length} prix modifié(s) avec succès.` });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const totalRevenuePotential = modulesRegistry
    .filter((m) => m.tier !== "free")
    .reduce((sum, m) => sum + getEffectivePrice(m), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tarification des modules</h2>
          <p className="text-sm text-muted-foreground">
            Modifiez les prix des modules et services. Les changements s'appliquent aux nouveaux abonnements.
          </p>
        </div>
        <Button onClick={handleSaveAll} disabled={!hasChanges || saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Enregistrement..." : "Sauvegarder les modifications"}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Modules payants</CardDescription>
            <CardTitle className="text-2xl">
              {modulesRegistry.filter((m) => m.tier !== "free").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenu potentiel / boutique</CardDescription>
            <CardTitle className="text-2xl">
              {totalRevenuePotential.toLocaleString()} FCFA
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Modifications en attente</CardDescription>
            <CardTitle className="text-2xl">
              {Object.keys(editedPrices).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "free", "tier1", "tier2", "tier3"] as const).map((t) => (
          <Button
            key={t}
            variant={filter === t ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(t)}
          >
            {t === "all" ? "Tous" : t === "free" ? "Gratuit" : t.toUpperCase()}
          </Button>
        ))}
      </div>

      {/* Pricing table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Module</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Disponible</TableHead>
                <TableHead>Prix original (FCFA)</TableHead>
                <TableHead>Prix actuel (FCFA)</TableHead>
                <TableHead>EUR</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModules.map((m) => {
                const effectivePrice = getEffectivePrice(m);
                const isEdited = editedPrices[m.id] !== undefined;
                const isOverridden = overrides[m.id] !== undefined && overrides[m.id] !== m.price;
                const isFree = m.tier === "free";

                return (
                  <TableRow key={m.id} className={isEdited ? "bg-accent/30" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <m.icon className="h-4 w-4 text-muted-foreground" />
                        {m.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.category}</TableCell>
                    <TableCell>
                      <Badge variant={tierColors[m.tier] as any}>
                        {m.tier === "free" ? "Gratuit" : m.tier.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.available ? "default" : "secondary"}>
                        {m.available ? "Oui" : "Non"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.price === 0 ? "Gratuit" : `${m.price.toLocaleString()}`}
                    </TableCell>
                    <TableCell>
                      {isFree ? (
                        <span className="text-sm text-muted-foreground">Gratuit</span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Input
                            type="text"
                            value={editedPrices[m.id] ?? String(overrides[m.id] ?? m.price)}
                            onChange={(e) => handlePriceChange(m.id, e.target.value)}
                            className={`w-24 h-8 text-sm ${isEdited ? "border-primary" : isOverridden ? "border-accent-foreground/50" : ""}`}
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {effectivePrice === 0 ? "—" : `${fcfaToEur(effectivePrice)} €`}
                    </TableCell>
                    <TableCell>
                      {!isFree && (isEdited || isOverridden) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReset(m.id)}
                          title="Réinitialiser au prix par défaut"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
