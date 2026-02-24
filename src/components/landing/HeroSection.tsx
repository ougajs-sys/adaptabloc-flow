import { Button } from "@/components/ui/button";
import { Zap, Shield, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { modulesRegistry } from "@/lib/modules-registry";
import { FloatingBrick } from "./FloatingBrick";

// Select a representative subset of modules for the hero animation
const heroModules = modulesRegistry.filter(m =>
  ["dashboard", "orders_basic", "customers_basic", "delivery_basic", "campaigns", "stock_auto", "loyalty", "geo_tracking", "embed_forms", "automations", "multi_store", "ai_assistant"].includes(m.id)
);

export const HeroSection = () => {
  return (
    <section className="relative pt-28 pb-20 overflow-hidden min-h-[90vh] flex items-center">
      {/* Premium gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[900px] h-[700px] bg-primary/12 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[500px] bg-accent/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[hsl(280,80%,55%)]/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm text-primary text-sm font-medium mb-6">
              <Zap size={14} />
              14 jours d'essai gratuit — sans carte bancaire
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 font-[Space_Grotesk]">
              Construisez{" "}
              <span className="bg-gradient-to-r from-primary via-[hsl(280,80%,55%)] to-accent bg-clip-text text-transparent">
                VOTRE système
              </span>
              <br />
              brique par brique
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
              Le logiciel modulaire qui s'adapte à VOTRE commerce. Choisissez vos modules, configurez en 10 minutes, et concentrez-vous sur ce qui compte : vendre.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Button
                size="lg"
                asChild
                className="text-base px-8 h-12 text-white border-0 backdrop-blur-sm shadow-lg shadow-[#1877F2]/25"
                style={{ backgroundColor: "#1877F2" }}
              >
                <Link to="/login" className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Commencer avec Facebook
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base px-8 h-12 backdrop-blur-sm bg-card/50 border-border/50">
                <a href="#how-it-works">Voir la démo</a>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-accent" />
                <span>Setup en 10 min</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-accent" />
                <span>+15% de productivité</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-accent" />
                <span>Zéro formation</span>
              </div>
            </div>
          </motion.div>

          {/* Animated bricks assembly */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="relative max-w-3xl mx-auto"
          >
            {/* Glass container for assembled bricks */}
            <div className="relative rounded-2xl border border-border/40 bg-card/30 backdrop-blur-xl p-8 shadow-2xl shadow-primary/5">
              {/* Browser dots */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-[hsl(38,95%,55%)]/60" />
                <div className="w-3 h-3 rounded-full bg-accent/60" />
                <span className="ml-3 text-xs text-muted-foreground font-mono">votre-systeme.intramate.app</span>
              </div>

              {/* Bricks grid */}
              <div className="flex flex-wrap gap-3 justify-center">
                {heroModules.map((mod, i) => (
                  <FloatingBrick
                    key={mod.id}
                    icon={mod.icon}
                    name={mod.name}
                    tier={mod.tier}
                    index={i}
                    size="sm"
                  />
                ))}
              </div>

              {/* Decorative floating particles */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 w-8 h-8 rounded-lg bg-primary/20 backdrop-blur-sm border border-primary/10"
              />
              <motion.div
                animate={{ y: [5, -5, 5] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute -bottom-3 -left-3 w-6 h-6 rounded-lg bg-accent/20 backdrop-blur-sm border border-accent/10"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
