import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "Combien coûte vraiment Intramate ?",
    a: "Intramate est modulaire : vous ne payez que les modules que vous activez. La base (commandes, clients, livraisons, équipe minimale) est gratuite. Les modules payants vont de 2 000 à 15 000 FCFA/mois chacun. Comptez 15 000–40 000 FCFA/mois pour un usage standard.",
  },
  {
    q: "Comment se fait l'installation ?",
    a: "Aucune installation. Vous créez votre compte, choisissez votre secteur, et l'IA active les modules pertinents en moins de 10 minutes. Votre équipe accède directement via le navigateur ou l'application mobile (PWA).",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Oui. Hébergement chiffré sur Supabase (Postgres avec Row Level Security), authentification par email + Google + Apple, et isolation stricte des données entre marchands. Vos données ne sortent jamais de votre boutique.",
  },
  {
    q: "Puis-je intégrer Intramate à ma boutique en ligne ?",
    a: "Oui. Avec le module Formulaire embarqué, vous générez un bout de code à coller sur WordPress, Elementor ou n'importe quelle landing page HTML. Les commandes arrivent directement dans Intramate.",
  },
  {
    q: "Quels paiements sont supportés ?",
    a: "Orange Money, Wave, MTN Mobile Money, Moov Money, Free Money, ainsi que les cartes Visa/Mastercard. La couverture évolue selon votre pays.",
  },
  {
    q: "Puis-je inviter mon équipe ?",
    a: "Oui. Invitez par email vos callers, préparateurs et livreurs. Chaque rôle a son propre espace de travail (workspace) qui ne montre que ce qui le concerne. Vous gardez le contrôle des permissions.",
  },
  {
    q: "Que se passe-t-il après les 14 jours d'essai ?",
    a: "Rien automatiquement. Aucune carte n'est demandée. À la fin de l'essai, vous choisissez vos modules et payez avec Orange Money, Wave ou autre. Si vous ne payez pas, votre compte reste consultable mais en lecture seule.",
  },
  {
    q: "Y a-t-il une limite de commandes ?",
    a: "Non. Le plan de base inclut un nombre illimité de commandes, clients et produits. Seuls certains modules avancés (campagnes, multi-livreurs) ont des paliers selon le volume.",
  },
];

export const FAQSection = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-20 lg:py-28 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-semibold mb-4">
            <HelpCircle size={12} />
            Questions fréquentes
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground font-[Space_Grotesk] mb-4 leading-tight">
            Tout ce que vous voulez savoir
          </h2>
          <p className="text-base lg:text-lg text-muted-foreground">
            Vous ne trouvez pas la réponse ? Écrivez-nous à contact@intramate.app
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className={`w-full text-left rounded-xl border p-5 transition-all ${
                  open === i
                    ? "border-primary/40 bg-primary/5 shadow-md shadow-primary/5"
                    : "border-border/60 bg-card/60 hover:border-primary/20 hover:bg-card"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-foreground">{faq.q}</h3>
                    <AnimatePresence initial={false}>
                      {open === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <motion.div
                    animate={{ rotate: open === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 mt-1"
                  >
                    <ChevronDown
                      size={18}
                      className={open === i ? "text-primary" : "text-muted-foreground"}
                    />
                  </motion.div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
