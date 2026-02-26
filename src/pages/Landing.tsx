import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Puzzle, Zap, Users, ChevronDown } from "lucide-react";
import { useState } from "react";
import { modulesRegistry } from "@/lib/modules-registry";
import { FloatingBrick } from "@/components/landing/FloatingBrick";

const highlights = [
  {
    id: "modules",
    icon: Puzzle,
    title: "Choisissez vos modules",
    desc: "Seulement ce dont vous avez besoin. Rien de plus.",
  },
  {
    id: "speed",
    icon: Zap,
    title: "Prêt en 10 minutes",
    desc: "Inscrivez-vous, configurez, lancez. C'est tout.",
  },
  {
    id: "team",
    icon: Users,
    title: "Toute votre équipe",
    desc: "Invitez callers, préparateurs, livreurs. Chacun voit ce qu'il doit voir.",
  },
];

const previewModules = modulesRegistry.filter(m =>
  ["orders_basic", "customers_basic", "delivery_basic", "campaigns", "dashboard", "stock_auto"].includes(m.id)
);

const Landing = () => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── HERO: Full viewport, single clear message ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Subtle gradient bg */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[160px]" />
          <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground font-[Space_Grotesk] mb-6 max-w-3xl mx-auto leading-[1.1]">
              Gérez votre commerce
              <br />
              <span className="bg-gradient-to-r from-primary via-[hsl(280,80%,55%)] to-accent bg-clip-text text-transparent">
                sans prise de tête
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed">
              Un seul outil. Vos commandes, clients, livraisons et équipe. Configuré en 10 minutes.
            </p>

            {/* ── ANIMATED CTA ── */}
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 0 0 hsl(var(--primary) / 0)",
                  "0 0 0 12px hsl(var(--primary) / 0.15)",
                  "0 0 0 0 hsl(var(--primary) / 0)",
                ],
              }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="inline-block rounded-xl"
            >
              <Button
                size="lg"
                asChild
                className="text-lg px-10 h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/25 font-semibold"
              >
                <Link to="/login" className="flex items-center gap-3">
                  Essayer maintenant, c'est facile
                  <ArrowRight size={20} />
                </Link>
              </Button>
            </motion.div>

            <p className="text-sm text-muted-foreground mt-4">
              Gratuit 14 jours · Sans carte bancaire
            </p>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <ChevronDown size={24} className="text-muted-foreground/50" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── DISCOVER SECTION: 3 clickable cards ── */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm font-semibold text-primary uppercase tracking-wider mb-10"
          >
            Pourquoi Intramate ?
          </motion.p>

          <div className="space-y-4">
            {highlights.map((h, i) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <button
                  onClick={() => setExpanded(expanded === h.id ? null : h.id)}
                  className="w-full text-left p-5 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <h.icon size={22} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-foreground">{h.title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{h.desc}</p>
                    </div>
                    <motion.div
                      animate={{ rotate: expanded === h.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={18} className="text-muted-foreground" />
                    </motion.div>
                  </div>

                  {/* Expandable content */}
                  {expanded === h.id && h.id === "modules" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 pt-4 border-t border-border/30"
                    >
                      <div className="flex flex-wrap gap-2">
                        {previewModules.map((mod, j) => (
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
                      <p className="text-xs text-muted-foreground mt-3">
                        + {modulesRegistry.length - previewModules.length} autres modules disponibles
                      </p>
                    </motion.div>
                  )}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Second CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                size="lg"
                asChild
                className="text-base px-8 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              >
                <Link to="/login" className="flex items-center gap-2">
                  Commencer gratuitement
                  <ArrowRight size={18} />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
