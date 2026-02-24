import { motion, useScroll, useTransform } from "framer-motion";
import { UserPlus, Puzzle, Rocket } from "lucide-react";
import { useRef } from "react";
import { FloatingBrick } from "./FloatingBrick";
import { modulesRegistry } from "@/lib/modules-registry";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Inscrivez-vous",
    description: "Créez votre compte en 2 minutes via Facebook. Choisissez votre secteur d'activité.",
  },
  {
    icon: Puzzle,
    step: "02",
    title: "Choisissez vos briques",
    description: "Sélectionnez uniquement les modules dont vous avez besoin. Le prix se calcule en temps réel.",
    showBricks: true,
  },
  {
    icon: Rocket,
    step: "03",
    title: "Lancez-vous !",
    description: "Votre système est prêt. Invitez votre équipe et commencez à gérer sans effort.",
  },
];

const demoBricks = modulesRegistry.filter(m =>
  ["orders_basic", "customers_basic", "campaigns", "delivery_basic"].includes(m.id)
);

export const HowItWorksSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 0.8], ["0%", "100%"]);

  return (
    <section id="how-it-works" className="py-20 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Comment ça marche</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-[Space_Grotesk]">
            Opérationnel en 10 minutes
          </h2>
        </motion.div>

        <div ref={containerRef} className="relative max-w-2xl mx-auto">
          {/* Animated vertical line */}
          <div className="absolute left-8 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-border">
            <motion.div
              style={{ height: lineHeight }}
              className="w-full bg-gradient-to-b from-primary to-accent rounded-full"
            />
          </div>

          <div className="space-y-16">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className={`relative flex items-start gap-6 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                } flex-row`}
              >
                {/* Step node */}
                <div className="relative z-10 shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-card border border-border shadow-lg shadow-primary/5 flex items-center justify-center">
                    <s.icon size={24} className="text-primary" />
                  </div>
                </div>

                {/* Content */}
                <div className={`flex-1 ${i % 2 !== 0 ? "md:text-right" : ""}`}>
                  <span className="text-xs font-bold text-primary tracking-widest">{s.step}</span>
                  <h3 className="text-xl font-semibold text-foreground mt-1 mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{s.description}</p>

                  {/* Mini bricks demo for step 2 */}
                  {s.showBricks && (
                    <div className={`flex flex-wrap gap-2 ${i % 2 !== 0 ? "md:justify-end" : ""}`}>
                      {demoBricks.map((mod, j) => (
                        <FloatingBrick
                          key={mod.id}
                          icon={mod.icon}
                          name={mod.name}
                          tier={mod.tier}
                          index={j}
                          size="sm"
                        />
                      ))}
                    </div>
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
