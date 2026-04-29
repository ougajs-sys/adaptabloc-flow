import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { modulesRegistry } from "@/lib/modules-registry";

const floatingBricks = modulesRegistry.filter((m) =>
  ["dashboard", "orders_basic", "campaigns", "geo_tracking", "ai_assistant", "loyalty", "delivery_basic", "stock_auto"].includes(m.id)
);

export const CTASection = () => {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="relative max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-primary via-[hsl(280,80%,55%)] to-accent p-10 lg:p-16 text-center overflow-hidden">
          {/* Radial overlays */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_60%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" />

          {/* Animated grid lines */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Floating module bricks */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {floatingBricks.map((mod, i) => (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0.15, 0.3, 0.15],
                  y: [0, -12, 0],
                  x: [0, i % 2 === 0 ? 6 : -6, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 4 + i * 0.5,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
                className="absolute"
                style={{
                  top: `${10 + ((i * 17) % 75)}%`,
                  left: `${5 + ((i * 23) % 90)}%`,
                }}
              >
                <div className="px-3 py-2 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-medium flex items-center gap-1.5">
                  <mod.icon size={12} />
                  {mod.name}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm text-white text-xs font-semibold mb-6">
              <Sparkles size={12} />
              Démarrez en 10 minutes
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[Space_Grotesk] mb-4 leading-tight">
              Votre commerce mérite mieux
              <br />
              qu'un cahier ou Excel.
            </h2>
            <p className="text-white/90 text-base lg:text-lg mb-8 max-w-xl mx-auto">
              Rejoignez les 340+ marchands africains qui gèrent leur business en
              temps réel avec Intramate. 14 jours gratuits, sans carte bancaire.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  asChild
                  className="text-base px-8 h-12 rounded-xl bg-white hover:bg-white/95 text-primary font-bold shadow-xl"
                >
                  <Link to="/login" className="flex items-center gap-2">
                    Démarrer gratuitement
                    <ArrowRight size={18} />
                  </Link>
                </Button>
              </motion.div>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="text-base px-8 h-12 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-white/40"
              >
                <Link to="/admin/login">Accès équipe</Link>
              </Button>
            </div>

            <p className="text-white/70 text-xs mt-6">
              ✓ Sans carte bancaire · ✓ Sans engagement · ✓ Annulable à tout moment
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
