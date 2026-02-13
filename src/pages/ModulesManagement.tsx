import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ModuleCard } from "@/components/modules/ModuleCard";
import { useModules } from "@/contexts/ModulesContext";
import { modulesRegistry, getModulesByTier, tierPriceRanges, type ModuleTier } from "@/lib/modules-registry";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Package } from "lucide-react";

const tiers: ModuleTier[] = ["free", "tier1", "tier2", "tier3"];

const tierColors: Record<ModuleTier, string> = {
  free: "bg-accent/10 text-accent",
  tier1: "bg-primary/10 text-primary",
  tier2: "bg-primary/15 text-primary",
  tier3: "bg-primary/20 text-primary",
};

const ModulesManagement = () => {
  const { activeModules, monthlyPrice } = useModules();
  const paidActiveCount = activeModules.filter(
    (id) => !["dashboard", "orders_basic", "customers_basic", "delivery_basic"].includes(id)
  ).length;

  return (
    <DashboardLayout title="Mes Modules">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-primary" />
              <span className="text-sm text-muted-foreground">Coût mensuel</span>
            </div>
            <p className="text-2xl font-bold font-[Space_Grotesk] text-foreground">
              {monthlyPrice.toLocaleString("fr-FR")} <span className="text-sm font-normal text-muted-foreground">FCFA</span>
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Modules actifs</span>
            </div>
            <p className="text-2xl font-bold font-[Space_Grotesk] text-foreground">
              {activeModules.length} <span className="text-sm font-normal text-muted-foreground">/ {modulesRegistry.length}</span>
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Modules payants</span>
            </div>
            <p className="text-2xl font-bold font-[Space_Grotesk] text-foreground">
              {paidActiveCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modules by tier */}
      {tiers.map((tier) => {
        const modules = getModulesByTier(tier);
        if (modules.length === 0) return null;
        return (
          <div key={tier}>
            <div className="flex items-center gap-2 mb-3">
              <Badge className={`${tierColors[tier]} border-0 text-xs`}>
                {tierPriceRanges[tier]}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {modules.map((mod) => (
                <ModuleCard key={mod.id} module={mod} />
              ))}
            </div>
          </div>
        );
      })}
    </DashboardLayout>
  );
};

export default ModulesManagement;
