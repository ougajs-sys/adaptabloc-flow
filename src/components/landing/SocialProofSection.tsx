import { motion } from "framer-motion";
import { MapPin, TrendingUp, Star, Users } from "lucide-react";

const featured = {
  name: "Awa Coulibaly",
  business: "Fondatrice, Maïmouna Mode",
  city: "Abidjan, Côte d'Ivoire",
  photo:
    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=640&h=820&fit=crop&crop=top&auto=format&q=85",
  quote:
    "Je gère 80 commandes par jour sans le moindre stress. Intramate m'a libéré du temps pour ce qui compte vraiment — grandir.",
  metric: "+180%",
  metricLabel: "CA en 4 mois",
};

const merchants = [
  {
    name: "Moussa Diallo",
    city: "Dakar, Sénégal",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=faces&auto=format&q=80",
    stat: "12 livreurs pilotés",
    accent: "from-primary/70",
  },
  {
    name: "Fatou Ndiaye",
    city: "Saint-Louis, Sénégal",
    photo:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop&crop=faces&auto=format&q=80",
    stat: "92% livraisons réussies",
    accent: "from-accent/70",
  },
  {
    name: "Kofi Mensah",
    city: "Accra, Ghana",
    photo:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=300&fit=crop&crop=faces&auto=format&q=80",
    stat: "30 commandes/j via iframe",
    accent: "from-[hsl(280,80%,55%)]/70",
  },
  {
    name: "Aminata Bah",
    city: "Conakry, Guinée",
    photo:
      "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=400&h=300&fit=crop&crop=faces&auto=format&q=80",
    stat: "×3 panier moyen",
    accent: "from-accent/70",
  },
];

const trustBar = [
  { value: "340+", label: "marchands actifs" },
  { value: "8", label: "pays couverts" },
  { value: "4.9/5", label: "satisfaction" },
  { value: "12 500+", label: "commandes gérées" },
];

export const SocialProofSection = () => {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      {/* Background ambiance */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-accent/5 rounded-full blur-[110px]" />
      </div>

      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14 max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-semibold mb-5">
            <Users size={12} />
            Ils font confiance
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground font-[Space_Grotesk] leading-tight">
            Ils font tourner leur business{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              avec Intramate
            </span>
          </h2>
          <p className="text-base lg:text-lg text-muted-foreground mt-4 leading-relaxed">
            De Dakar à Accra, des marchands africains qui ont transformé leur façon de vendre.
          </p>
        </motion.div>

        {/* Photo grid */}
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-4 max-w-6xl mx-auto">
          {/* Featured large card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden group cursor-default"
            style={{ minHeight: "520px" }}
          >
            <img
              src={featured.photo}
              alt={featured.name}
              className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
            />
            {/* Layered gradient for legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />

            {/* Top badge */}
            <div className="absolute top-5 left-5">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={13}
                    className="text-[hsl(38,95%,55%)] fill-[hsl(38,95%,55%)]"
                  />
                ))}
              </div>
            </div>

            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-7">
              {/* Metric pill */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/25 border border-accent/50 backdrop-blur-sm mb-4"
              >
                <TrendingUp size={13} className="text-accent" />
                <span className="text-accent font-bold text-sm">{featured.metric}</span>
                <span className="text-white/75 text-xs">{featured.metricLabel}</span>
              </motion.div>

              <blockquote className="text-white/95 text-lg font-medium leading-relaxed mb-5 max-w-md">
                &ldquo;{featured.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm overflow-hidden shrink-0">
                  <img
                    src={featured.photo}
                    alt={featured.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{featured.name}</p>
                  <p className="text-white/60 text-xs">{featured.business}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={9} className="text-accent" />
                    <span className="text-accent text-xs">{featured.city}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 2×2 mini grid */}
          <div className="grid grid-cols-2 gap-4">
            {merchants.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
                className="relative rounded-2xl overflow-hidden group cursor-default"
                style={{ minHeight: "230px" }}
              >
                <img
                  src={m.photo}
                  alt={m.name}
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                />
                {/* Color accent + dark base */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${m.accent} to-transparent opacity-60`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                {/* Stars top-right */}
                <div className="absolute top-3 right-3 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={10}
                      className="text-[hsl(38,95%,55%)] fill-[hsl(38,95%,55%)]"
                    />
                  ))}
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-semibold text-sm leading-tight">{m.name}</p>
                  <div className="flex items-center gap-1 mt-0.5 mb-2.5">
                    <MapPin size={9} className="text-white/50" />
                    <span className="text-white/50 text-[11px]">{m.city}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20">
                    <TrendingUp size={10} className="text-accent" />
                    <span className="text-white text-[11px] font-medium">{m.stat}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom aggregate trust bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-14 pt-8 border-t border-border/40"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
            {trustBar.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="text-center"
              >
                <p className="text-2xl font-bold text-foreground font-[Space_Grotesk] bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {item.value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
