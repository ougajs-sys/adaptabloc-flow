import { motion } from "framer-motion";
import { modulesRegistry, tierLabels, type ModuleTier } from "@/lib/modules-registry";
import { FloatingBrick } from "./FloatingBrick";

const tierOrder: ModuleTier[] = ["free", "tier1", "tier2", "tier3"];

const tierColorDot: Record<ModuleTier, string> = {
  free: "bg-accent",
  tier1: "bg-primary/60",
  tier2: "bg-primary",
  tier3: "bg-[hsl(280,80%,55%)]",
};

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Modules</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-[Space_Grotesk]">
            {modulesRegistry.length} modules disponibles
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Composez votre système idéal. Chaque brique s'ajoute en un clic.
          </p>
        </motion.div>

        {/* Tier legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-10">
          {tierOrder.map(tier => (
            <div key={tier} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className={`w-3 h-3 rounded-full ${tierColorDot[tier]}`} />
              {tierLabels[tier]}
            </div>
          ))}
        </div>

        {/* Interactive bricks grid */}
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {modulesRegistry.map((mod, i) => (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className="group relative"
              >
                <FloatingBrick
                  icon={mod.icon}
                  name={mod.name}
                  tier={mod.tier}
                  index={i}
                  size="md"
                />
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-card border border-border shadow-xl text-xs text-muted-foreground max-w-[200px] text-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-normal">
                  {mod.description}
                  {!mod.available && (
                    <span className="block mt-1 text-primary font-medium">Bientôt disponible</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
