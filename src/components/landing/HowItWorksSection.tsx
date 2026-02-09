import { motion } from "framer-motion";
import { UserPlus, Puzzle, Rocket } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Inscrivez-vous",
    description: "Créez votre compte en 2 minutes. Choisissez votre secteur d'activité.",
  },
  {
    icon: Puzzle,
    step: "02",
    title: "Choisissez vos modules",
    description: "Sélectionnez uniquement les briques dont vous avez besoin. Le prix se calcule en temps réel.",
  },
  {
    icon: Rocket,
    step: "03",
    title: "Lancez-vous !",
    description: "Votre système est prêt. Invitez votre équipe et commencez à gérer.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Comment ça marche</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-[Space_Grotesk]">
            Opérationnel en 10 minutes
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <s.icon size={28} className="text-primary" />
              </div>
              <span className="text-xs font-bold text-primary tracking-widest">{s.step}</span>
              <h3 className="text-xl font-semibold text-foreground mt-2 mb-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
