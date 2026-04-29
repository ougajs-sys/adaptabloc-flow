import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Store, LayoutGrid, Users, LayoutDashboard,
  Check, Phone, Package, Truck, ChevronRight,
  ShoppingBag, Sparkles, Shirt, Apple, MapPin,
  MessageCircle, Lock,
} from "lucide-react";

const STEP_DURATION = 4500;

const STEPS = [
  { id: 0, label: "Inscription", icon: User },
  { id: 1, label: "Boutique", icon: Store },
  { id: 2, label: "Modules", icon: LayoutGrid },
  { id: 3, label: "Équipe", icon: Users },
  { id: 4, label: "Workspaces", icon: LayoutDashboard },
];

const stepInfo = [
  {
    title: "Inscrivez-vous en 30 secondes",
    description:
      "Créez votre compte avec votre email ou WhatsApp. Aucune carte bancaire requise. Votre essai de 14 jours démarre immédiatement.",
  },
  {
    title: "Configurez votre boutique",
    description:
      "Donnez un nom à votre boutique, choisissez votre secteur et votre pays. L'IA active automatiquement les modules les plus adaptés.",
  },
  {
    title: "Activez uniquement ce dont vous avez besoin",
    description:
      "3 modules gratuits inclus pour démarrer. Ajoutez des modules payants à tout moment — sans engagement, sans frais cachés.",
  },
  {
    title: "Invitez votre équipe",
    description:
      "Envoyez des invitations par email ou SMS à vos callers, préparateurs et livreurs. Chaque rôle a des permissions distinctes.",
  },
  {
    title: "Chaque intervenant a son propre espace",
    description:
      "Le caller voit les commandes à confirmer. Le préparateur voit sa liste de colis. Le livreur voit sa tournée. Zéro confusion, zéro WhatsApp désordonné.",
  },
];

// ── Step screens ────────────────────────────────────────────────────────────

function StepSignup() {
  return (
    <div className="space-y-3">
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-[hsl(280,80%,55%)] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/30">
          <User size={20} className="text-white" />
        </div>
        <p className="text-sm font-bold text-foreground">Créez votre compte</p>
        <p className="text-[10px] text-muted-foreground">Gratuit · Sans carte bancaire</p>
      </div>

      {[
        { label: "Nom complet", value: "Koné Aïcha", Icon: User },
        { label: "Email ou WhatsApp", value: "aicha@maïmouna.ci", Icon: MessageCircle },
        { label: "Mot de passe", value: "••••••••••", Icon: Lock },
      ].map(({ label, value, Icon }) => (
        <div
          key={label}
          className="rounded-lg border border-border/60 bg-background/60 px-3 py-2"
        >
          <p className="text-[9px] text-muted-foreground mb-0.5">{label}</p>
          <div className="flex items-center gap-1.5">
            <Icon size={11} className="text-muted-foreground shrink-0" />
            <p className="text-xs font-medium text-foreground">{value}</p>
          </div>
        </div>
      ))}

      <div className="rounded-xl bg-gradient-to-r from-primary to-[hsl(280,80%,55%)] p-2.5 text-center text-white text-xs font-bold shadow-lg flex items-center justify-center gap-1.5">
        Continuer <ChevronRight size={14} />
      </div>
      <p className="text-[9px] text-center text-muted-foreground">
        ✓ Prêt en 30 s · ✓ Aucune carte requise
      </p>
    </div>
  );
}

