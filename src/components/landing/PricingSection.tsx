import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Starter",
    icon: Zap,
    price: "Gratuit",
    priceSuffix: "",
    description: "Parfait pour démarrer et tester votre activité.",
    features: [
      "5 modules essentiels inclus",
      "1 admin + 1 caller + 1 prép. + 1 livreur",
      "Commandes & clients illimités",
      "Pipeline temps réel",
      "Support communautaire",
    ],
    cta: "Démarrer gratuitement",
    popular: false,
    color: "border-border/60 bg-card/60",
  },
  {
    name: "Business",
    icon: Sparkles,
    price: "15 000 – 40 000",
    priceSuffix: " FCFA / mois",
    description: "Pour la croissance : équipe étendue, campagnes, embed forms.",
    features: [
      "Tout de Starter",
      "+3 callers, +3 préparateurs, +3 livreurs",
      "Campagnes SMS & WhatsApp",
      "Formulaire embarqué (iframe)",
      "Historique clients complet",
      "Support email prioritaire",
    ],
    cta: "Essai gratuit 14 jours",
    popular: true,
    color: "border-primary/50 bg-gradient-to-br from-primary/5 via-card/80 to-accent/5",
  },
  {
    name: "Premium",
    icon: Crown,
    price: "Sur devis",
    priceSuffix: "",
    description: "Volume élevé, multi-boutiques, géolocalisation, IA.",
    features: [
      "Tout de Business",
      "Géolocalisation temps réel",
      "Automatisations IA",
      "Multi-boutiques",
      "API REST complète",
      "Assistant IA conversationnel",
      "Account manager dédié",
    ],
    cta: "Nous contacter",
    popular: false,
    color: "border-[hsl(280,80%,55%)]/40 bg-card/60",
  },
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/8 rounded-full blur-[140px]" />
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14 max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
            <Sparkles size={12} />
            Tarifs transparents
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground font-[Space_Grotesk] mb-4 leading-tight">
            Payez ce que vous{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              utilisez réellement
            </span>
          </h2>
          <p className="text-base lg:text-lg text-muted-foreground">
            Pas d'engagement. Pas de frais cachés. Activez ou désactivez les
            modules à tout moment.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl border-2 p-6 backdrop-blur-xl flex flex-col ${plan.color} ${
                plan.popular ? "shadow-2xl shadow-primary/20 lg:scale-105" : "shadow-md"
              }`}
            >
              {plan.popular && (
                <>
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/30 via-transparent to-accent/30 -z-10 blur-md" />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-bold shadow-lg whitespace-nowrap">
                    ⭐ Le plus choisi
                  </div>
                </>
              )}

              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  plan.popular
                    ? "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <plan.icon size={22} />
              </div>

              <h3 className="text-xl font-bold text-foreground font-[Space_Grotesk]">
                {plan.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 mb-5">{plan.description}</p>

              <div className="mb-6">
                <span className="text-3xl lg:text-4xl font-bold text-foreground font-[Space_Grotesk]">
                  {plan.price}
                </span>
                {plan.priceSuffix && (
                  <span className="text-muted-foreground text-sm">{plan.priceSuffix}</span>
                )}
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-foreground/90"
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        plan.popular ? "bg-accent/20" : "bg-accent/15"
                      }`}
                    >
                      <Check size={11} className="text-accent" strokeWidth={3} />
                    </div>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={plan.popular ? "default" : "outline"}
                className={`w-full h-11 ${
                  plan.popular
                    ? "bg-gradient-to-r from-primary to-[hsl(280,80%,55%)] shadow-lg shadow-primary/25 text-primary-foreground"
                    : "backdrop-blur-sm"
                }`}
              >
                <Link to="/login">{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Module pricing reference */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 max-w-4xl mx-auto rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-6"
        >
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground text-center mb-4">
            Tarifs des modules à la carte
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            {[
              { tier: "Gratuit", price: "0 FCFA", desc: "Modules de base" },
              { tier: "Niveau 1", price: "2 000 – 5 000", desc: "Personnalisation" },
              { tier: "Niveau 2", price: "5 000 – 10 000", desc: "Croissance" },
              { tier: "Niveau 3", price: "10 000 – 15 000", desc: "Avancé / IA" },
            ].map((tier, i) => (
              <div
                key={tier.tier}
                className={`rounded-xl p-3 ${
                  i === 0
                    ? "bg-accent/10 border border-accent/30"
                    : i === 3
                    ? "bg-[hsl(280,80%,55%)]/10 border border-[hsl(280,80%,55%)]/30"
                    : "bg-primary/5 border border-primary/20"
                }`}
              >
                <p className="text-xs font-bold text-foreground mb-1">{tier.tier}</p>
                <p className="text-base font-bold font-[Space_Grotesk] text-foreground">
                  {tier.price}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  FCFA / mois · {tier.desc}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
