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
    <section id="pricing" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Tarifs</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-[Space_Grotesk]">
            Des prix transparents en FCFA
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Pas de frais cachés. Payez uniquement ce que vous utilisez.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-6 rounded-2xl flex flex-col backdrop-blur-xl border transition-all duration-300 ${
                plan.popular
                  ? "bg-card/80 border-primary/40 shadow-2xl shadow-primary/15 scale-[1.02]"
                  : "bg-card/50 border-border/50 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
              }`}
            >
              {plan.popular && (
                <>
                  {/* Glow effect */}
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/20 to-accent/10 -z-10 blur-sm" />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-semibold shadow-lg">
                    Populaire
                  </div>
                </>
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
                className={`w-full ${plan.popular ? "shadow-lg shadow-primary/20" : "backdrop-blur-sm"}`}
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