function StepStore() {
  const sectors = [
    { label: "Mode & Vêtements", Icon: Shirt, selected: true },
    { label: "Alimentaire", Icon: Apple, selected: false },
    { label: "Beauté", Icon: Sparkles, selected: false },
    { label: "E-commerce", Icon: ShoppingBag, selected: false },
  ];

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[9px] text-muted-foreground mb-1.5">Nom de votre boutique</p>
        <div className="rounded-lg border-2 border-primary/40 bg-background/60 px-3 py-2 flex items-center gap-2">
          <Store size={12} className="text-primary shrink-0" />
          <p className="text-xs font-medium text-foreground flex-1">Maïmouna Boutique</p>
          <span className="text-primary text-sm animate-pulse">|</span>
        </div>
      </div>

      <div>
        <p className="text-[9px] text-muted-foreground mb-1.5">Secteur d'activité</p>
        <div className="grid grid-cols-2 gap-1.5">
          {sectors.map(({ label, Icon, selected }) => (
            <div
              key={label}
              className={`rounded-lg border p-2 flex items-center gap-1.5 text-[10px] font-medium transition-all ${
                selected
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border/40 bg-background/40 text-muted-foreground"
              }`}
            >
              <Icon size={11} />
              <span className="truncate">{label}</span>
              {selected && <Check size={10} className="ml-auto shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border/40 bg-background/60 px-3 py-2 flex items-center gap-2">
        <MapPin size={11} className="text-muted-foreground" />
        <span className="text-xs text-foreground font-medium">Côte d'Ivoire</span>
        <Check size={11} className="ml-auto text-accent" />
      </div>
    </div>
  );
}

function StepModules() {
  const modules = [
    { name: "Commandes", included: true, price: "Gratuit" },
    { name: "Clients CRM", included: true, price: "Gratuit" },
    { name: "Livraisons", included: true, price: "Gratuit" },
    { name: "Campagnes SMS", included: false, price: "2 000 F/mois" },
    { name: "Géolocalisation", included: false, price: "5 000 F/mois" },
    { name: "Assistant IA", included: false, price: "10 000 F/mois" },
  ];

  return (
    <div>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold mb-2.5">
        Modules disponibles
      </p>
      <div className="space-y-1.5">
        {modules.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs ${
              m.included
                ? "border-accent/30 bg-accent/5"
                : "border-border/40 bg-background/60"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                m.included
                  ? "bg-accent text-white"
                  : "bg-muted border border-border"
              }`}
            >
              {m.included && <Check size={9} strokeWidth={3} />}
            </div>
            <span className={`flex-1 font-medium ${m.included ? "text-foreground" : "text-muted-foreground"}`}>
              {m.name}
            </span>
            <span className={`text-[9px] font-semibold ${m.included ? "text-accent" : "text-muted-foreground"}`}>
              {m.price}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StepTeam() {
  const members = [
    {
      name: "Awa Koné",
      role: "Caller",
      photo: "https://i.pravatar.cc/40?img=47",
      colorClass: "bg-primary/10 text-primary border-primary/20",
    },
    {
      name: "Mamadou Sow",
      role: "Préparateur",
      photo: "https://i.pravatar.cc/40?img=12",
      colorClass: "bg-[hsl(38,95%,55%)]/10 text-[hsl(38,95%,55%)] border-[hsl(38,95%,55%)]/20",
    },
    {
      name: "Fatou Ba",
      role: "Livreur",
      photo: "https://i.pravatar.cc/40?img=26",
      colorClass: "bg-accent/10 text-accent border-accent/20",
    },
  ];

  return (
    <div>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold mb-2.5">
        Membres invités
      </p>
      <div className="space-y-2">
        {members.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card/80 px-3 py-2"
          >
            <img
              src={m.photo}
              alt={m.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-border shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">{m.name}</p>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] font-bold ${m.colorClass} mt-0.5`}
              >
                {m.role}
              </span>
            </div>
            <div className="flex items-center gap-1 text-accent">
              <Check size={12} strokeWidth={2.5} />
              <span className="text-[9px] font-medium">Invité·e</span>
            </div>
          </motion.div>
        ))}
        <div className="rounded-xl border-2 border-dashed border-border/40 px-3 py-2 text-center text-[10px] text-muted-foreground">
          + Inviter un autre membre
        </div>
      </div>
    </div>
  );
}

