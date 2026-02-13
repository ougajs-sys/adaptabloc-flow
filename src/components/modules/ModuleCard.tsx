import { type ModuleDefinition, tierLabels } from "@/lib/modules-registry";
import { useModules } from "@/contexts/ModulesContext";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { FREE_MODULE_IDS } from "@/lib/modules-registry";

interface ModuleCardProps {
  module: ModuleDefinition;
}

export function ModuleCard({ module }: ModuleCardProps) {
  const { hasModule, activateModule, deactivateModule } = useModules();
  const isActive = hasModule(module.id);
  const isFree = FREE_MODULE_IDS.includes(module.id);
  const Icon = module.icon;

  return (
    <Card className={`border transition-colors ${isActive ? "border-primary/40 bg-primary/5" : "border-border/60"}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isActive ? "bg-primary/15" : "bg-muted"}`}>
            <Icon size={20} className={isActive ? "text-primary" : "text-muted-foreground"} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium text-foreground truncate">{module.name}</h4>
              {isFree && (
                <Badge variant="secondary" className="text-[10px] shrink-0">Inclus</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{module.description}</p>
            {!isFree && (
              <p className="mt-1 text-xs font-medium text-primary">
                {module.price.toLocaleString("fr-FR")} FCFA/mois
              </p>
            )}
          </div>
          <Switch
            checked={isActive}
            disabled={isFree}
            onCheckedChange={(checked) => {
              if (checked) activateModule(module.id);
              else deactivateModule(module.id);
            }}
            className="shrink-0"
          />
        </div>
      </CardContent>
    </Card>
  );
}
