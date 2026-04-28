import { motion } from "framer-motion";
import { MapPin, Smartphone, MessageCircle, CreditCard, Languages } from "lucide-react";

// Africa-specific features that matter for African e-commerce
const features = [
  {
    icon: CreditCard,
    title: "Paiements mobiles",
    description: "Orange Money, Wave, MTN MoMo, Moov Money, Free Money",
    items: ["Orange Money", "Wave", "MTN MoMo"],
    color: "primary",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp & SMS",
    description: "Vos clients commandent via WhatsApp, vous gérez sur Intramate",
    items: ["WhatsApp Business", "SMS Africa", "Vocal IA"],
    color: "accent",
  },
  {
    icon: Smartphone,
    title: "Mobile-first",
    description: "Pensé pour les smartphones — vos livreurs travaillent au téléphone",
    items: ["PWA installable", "Offline-friendly", "3G optimisé"],
    color: "amber",
  },
  {
    icon: Languages,
    title: "FCFA & langues locales",
    description: "Devise XOF/XAF, support français + interfaces simplifiées",
    items: ["FCFA natif", "Français", "Anglais à venir"],
    color: "primary",
  },
];

// Cities to show as pins on the map (approximate coordinates relative to viewBox)
const cities = [
  { name: "Abidjan", country: "Côte d'Ivoire", x: 178, y: 232, big: true },
  { name: "Dakar", country: "Sénégal", x: 90, y: 175, big: true },
  { name: "Bamako", country: "Mali", x: 165, y: 170 },
  { name: "Cotonou", country: "Bénin", x: 232, y: 230 },
  { name: "Lomé", country: "Togo", x: 215, y: 232 },
  { name: "Douala", country: "Cameroun", x: 280, y: 247, big: true },
  { name: "Yaoundé", country: "Cameroun", x: 290, y: 240 },
  { name: "Lagos", country: "Nigeria", x: 255, y: 230 },
  { name: "Ouagadougou", country: "Burkina", x: 200, y: 195 },
  { name: "Conakry", country: "Guinée", x: 130, y: 215 },
  { name: "Kinshasa", country: "RDC", x: 320, y: 320 },
  { name: "Niamey", country: "Niger", x: 230, y: 180 },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  primary: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/30" },
  accent: { bg: "bg-accent/10", text: "text-accent", border: "border-accent/30" },
  amber: { bg: "bg-[hsl(38,95%,55%)]/10", text: "text-[hsl(38,95%,55%)]", border: "border-[hsl(38,95%,55%)]/30" },
};

export const AfricaMapSection = () => {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14 max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
            <MapPin size={12} />
            Pensé pour l'Afrique
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground font-[Space_Grotesk] mb-4 leading-tight">
            Pas un outil occidental{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              traduit en français
            </span>
          </h2>
          <p className="text-base lg:text-lg text-muted-foreground">
            Intramate intègre nativement les paiements mobiles, WhatsApp, SMS,
            et la réalité du commerce africain. Construit ici, pour ici.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Map illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute -inset-6 bg-gradient-to-br from-primary/15 to-accent/15 rounded-3xl blur-2xl -z-10" />

            <div className="relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 shadow-xl">
              <svg
                viewBox="0 0 480 520"
                className="w-full h-auto"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="africa-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.15" />
                  </linearGradient>
                  <linearGradient id="africa-stroke" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.5" />
                  </linearGradient>
                </defs>

                {/* Stylized Africa silhouette */}
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 2 }}
                  d="M195 65 C175 60 152 70 138 90 C125 110 110 130 100 155 C85 175 75 195 78 220 C82 240 95 255 100 275 C105 295 110 310 120 325 C115 345 120 365 130 380 C140 395 155 405 165 420 C175 440 188 455 205 470 C220 480 240 490 258 488 C275 485 290 478 305 465 C320 450 332 433 340 415 C355 400 370 380 380 360 C390 340 395 320 395 298 C400 278 400 258 395 238 C390 218 380 200 370 185 C365 165 355 148 345 132 C335 118 322 105 305 95 C290 85 270 78 250 75 C230 70 210 68 195 65 Z"
                  fill="url(#africa-grad)"
                  stroke="url(#africa-stroke)"
                  strokeWidth="1.5"
                />

                {/* Pulsing connection lines between major cities */}
                {[
                  { from: { x: 178, y: 232 }, to: { x: 90, y: 175 } },
                  { from: { x: 178, y: 232 }, to: { x: 280, y: 247 } },
                  { from: { x: 178, y: 232 }, to: { x: 232, y: 230 } },
                  { from: { x: 90, y: 175 }, to: { x: 165, y: 170 } },
                  { from: { x: 280, y: 247 }, to: { x: 320, y: 320 } },
                ].map((line, i) => (
                  <motion.line
                    key={i}
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 0.6 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1 + i * 0.2, duration: 1 }}
                    x1={line.from.x}
                    y1={line.from.y}
                    x2={line.to.x}
                    y2={line.to.y}
                    stroke="hsl(var(--accent))"
                    strokeWidth="0.6"
                    strokeDasharray="2 3"
                  />
                ))}

                {/* City pins */}
                {cities.map((city, i) => (
                  <g key={city.name}>
                    {/* Pulse ring for big cities */}
                    {city.big && (
                      <motion.circle
                        cx={city.x}
                        cy={city.y}
                        r="8"
                        fill="hsl(var(--primary))"
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{
                          repeat: Infinity,
                          duration: 2.5,
                          delay: i * 0.3,
                        }}
                      />
                    )}
                    <motion.circle
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.5 + i * 0.08, type: "spring" }}
                      cx={city.x}
                      cy={city.y}
                      r={city.big ? 5 : 3}
                      fill={city.big ? "hsl(var(--primary))" : "hsl(var(--accent))"}
                      stroke="hsl(var(--card))"
                      strokeWidth="1.5"
                    />
                    {city.big && (
                      <motion.text
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1.8 + i * 0.1 }}
                        x={city.x + 8}
                        y={city.y + 4}
                        fill="hsl(var(--foreground))"
                        fontSize="10"
                        fontWeight="600"
                        fontFamily="Inter, sans-serif"
                      >
                        {city.name}
                      </motion.text>
                    )}
                  </g>
                ))}
              </svg>

              {/* Stats overlay */}
              <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-2">
                {[
                  { value: "12", label: "Pays" },
                  { value: "8", label: "Devises" },
                  { value: "5+", label: "Mobile money" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg bg-background/80 backdrop-blur-sm border border-border/40 p-2 text-center"
                  >
                    <p className="text-lg font-bold text-foreground font-[Space_Grotesk]">
                      {s.value}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Feature list */}
          <div className="space-y-4">
            {features.map((f, i) => {
              const c = colorMap[f.color];
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 p-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-colors"
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center shrink-0`}
                  >
                    <f.icon size={20} className={c.text} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground text-base mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                      {f.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {f.items.map((item) => (
                        <span
                          key={item}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
