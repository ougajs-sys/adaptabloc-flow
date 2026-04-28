import { motion } from "framer-motion";
import {
  ShoppingCart,
  Phone,
  Package,
  Truck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const stages = [
  {
    role: "Caller",
    name: "Awa",
    avatar: "A",
    color: "primary",
    icon: Phone,
    title: "Confirme la commande",
    description: "Reçoit la commande, appelle le client, valide l'adresse.",
    metrics: { label: "Confirmations / jour", value: "84" },
    bgClass: "bg-primary/10",
    borderClass: "border-primary/30",
    textClass: "text-primary",
    avatarBg: "bg-gradient-to-br from-primary to-[hsl(280,80%,55%)]",
  },
  {
    role: "Préparateur",
    name: "Mamadou",
    avatar: "M",
    color: "amber",
    icon: Package,
    title: "Prépare le colis",
    description: "Ramasse les articles, scanne, conditionne, signale prêt.",
    metrics: { label: "Colis prêts / jour", value: "76" },
    bgClass: "bg-[hsl(38,95%,55%)]/10",
    borderClass: "border-[hsl(38,95%,55%)]/30",
    textClass: "text-[hsl(38,95%,55%)]",
    avatarBg: "bg-gradient-to-br from-[hsl(38,95%,55%)] to-[hsl(20,95%,55%)]",
  },
  {
    role: "Livreur",
    name: "Fatou",
    avatar: "F",
    color: "accent",
    icon: Truck,
    title: "Livre au client",
    description: "Récupère, navigue avec Google Maps, encaisse, marque livré.",
    metrics: { label: "Livraisons / jour", value: "68" },
    bgClass: "bg-accent/10",
    borderClass: "border-accent/30",
    textClass: "text-accent",
    avatarBg: "bg-gradient-to-br from-accent to-[hsl(168,80%,35%)]",
  },
];

export const WorkflowSection = () => {
  return (
    <section
      id="workflow"
      className="py-20 lg:py-28 relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
            <Truck size={12} />
            Workflow temps réel
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground font-[Space_Grotesk] mb-4 leading-tight">
            Chaque membre voit{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              uniquement ce qu'il doit faire
            </span>
          </h2>
          <p className="text-base lg:text-lg text-muted-foreground">
            De la commande à la livraison, votre équipe avance en synchronisation.
            Pas de WhatsApp désordonné, pas de feuilles Excel perdues.
          </p>
        </motion.div>

        {/* Pipeline visualization */}
        <div className="relative max-w-6xl mx-auto">
          {/* Order start */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex justify-center mb-12"
          >
            <div className="relative inline-flex items-center gap-3 px-5 py-3 rounded-2xl border border-border/60 bg-card shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <ShoppingCart size={18} className="text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Nouvelle commande
                </p>
                <p className="text-sm font-bold text-foreground font-mono">
                  CMD-2841 · 12 500 F
                </p>
              </div>
              {/* Pulse */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
              </span>
            </div>
          </motion.div>

          {/* Stages grid */}
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-4 relative">
            {/* Connecting line for desktop */}
            <div className="hidden lg:block absolute top-1/2 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-primary via-[hsl(38,95%,55%)] to-accent -translate-y-1/2 -z-10">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.3 }}
                style={{ originX: 0 }}
                className="w-full h-full bg-gradient-to-r from-primary via-[hsl(38,95%,55%)] to-accent"
              />
            </div>

            {stages.map((stage, i) => (
              <motion.div
                key={stage.role}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative"
              >
                {/* Card */}
                <div
                  className={`relative rounded-2xl border-2 ${stage.borderClass} ${stage.bgClass} backdrop-blur-sm p-5 hover:scale-[1.02] transition-transform duration-300 h-full`}
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl ${stage.avatarBg} flex items-center justify-center shadow-lg text-white font-bold text-base`}
                    >
                      {stage.avatar}
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${stage.textClass}`}>
                        {stage.role}
                      </p>
                      <p className="text-sm font-semibold text-foreground">{stage.name}</p>
                    </div>
                    <div className={`ml-auto w-8 h-8 rounded-lg bg-card/80 backdrop-blur-sm flex items-center justify-center`}>
                      <stage.icon size={15} className={stage.textClass} />
                    </div>
                  </div>

                  {/* Order card mockup */}
                  <div className="rounded-lg bg-card/95 border border-border/40 p-3 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        CMD-2841
                      </span>
                      <span className={`text-[10px] font-semibold ${stage.textClass} flex items-center gap-1`}>
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full ${stage.textClass.replace("text-", "bg-")}`}
                        />
                        {stage.title.split(" ")[0]}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-foreground">Awa Koné</p>
                    <p className="text-[10px] text-muted-foreground">
                      Cocody · 2 articles · 12 500 F
                    </p>
                  </div>

                  {/* Description */}
                  <h3 className="text-base font-bold text-foreground mb-1">{stage.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {stage.description}
                  </p>

                  {/* Metric */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/40">
                    <span className="text-[10px] text-muted-foreground">{stage.metrics.label}</span>
                    <span className={`text-base font-bold ${stage.textClass} font-[Space_Grotesk]`}>
                      {stage.metrics.value}
                    </span>
                  </div>
                </div>

                {/* Arrow between stages (mobile vertical, desktop horizontal) */}
                {i < stages.length - 1 && (
                  <div className="lg:absolute lg:top-1/2 lg:-right-3 lg:-translate-y-1/2 lg:z-10 flex items-center justify-center my-4 lg:my-0">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.2 + 0.4 }}
                      className="w-8 h-8 rounded-full bg-card border-2 border-border shadow-md flex items-center justify-center rotate-90 lg:rotate-0"
                    >
                      <ArrowRight size={14} className="text-muted-foreground" />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Final delivery confirmation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="flex justify-center mt-12"
          >
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border-2 border-accent/40 bg-accent/10 shadow-lg shadow-accent/20">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <CheckCircle2 size={18} className="text-accent-foreground" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-wider text-accent font-bold">
                  Livré ✓
                </p>
                <p className="text-sm font-bold text-foreground">
                  Encaissé · Client satisfait
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
