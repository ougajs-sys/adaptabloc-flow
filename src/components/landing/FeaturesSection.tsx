import { Package, Users, Truck, BarChart3, MessageSquare, Settings2 } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Package,
    title: "Gestion Stock",
    description: "Multi-dépôts, variantes produits, alertes automatiques et rotation FIFO.",
  },
  {
    icon: Users,
    title: "Gestion Clients",
    description: "Base clients complète, segmentation avancée et programme fidélité.",
  },
  {
    icon: Truck,
    title: "Livraison & Suivi",
    description: "Zones tarifaires, affectation livreurs et tracking en temps réel.",
  },
  {
    icon: BarChart3,
    title: "Tableaux de Bord",
    description: "Statistiques en temps réel, rapports personnalisables et prédictions.",
  },
  {
    icon: MessageSquare,
    title: "Campagnes SMS/WhatsApp",
    description: "Relances automatiques, paniers abandonnés et promotions ciblées.",
  },
  {
    icon: Settings2,
    title: "100% Modulaire",
    description: "Activez uniquement les modules utiles. Payez ce que vous utilisez.",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Fonctionnalités</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-[Space_Grotesk]">
            Des modules qui s'adaptent à vous
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Construisez votre système idéal comme des briques LEGO. Pas de superflu, que l'essentiel.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon size={20} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
