import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  Phone,
  Truck,
  Clock,
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Tableau de bord",
    description: "Vue d'ensemble de votre activité avec KPIs essentiels.",
  },
  {
    icon: ShoppingCart,
    title: "Pipeline de commandes",
    description: "Kanban temps réel : nouveau → confirmé → préparation → livré.",
  },
  {
    icon: Users,
    title: "Base clients",
    description: "Historique d'achat, segmentation, fidélité.",
  },
  {
    icon: MessageSquare,
    title: "Campagnes",
    description: "SMS, WhatsApp et email avec ciblage.",
  },
  {
    icon: Package,
    title: "Stock & produits",
    description: "Variantes, alertes de stock, photos.",
  },
  {
    icon: TrendingUp,
    title: "Statistiques",
    description: "Taux de conversion, panier moyen, performance équipe.",
  },
];

export const DashboardPreview = () => {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/3 w-[700px] h-[500px] bg-primary/8 rounded-full blur-[140px]" />
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14 max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-semibold mb-4">
            <LayoutDashboard size={12} />
            Interface complète
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground font-[Space_Grotesk] mb-4 leading-tight">
            Une plateforme,{" "}
            <span className="bg-gradient-to-r from-primary via-[hsl(280,80%,55%)] to-accent bg-clip-text text-transparent">
              tout votre business
            </span>
          </h2>
          <p className="text-base lg:text-lg text-muted-foreground">
            Plus besoin de jongler entre 10 outils. Tout est centralisé,
            synchronisé et accessible depuis n'importe quel appareil.
          </p>
        </motion.div>

        {/* Big mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative max-w-6xl mx-auto"
        >
          {/* Glow */}
          <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-[hsl(280,80%,55%)]/15 to-accent/20 rounded-3xl blur-3xl -z-10" />

          {/* Main window with sidebar + content */}
          <div className="relative rounded-2xl border border-border/60 bg-card/90 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/50 bg-muted/40">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-[hsl(38,95%,55%)]/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
              <span className="ml-3 text-xs text-muted-foreground font-mono truncate">
                ma-boutique.intramate.app
              </span>
              <div className="ml-auto flex items-center gap-2">
                <div className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[9px] font-semibold">
                  ● En ligne
                </div>
              </div>
            </div>

            {/* Body: sidebar + main */}
            <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr] min-h-[420px]">
              {/* Sidebar */}
              <div className="border-r border-border/40 bg-muted/20 p-3 space-y-1">
                <div className="flex items-center gap-2 px-2 py-1.5 mb-3">
                  <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-[10px] font-[Space_Grotesk]">
                      IM
                    </span>
                  </div>
                  <span className="text-xs font-bold font-[Space_Grotesk] text-foreground">
                    Intra<span className="text-primary">mate</span>
                  </span>
                </div>
                {[
                  { icon: LayoutDashboard, label: "Tableau de bord", active: true },
                  { icon: ShoppingCart, label: "Commandes", badge: "12" },
                  { icon: Users, label: "Clients" },
                  { icon: Package, label: "Produits" },
                  { icon: Truck, label: "Livraisons" },
                  { icon: MessageSquare, label: "Campagnes" },
                  { icon: TrendingUp, label: "Statistiques" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs ${
                      item.active
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    <item.icon size={12} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[8px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Main */}
              <div className="p-4 sm:p-6 space-y-4 overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold font-[Space_Grotesk] text-foreground">
                      Tableau de bord
                    </h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Aujourd'hui · 28 avril 2026
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Clock size={11} />
                    Mis à jour il y a 2 sec
                  </div>
                </div>

                {/* KPIs row */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Aujourd'hui", value: "47", delta: "+12", color: "primary" },
                    { label: "À confirmer", value: "12", delta: "", color: "amber" },
                    { label: "En route", value: "8", delta: "", color: "accent" },
                    { label: "CA jour", value: "584K", delta: "+24%", color: "primary" },
                  ].map((k) => (
                    <div
                      key={k.label}
                      className="rounded-lg border border-border/40 bg-background/60 p-2"
                    >
                      <p className="text-[9px] text-muted-foreground truncate">{k.label}</p>
                      <p className="text-sm sm:text-base font-bold text-foreground font-[Space_Grotesk] truncate">
                        {k.value}
                      </p>
                      {k.delta && (
                        <p className="text-[8px] text-accent font-semibold">{k.delta}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pipeline kanban mini */}
                <div className="rounded-lg border border-border/40 bg-background/60 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-foreground">Pipeline aujourd'hui</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { name: "Nouveau", count: 5, color: "bg-muted/40 text-muted-foreground" },
                      { name: "Caller", count: 12, color: "bg-primary/15 text-primary" },
                      { name: "Préparation", count: 8, color: "bg-[hsl(38,95%,55%)]/15 text-[hsl(38,95%,55%)]" },
                      { name: "Livraison", count: 15, color: "bg-accent/15 text-accent" },
                    ].map((col, i) => (
                      <motion.div
                        key={col.name}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className={`rounded p-2 ${col.color} border border-current/10`}
                      >
                        <p className="text-[9px] font-semibold mb-1 truncate">{col.name}</p>
                        <p className="text-base font-bold font-[Space_Grotesk]">{col.count}</p>
                        <div className="space-y-0.5 mt-1">
                          {[1, 2].map((b) => (
                            <div key={b} className="h-1 rounded bg-current/30" />
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Chart */}
                <div className="rounded-lg border border-border/40 bg-background/60 p-3 hidden sm:block">
                  <p className="text-xs font-semibold text-foreground mb-2">
                    Revenus 30 derniers jours
                  </p>
                  <svg viewBox="0 0 400 80" className="w-full h-16">
                    <defs>
                      <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <motion.path
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      d="M0,60 C40,55 80,40 120,42 C160,44 200,30 240,25 C280,20 320,15 360,10 L400,8 L400,80 L0,80 Z"
                      fill="url(#chart-grad)"
                    />
                    <motion.path
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      d="M0,60 C40,55 80,40 120,42 C160,44 200,30 240,25 C280,20 320,15 360,10 L400,8"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Floating cards */}
          <motion.div
            animate={{ y: [-3, 3, -3] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="hidden lg:flex absolute -right-8 top-32 items-center gap-2 rounded-xl border border-border/60 bg-card shadow-xl px-3 py-2.5"
          >
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
              <Phone size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-foreground">Appel sortant</p>
              <p className="text-[9px] text-muted-foreground">Awa K. · 2 min</p>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [3, -3, 3] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="hidden lg:flex absolute -left-8 bottom-32 items-center gap-2 rounded-xl border border-accent/40 bg-card shadow-xl px-3 py-2.5"
          >
            <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center">
              <CheckCircle2 size={14} className="text-accent" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-foreground">Paiement reçu</p>
              <p className="text-[9px] text-muted-foreground">+12 500 F · OM</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Feature grid below mockup */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-16 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-4 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <f.icon size={18} className="text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
