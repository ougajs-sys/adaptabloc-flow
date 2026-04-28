import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  ShoppingCart,
  Users,
  Truck,
  CheckCircle2,
  Phone,
  Package,
} from "lucide-react";

// Mini animated bar chart used inside the dashboard mockup
const chartData = [42, 68, 51, 89, 73, 95, 110, 128];

export const HeroSection = () => {
  return (
    <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
      {/* ── Atmospheric background ── */}
      <div className="absolute inset-0 -z-10">
        {/* Mesh gradient blobs */}
        <div className="absolute -top-40 left-1/4 w-[700px] h-[700px] bg-primary/20 rounded-full blur-[140px]" />
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-[hsl(280,80%,55%)]/10 rounded-full blur-[100px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage:
              "radial-gradient(ellipse at top, black 30%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at top, black 30%, transparent 70%)",
          }}
        />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
          {/* ── Text column ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm text-primary text-xs font-semibold mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              Nouveau · Disponible en Côte d'Ivoire, Sénégal, Cameroun
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-foreground font-[Space_Grotesk] mb-6 leading-[1.05]">
              Le système qui{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-primary via-[hsl(280,80%,55%)] to-accent bg-clip-text text-transparent">
                  fait grandir
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                >
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.8, duration: 1.2 }}
                    d="M3 8C50 3 150 3 297 8"
                    stroke="hsl(var(--accent))"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <br />
              votre commerce
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Commandes, livraisons, équipe, campagnes, paiements mobiles —
              <span className="text-foreground font-medium"> un seul outil modulaire</span>{" "}
              conçu pour les marchands africains.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start mb-8">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  asChild
                  className="text-base px-7 h-12 rounded-xl bg-gradient-to-r from-primary to-[hsl(280,80%,55%)] hover:opacity-95 text-primary-foreground shadow-xl shadow-primary/30 font-semibold w-full sm:w-auto"
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
                className="text-base px-7 h-12 rounded-xl bg-card/50 backdrop-blur-sm border-border/60 w-full sm:w-auto"
              >
                <a href="#workflow" className="flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  Voir la démo
                </a>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 justify-center lg:justify-start text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-accent" />
                <span>14 jours gratuits</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-accent" />
                <span>Sans carte bancaire</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-accent" />
                <span>Setup en 10 min</span>
              </div>
            </div>
          </motion.div>

          {/* ── Visual column: animated dashboard mockup ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="relative"
          >
            {/* Background glow */}
            <div className="absolute -inset-8 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 rounded-3xl blur-2xl -z-10" />

            {/* Dashboard window */}
            <div className="relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/10 overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/60 bg-muted/30">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-[hsl(38,95%,55%)]/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
                <span className="ml-3 text-xs text-muted-foreground font-mono truncate">
                  ma-boutique.intramate.app/dashboard
                </span>
              </div>

              {/* Dashboard content */}
              <div className="p-5 space-y-4">
                {/* KPI cards */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      icon: ShoppingCart,
                      label: "Commandes",
                      value: "847",
                      delta: "+12%",
                      color: "text-primary",
                      bg: "bg-primary/10",
                    },
                    {
                      icon: Users,
                      label: "Clients",
                      value: "1 240",
                      delta: "+8%",
                      color: "text-accent",
                      bg: "bg-accent/10",
                    },
                    {
                      icon: TrendingUp,
                      label: "CA / mois",
                      value: "4.2M",
                      delta: "+24%",
                      color: "text-[hsl(280,80%,55%)]",
                      bg: "bg-[hsl(280,80%,55%)]/10",
                    },
                  ].map((kpi, i) => (
                    <motion.div
                      key={kpi.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="rounded-lg border border-border/40 bg-background/60 p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className={`w-7 h-7 rounded-md ${kpi.bg} flex items-center justify-center`}>
                          <kpi.icon size={14} className={kpi.color} />
                        </div>
                        <span className="text-[10px] text-accent font-semibold">{kpi.delta}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                      <p className="text-base font-bold text-foreground font-[Space_Grotesk]">
                        {kpi.value}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Mini chart */}
                <div className="rounded-lg border border-border/40 bg-background/60 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-foreground">
                      Revenus 7 derniers jours
                    </p>
                    <span className="text-[10px] text-accent font-medium">↗ 24% vs semaine dernière</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-20">
                    {chartData.map((v, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${(v / 128) * 100}%` }}
                        transition={{ delay: 0.8 + i * 0.06, duration: 0.5 }}
                        className={`flex-1 rounded-t-sm bg-gradient-to-t ${
                          i === chartData.length - 1
                            ? "from-primary to-accent"
                            : "from-primary/40 to-primary/60"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Recent orders mini-list */}
                <div className="rounded-lg border border-border/40 bg-background/60 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-foreground">Commandes en cours</p>
                    <span className="text-[10px] text-muted-foreground">temps réel</span>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { id: "CMD-2841", name: "Awa K.", status: "Confirmée", icon: Phone, color: "text-primary" },
                      { id: "CMD-2842", name: "Mamadou S.", status: "Préparation", icon: Package, color: "text-[hsl(38,95%,55%)]" },
                      { id: "CMD-2843", name: "Fatou D.", status: "En route", icon: Truck, color: "text-accent" },
                    ].map((o, i) => (
                      <motion.div
                        key={o.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.3 + i * 0.15 }}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="font-mono text-[10px] text-muted-foreground w-16">
                          {o.id}
                        </span>
                        <span className="flex-1 font-medium text-foreground truncate">
                          {o.name}
                        </span>
                        <div className={`flex items-center gap-1 ${o.color}`}>
                          <o.icon size={11} />
                          <span className="text-[10px] font-medium">{o.status}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating notification cards */}
            <motion.div
              initial={{ opacity: 0, x: 20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 1.5 }}
              className="absolute -right-3 top-20 hidden md:block"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-xl px-3 py-2.5 flex items-center gap-2.5"
              >
                <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-accent" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Livraison réussie</p>
                  <p className="text-[10px] text-muted-foreground">Awa K. · 12 500 F</p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 1.7 }}
              className="absolute -left-4 bottom-24 hidden md:block"
            >
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-xl px-3 py-2.5 flex items-center gap-2.5"
              >
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">+24 nouvelles commandes</p>
                  <p className="text-[10px] text-muted-foreground">depuis ce matin</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
