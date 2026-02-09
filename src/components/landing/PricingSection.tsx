import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Starter",
    price: "15 000",
    period: "/mois",
    description: "Pour démarrer votre activité",
    features: [
      "Base gratuite incluse",
      "3 modules Niveau 1",
      "1 module Niveau 2",
      "100 commandes/mois",
      "3 utilisateurs",
    ],
    cta: "Commencer",
    popular: false,
  },
  {
    name: "Business",
    price: "40 000",
    period: "/mois",
    description: "Pour les entreprises en croissance",
    features: [
      "Tout de Starter +",
      "Modules Niveau 1 illimités",
      "3 modules Niveau 2",
      "1 module Niveau 3",
      "500 commandes/mois",
      "10 utilisateurs",
    ],
    cta: "Essai gratuit",
    popular: true,
  },
  {
    name: "Premium",
    price: "80 000",
    period: "/mois",
    description: "Pour les leaders du marché",
    features: [
      "Tous les modules inclus",
      "Utilisateurs illimités",
      "Commandes illimitées",
      "Support prioritaire",
      "Formation incluse",
      "API complète",
    ],
    cta: "Contacter",
    popular: false,
  },
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Tarifs</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-[Space_Grotesk]">
            Des prix transparents en FCFA
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Pas de frais cachés. Payez uniquement ce que vous utilisez.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-6 rounded-xl border bg-card flex flex-col ${
                plan.popular
                  ? "border-primary shadow-xl shadow-primary/10 scale-[1.02]"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  Populaire
                </div>
              )}
              <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-foreground font-[Space_Grotesk]">{plan.price}</span>
                <span className="text-muted-foreground text-sm"> FCFA{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check size={16} className="text-accent mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={plan.popular ? "default" : "outline"}
                className="w-full"
              >
                <Link to="/onboarding">{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
