import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Aïcha Traoré",
    role: "Fondatrice, Maïmouna Boutique",
    location: "Abidjan, Côte d'Ivoire",
    avatar: "AT",
    avatarBg: "from-primary to-[hsl(280,80%,55%)]",
    quote:
      "Avant Intramate, je perdais 3 commandes par jour à cause des appels manqués. Maintenant mes callers gèrent tout sur leur téléphone, et je vois le pipeline en temps réel.",
    metric: { value: "+40%", label: "Taux de confirmation" },
    rating: 5,
  },
  {
    name: "Mamadou Diallo",
    role: "CEO, FastDelivery 225",
    location: "Yopougon, Côte d'Ivoire",
    avatar: "MD",
    avatarBg: "from-accent to-[hsl(168,80%,35%)]",
    quote:
      "On gère 12 livreurs sur 4 quartiers. Le module géolocalisation nous a permis de passer de 65% à 92% de livraisons réussies. Le ROI a été immédiat.",
    metric: { value: "92%", label: "Livraisons réussies" },
    rating: 5,
  },
  {
    name: "Fatou Diop",
    role: "Directrice, Xessal Cosmétiques",
    location: "Dakar, Sénégal",
    avatar: "FD",
    avatarBg: "from-[hsl(38,95%,55%)] to-[hsl(20,95%,55%)]",
    quote:
      "L'iframe sur ma landing page me ramène 30 commandes par jour. Et avec les campagnes WhatsApp, mes clientes reviennent toutes les semaines.",
    metric: { value: "30/jour", label: "Commandes via iframe" },
    rating: 5,
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14 max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-semibold mb-4">
            <Star size={12} className="fill-primary" />
            Histoires de marchands
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground font-[Space_Grotesk] mb-4 leading-tight">
            Des entrepreneurs comme vous,{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              qui scalent
            </span>
          </h2>
          <p className="text-base lg:text-lg text-muted-foreground">
            Pas de cas client inventés. Voici ce que les marchands réels disent
            d'Intramate.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -6 }}
              className="relative group"
            >
              {/* Card glow on hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity -z-10" />

              <div className="relative h-full p-6 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl hover:border-primary/30 transition-all flex flex-col">
                {/* Quote icon */}
                <Quote
                  size={32}
                  className="text-primary/20 mb-3"
                  strokeWidth={1.5}
                />

                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, k) => (
                    <Star
                      key={k}
                      size={14}
                      className="text-[hsl(38,95%,55%)] fill-[hsl(38,95%,55%)]"
                    />
                  ))}
                </div>

                {/* Quote text */}
                <p className="text-sm text-foreground/90 leading-relaxed mb-5 flex-1">
                  "{t.quote}"
                </p>

                {/* Metric highlight */}
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 mb-5">
                  <p className="text-xl font-bold text-accent font-[Space_Grotesk] leading-none">
                    {t.metric.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                    {t.metric.label}
                  </p>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                  <div
                    className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.avatarBg} flex items-center justify-center text-white font-bold text-sm shadow-md`}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.role}</p>
                    <p className="text-[10px] text-muted-foreground/70">{t.location}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Aggregate trust signal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 mt-14 max-w-3xl mx-auto"
        >
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={18}
                  className="text-[hsl(38,95%,55%)] fill-[hsl(38,95%,55%)]"
                />
              ))}
            </div>
            <span className="text-sm font-bold text-foreground">4.9/5</span>
            <span className="text-sm text-muted-foreground">· 340+ marchands</span>
          </div>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-bold text-foreground">+12 500</span>
            <span>commandes traitées en 2026</span>
          </div>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-bold text-foreground">98%</span>
            <span>de satisfaction client</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
