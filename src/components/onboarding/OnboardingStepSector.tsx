import { OnboardingData } from "@/pages/Onboarding";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Truck, Shirt, Apple, Sparkles } from "lucide-react";

const sectors = [
  { id: "ecommerce", label: "E-commerce & Retail", icon: ShoppingBag },
  { id: "transport", label: "Transport & Logistique", icon: Truck },
  { id: "mode", label: "Prêt-à-porter / Mode", icon: Shirt },
  { id: "epicerie", label: "Épicerie / Frais", icon: Apple },
  { id: "beaute", label: "Institut Beauté / Spa", icon: Sparkles },
];

interface Props {
  data: OnboardingData;
  updateData: (d: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export const OnboardingStepSector = ({ data, updateData, onNext }: Props) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground font-[Space_Grotesk] mb-2">Quel est votre secteur ?</h2>
      <p className="text-muted-foreground mb-8">
        EasyFlow s'adapte à votre activité. Choisissez pour obtenir une configuration optimale.
      </p>

      <div className="grid gap-3">
        {sectors.map((s) => (
          <button
            key={s.id}
            onClick={() => updateData({ sector: s.id })}
            className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
              data.sector === s.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                data.sector === s.id ? "bg-primary/15" : "bg-muted"
              }`}
            >
              <s.icon size={20} className={data.sector === s.id ? "text-primary" : "text-muted-foreground"} />
            </div>
            <span className="font-medium text-foreground">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={onNext} disabled={!data.sector} className="px-8">
          Continuer
        </Button>
      </div>
    </div>
  );
};