function WorkspacePanel({
  role,
  name,
  photo,
  colorText,
}: {
  role: string;
  name: string;
  photo: string;
  colorText: string;
}) {
  const rows: Record<string, { Icon: typeof Phone; items: { text: string; highlight: boolean }[] }> = {
    Caller: {
      Icon: Phone,
      items: [
        { text: "CMD-2841 · À confirmer", highlight: false },
        { text: "CMD-2842 · En appel", highlight: true },
        { text: "CMD-2843 · Confirmée ✓", highlight: false },
      ],
    },
    Préparateur: {
      Icon: Package,
      items: [
        { text: "CMD-2839 · Prêt ✓", highlight: false },
        { text: "CMD-2840 · En préparation", highlight: true },
        { text: "CMD-2841 · En attente", highlight: false },
      ],
    },
    Livreur: {
      Icon: Truck,
      items: [
        { text: "CMD-2837 · Livré ✓", highlight: false },
        { text: "CMD-2839 · En route", highlight: true },
        { text: "CMD-2841 · À récupérer", highlight: false },
      ],
    },
  };

  const conf = rows[role];

  return (
    <div className="rounded-xl border border-border/50 bg-card/90 overflow-hidden">
      <div className={`px-2 py-1.5 border-b border-border/40 flex items-center gap-1.5 ${colorText}`}>
        <img
          src={photo}
          alt={name}
          className="w-5 h-5 rounded-full object-cover ring-1 ring-border"
        />
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider opacity-60">{role}</p>
          <p className="text-[9px] font-semibold leading-none">{name.split(" ")[0]}</p>
        </div>
      </div>
      <div className="p-1.5 space-y-1">
        {conf.items.map((item, i) => (
          <div
            key={i}
            className={`text-[8px] px-1.5 py-1 rounded flex items-center gap-1 ${
              item.highlight
                ? "bg-primary/10 text-primary font-semibold"
                : i === 0
                ? "bg-accent/10 text-accent"
                : "bg-muted/50 text-muted-foreground"
            }`}
          >
            <conf.Icon size={7} className="shrink-0" />
            <span className="truncate">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepWorkspaces() {
  return (
    <div>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold text-center mb-3">
        Chaque rôle a une vue dédiée
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        <WorkspacePanel
          role="Caller"
          name="Awa Koné"
          photo="https://i.pravatar.cc/40?img=47"
          colorText="text-primary"
        />
        <WorkspacePanel
          role="Préparateur"
          name="Mamadou Sow"
          photo="https://i.pravatar.cc/40?img=12"
          colorText="text-[hsl(38,95%,55%)]"
        />
        <WorkspacePanel
          role="Livreur"
          name="Fatou Ba"
          photo="https://i.pravatar.cc/40?img=26"
          colorText="text-accent"
        />
      </div>
      <div className="grid grid-cols-3 gap-1.5 mt-1.5 text-center">
        {["Pipeline commandes", "Liste préparation", "Tournée livreur"].map((t) => (
          <p key={t} className="text-[8px] text-muted-foreground leading-tight">{t}</p>
        ))}
      </div>
    </div>
  );
}

const stepComponents = [
  StepSignup,
  StepStore,
  StepModules,
  StepTeam,
  StepWorkspaces,
];

// ── Main section ─────────────────────────────────────────────────────────────

export const OnboardingDemoSection = () => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % STEPS.length);
    }, STEP_DURATION);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  const goTo = (i: number) => {
    setCurrent(i);
    startTimer();
  };

  const StepContent = stepComponents[current];
  const info = stepInfo[current];

  return (
    <section id="demo" className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-semibold mb-4">
            <LayoutDashboard size={12} />
            Démo interactive
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground font-[Space_Grotesk] mb-4 leading-tight">
            Opérationnel en{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              10 minutes chrono
            </span>
          </h2>
          <p className="text-base lg:text-lg text-muted-foreground">
            De l'inscription à votre premier ordre traité — voici exactement comment ça se passe.
          </p>
        </motion.div>

        {/* Step pills */}
        <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const done = i < current;
            const active = i === current;
            return (
              <button
                key={step.id}
                onClick={() => goTo(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                    : done
                    ? "bg-accent/15 text-accent border-accent/30"
                    : "bg-card text-muted-foreground border-border/50 hover:border-primary/30"
                }`}
              >
                {done ? <Check size={11} strokeWidth={3} /> : <Icon size={11} />}
                {step.label}
              </button>
            );
          })}
        </div>

        {/* Content grid */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center max-w-5xl mx-auto">
          {/* Text side */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="order-2 lg:order-1"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {current + 1}
                </div>
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Étape {current + 1} / {STEPS.length}
                </span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-foreground font-[Space_Grotesk] mb-3 leading-tight">
                {info.title}
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                {info.description}
              </p>
              <div className="flex gap-2">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === current ? "w-8 bg-primary" : "w-3 bg-border hover:bg-primary/40"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Mockup side */}
          <div className="order-1 lg:order-2">
            <div className="relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/10 overflow-hidden">
              {/* Chrome bar */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/60 bg-muted/30">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-[hsl(38,95%,55%)]/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
                <span className="ml-3 text-xs text-muted-foreground font-mono truncate">
                  app.intramate.io / onboarding
                </span>
                {/* Auto-advance progress */}
                <div className="ml-auto w-16 h-1 bg-border/40 rounded-full overflow-hidden shrink-0">
                  <motion.div
                    key={current}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: STEP_DURATION / 1000, ease: "linear" }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>

              {/* Step content */}
              <div className="p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <StepContent />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Navigation arrows */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => goTo((current - 1 + STEPS.length) % STEPS.length)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border/40 hover:border-border"
              >
                ← Précédent
              </button>
              <button
                onClick={() => goTo((current + 1) % STEPS.length)}
                className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/5"
              >
                Suivant →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
