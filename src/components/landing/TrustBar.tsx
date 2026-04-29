import { motion } from "framer-motion";
import { ShoppingBag, Sparkles, Shirt, Apple, Truck, Pill, Coffee, Wand2 } from "lucide-react";

// Sectors served by Intramate, displayed as visual badges
const sectors = [
  { icon: ShoppingBag, label: "E-commerce" },
  { icon: Truck, label: "Logistique" },
  { icon: Shirt, label: "Mode" },
  { icon: Apple, label: "Épicerie" },
  { icon: Sparkles, label: "Beauté" },
  { icon: Pill, label: "Pharmacie" },
  { icon: Coffee, label: "Restauration" },
  { icon: Wand2, label: "Sur-mesure" },
];

export const TrustBar = () => {
  return (
    <section className="py-12 lg:py-16 border-y border-border/40 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-8"
        >
          Conçu pour les commerces africains de tous secteurs
        </motion.p>

        <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4 max-w-4xl mx-auto">
          {sectors.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border/60 bg-card/80 backdrop-blur-sm hover:border-primary/40 hover:bg-card transition-colors cursor-default group"
            >
              <s.icon size={15} className="text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium text-foreground">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
