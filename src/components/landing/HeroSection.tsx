import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-6">
            <Zap size={14} />
            14 jours d'essai gratuit — sans carte bancaire
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 font-[Space_Grotesk]">
            Gérez votre business{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              sans effort
            </span>
          </h1>

          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
            Le logiciel modulaire qui s'adapte à VOTRE commerce. Choisissez vos modules, configurez en 10 minutes, et concentrez-vous sur ce qui compte : vendre.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button size="lg" asChild className="text-base px-8 h-12 bg-primary hover:bg-primary/90">
              <Link to="/onboarding">
                Démarrer gratuitement
                <ArrowRight size={18} className="ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8 h-12">
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

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="rounded-xl border border-border bg-card shadow-2xl shadow-primary/5 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-[hsl(38,95%,55%)]/60" />
              <div className="w-3 h-3 rounded-full bg-accent/60" />
              <span className="ml-3 text-xs text-muted-foreground">dashboard.easyflow.app</span>
            </div>
            <div className="p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Commandes", value: "147", change: "+12%" },
                { label: "CA Jour", value: "485K", change: "+8%" },
                { label: "Clients actifs", value: "1,204", change: "+23%" },
                { label: "Livraisons", value: "89", change: "+5%" },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground font-[Space_Grotesk]">{stat.value}</p>
                  <p className="text-xs text-accent font-medium">{stat.change}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
