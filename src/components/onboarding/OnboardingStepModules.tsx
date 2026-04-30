import { OnboardingData } from "@/pages/Onboarding";
import { Button } from "@/components/ui/button";
import { Check, Lock } from "lucide-react";
import { modulesRegistry, tierLabels, tierPriceRanges } from "@/lib/modules-registry";

interface Props {
  data: OnboardingData;
  updateData: (d: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const OnboardingStepModules = ({ data, updateData, onNext, onBack }: Props) => {
  const toggleModule = (id: string) => {
    const current = data.modules;
    updateData({
      modules: current.includes(id) ? current.filter((m) => m !== id) : [...current, id],
    });
  };

  const tiers = ["free", "tier1", "tier2", "tier3"] as const;

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground font-[Space_Grotesk] mb-2">
        Choisissez vos modules
      </h2>
      <p className="text-muted-foreground mb-8">
        Activez uniquement ce dont vous avez besoin. Vous pourrez en ajouter plus tard.
      </p>

      <div className="space-y-6">
        {tiers.map((tier) => {
          const modules = modulesRegistry.filter((m) => m.tier === tier);
          if (modules.length === 0) return null;
          const isFree = tier === "free";
          const heading = isFree
            ? "Inclus gratuitement"
            : `${tierLabels[tier]} — ${tierPriceRanges[tier]}`;

          return (
            <div key={tier}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {heading}
              </h3>
              <div className="grid gap-2">
                {modules.map((m) => {
                  const selected = isFree || data.modules.includes(m.id);
                  const disabled = isFree || !m.available;
                  return (
                    <button
                      key={m.id}
                      disabled={disabled}
                      onClick={() => !disabled && toggleModule(m.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-all ${
                        selected
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-card hover:border-primary/20"
                      } ${disabled ? "opacity-80 cursor-default" : "cursor-pointer"}`}
                    >
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                          selected ? "bg-primary" : "border border-border"
                        }`}
                      >
                        {selected && <Check size={12} className="text-primary-foreground" />}
                      </div>
                      <span className="text-foreground flex-1">{m.name}</span>
                      {isFree && (
                        <span className="text-xs text-accent font-medium">Gratuit</span>
                      )}
                      {!isFree && !m.available && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock size={11} /> Bientôt
                        </span>
                      )}
                      {!isFree && m.available && (
                        <span className="text-xs text-muted-foreground">
                          {m.price.toLocaleString("fr-FR")} FCFA/mois
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Retour
        </Button>
        <Button onClick={onNext} className="px-8">
          Continuer
        </Button>
      </div>
    </div>
  );
};
