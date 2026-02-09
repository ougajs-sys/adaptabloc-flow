import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const CTASection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="relative max-w-3xl mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent p-10 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground font-[Space_Grotesk] mb-4 relative z-10">
            Prêt à simplifier votre gestion ?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto relative z-10">
            Rejoignez les entrepreneurs qui gèrent sans effort. 14 jours gratuits, sans engagement.
          </p>
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="text-base px-8 h-12 relative z-10"
          >
            <Link to="/onboarding">
              Commencer maintenant
              <ArrowRight size={18} className="ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
