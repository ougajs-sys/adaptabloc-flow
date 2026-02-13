import { getModuleById, tierLabels } from "@/lib/modules-registry";
import { useModules } from "@/contexts/ModulesContext";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";

interface UpgradePromptProps {
  moduleId: string;
  compact?: boolean;
}

export function UpgradePrompt({ moduleId, compact }: UpgradePromptProps) {
  const mod = getModuleById(moduleId);
  const { activateModule } = useModules();

  if (!mod) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
        <Lock size={14} className="text-muted-foreground shrink-0" />
        <span className="text-muted-foreground">{mod.name}</span>
        <Button variant="link" size="sm" className="ml-auto h-auto p-0 text-xs" onClick={() => activateModule(moduleId)}>
          Activer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Lock size={24} className="text-primary" />
      </div>
      <h3 className="mb-1 text-lg font-semibold font-[Space_Grotesk] text-foreground">
        {mod.name}
      </h3>
      <p className="mb-1 text-sm text-muted-foreground max-w-sm">
        {mod.description}
      </p>
      <p className="mb-4 text-xs text-muted-foreground">
        {tierLabels[mod.tier]} — {mod.price > 0 ? `${mod.price.toLocaleString("fr-FR")} FCFA/mois` : "Gratuit"}
      </p>
      <Button onClick={() => activateModule(moduleId)} className="gap-2">
        <Sparkles size={16} />
        Activer ce module
      </Button>
    </div>
  );
}
