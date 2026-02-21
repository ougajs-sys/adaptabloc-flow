import { OnboardingData } from "@/pages/Onboarding";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useModules } from "@/contexts/ModulesContext";
import { useEffect } from "react";
import { markOnboardingComplete } from "@/lib/auth-store";

interface Props {
  data: OnboardingData;
}

export const OnboardingStepLaunch = ({ data }: Props) => {
  const { setModules } = useModules();

  // Save selected modules and mark onboarding complete
  useEffect(() => {
    setModules(data.modules);
    markOnboardingComplete();
  }, [data.modules, setModules]);

  const sectorLabels: Record<string, string> = {
    ecommerce: "E-commerce & Retail",
    transport: "Transport & Logistique",
    mode: "Prêt-à-porter / Mode",
    epicerie: "Épicerie / Frais",
    beaute: "Institut Beauté / Spa",
  };

  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={36} className="text-accent" />
      </div>

      <h2 className="text-2xl font-bold text-foreground font-[Space_Grotesk] mb-2">
        🎉 Bienvenue, {data.businessName} !
      </h2>
      <p className="text-muted-foreground mb-8">
        Votre espace EasyFlow est prêt. Voici un résumé de votre configuration :
      </p>

      <div className="bg-card border border-border rounded-xl p-6 text-left max-w-md mx-auto mb-8">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Secteur</span>
            <span className="font-medium text-foreground">{sectorLabels[data.sector] || data.sector}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Modules activés</span>
            <span className="font-medium text-foreground">{data.modules.length + 4} modules</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium text-foreground">{data.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Essai gratuit</span>
            <span className="font-medium text-accent">14 jours</span>
          </div>
        </div>
      </div>

      <Button size="lg" asChild className="px-8 h-12">
        <Link to="/dashboard">
          Accéder à mon tableau de bord
          <ArrowRight size={18} className="ml-2" />
        </Link>
      </Button>
    </div>
  );
};
