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
            asChild
            className="text-base px-8 h-12 relative z-10 text-white border-0"
            style={{ backgroundColor: "#1877F2" }}
          >
            <Link to="/login" className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Commencer avec Facebook
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
