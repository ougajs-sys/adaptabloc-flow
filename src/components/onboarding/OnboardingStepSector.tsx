import { OnboardingData } from "@/pages/Onboarding";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Truck, Shirt, Apple, Sparkles, Wand2 } from "lucide-react";
import { motion } from "framer-motion";

const sectors = [
  {
    id: "ecommerce",
    label: "E-commerce & Retail",
    description: "Gestion complète : Commandes, Appelants & Livraison",
    icon: ShoppingBag,
  },
  {
    id: "transport",
    label: "Transport & Logistique",
    description: "Flotte mixte, Dispatch & Tracking en temps réel",
    icon: Truck,
  },
  {
    id: "mode",
    label: "Prêt-à-porter / Mode",
    description: "Gestion tailles, couleurs & collections",
    icon: Shirt,
  },
  {
    id: "epicerie",
    label: "Épicerie / Frais",
    description: "Péremptions, poids & fournisseurs",
    icon: Apple,
  },
  {
    id: "beaute",
    label: "Institut Beauté / Spa",
    description: "Rendez-vous, soins & fidélité client",
    icon: Sparkles,
  },
  {
    id: "autre",
    label: "Autre",
    description: "Créez votre système sur mesure avec notre IA",
    icon: Wand2,
  },
];

interface Props {
  data: OnboardingData;
  updateData: (d: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export const OnboardingStepSector = ({ data, updateData, onNext }: Props) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground font-[Space_Grotesk] mb-2">
        Quel est votre secteur ?
      </h2>
      <p className="text-muted-foreground mb-8">
        Choisissez votre secteur, l'IA déploie les modules adaptés à vos processus.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sectors.map((s, i) => {
          const selected = data.sector === s.id;
          return (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.07, ease: "easeOut" }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => updateData({ sector: s.id })}
              className={`flex flex-col items-start gap-3 p-4 rounded-xl border text-left transition-colors min-h-[140px] ${
                selected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selected ? "bg-primary/15" : "bg-muted"
                }`}
              >
                <s.icon
                  size={20}
                  className={selected ? "text-primary" : "text-muted-foreground"}
                />
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground block leading-tight">
                  {s.label}
                </span>
                <span className="text-xs text-muted-foreground mt-1 block leading-relaxed">
                  {s.description}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={onNext} disabled={!data.sector} className="px-8">
          Continuer
        </Button>
      </div>
    </div>
  );
};
