import { OnboardingData } from "@/pages/Onboarding";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const modulesByCategory = [
  {
    category: "Inclus gratuitement",
    free: true,
    modules: [
      { id: "dashboard", label: "Tableau de bord simple" },
      { id: "orders_basic", label: "Prise de commande basique" },
      { id: "customers_basic", label: "Base clients" },
      { id: "delivery_basic", label: "Suivi livraison simple" },
    ],
  },
  {
    category: "Niveau 1 — 2 000 à 5 000 FCFA/mois",
    free: false,
    modules: [
      { id: "custom_fields", label: "Champs personnalisés illimités" },
      { id: "custom_status", label: "Statuts personnalisés" },
      { id: "export", label: "Export Excel/PDF" },
      { id: "message_templates", label: "Templates de messages" },
      { id: "customer_history", label: "Historique clients" },
    ],
  },
  {
    category: "Niveau 2 — 5 000 à 10 000 FCFA/mois",
    free: false,
    modules: [
      { id: "stock_auto", label: "Gestion stock automatique" },
      { id: "multi_delivery", label: "Multi-livreurs" },
      { id: "segmentation", label: "Segmentation clients avancée" },
      { id: "campaigns", label: "Campagnes SMS/WhatsApp" },
      { id: "loyalty", label: "Programme fidélité" },
    ],
  },
  {
    category: "Niveau 3 — 10 000 à 15 000 FCFA/mois",
    free: false,
    modules: [
      { id: "geo_tracking", label: "Géolocalisation temps réel" },
      { id: "automations", label: "Automatisations IA" },
      { id: "api", label: "API complète" },
      { id: "multi_store", label: "Multi-boutiques" },
      { id: "ai_assistant", label: "Assistant IA conversationnel" },
    ],
  },
];

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

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground font-[Space_Grotesk] mb-2">
        Choisissez vos modules
      </h2>
      <p className="text-muted-foreground mb-8">
        Activez uniquement ce dont vous avez besoin. Vous pourrez en ajouter plus tard.
      </p>

      <div className="space-y-6">
        {modulesByCategory.map((cat) => (
          <div key={cat.category}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {cat.category}
            </h3>
            <div className="grid gap-2">
              {cat.modules.map((m) => {
                const selected = cat.free || data.modules.includes(m.id);
                return (
                  <button
                    key={m.id}
                    disabled={cat.free}
                    onClick={() => !cat.free && toggleModule(m.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-all ${
                      selected
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-card hover:border-primary/20"
                    } ${cat.free ? "opacity-80 cursor-default" : "cursor-pointer"}`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                        selected ? "bg-primary" : "border border-border"
                      }`}
                    >
                      {selected && <Check size={12} className="text-primary-foreground" />}
                    </div>
                    <span className="text-foreground">{m.label}</span>
                    {cat.free && (
                      <span className="ml-auto text-xs text-accent font-medium">Gratuit</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
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
