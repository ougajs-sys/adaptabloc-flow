import { OnboardingData } from "@/pages/Onboarding";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  data: OnboardingData;
}

export const OnboardingStepLaunch = ({ data }: Props) => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [storeCreated, setStoreCreated] = useState(false);

  useEffect(() => {
    if (!user || storeCreated || user.has_completed_onboarding) return;

    const createStore = async () => {
      setIsCreating(true);
      try {
        // 1. Create the store and retrieve its ID
        const { data: newStore, error: storeError } = await supabase
          .from("stores")
          .insert({
            name: data.businessName || "Ma Boutique",
            owner_id: user.id,
            sector: data.sector || null,
            email: data.email || null,
            phone: data.phone || null,
          })
          .select("id")
          .single();

        if (storeError) throw storeError;

        const storeId = newStore.id;

        // 2. Create user_role (admin) — required for has_completed_onboarding
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: user.id,
          store_id: storeId,
          role: "admin",
        });
        if (roleError) throw roleError;

        // 3. Create profile entry
        await supabase.from("profiles").insert({
          user_id: user.id,
          store_id: storeId,
          name: user.name,
          email: user.email,
          phone: data.phone || null,
        });

        // 4. Activate selected paid modules
        if (data.modules.length > 0) {
          await supabase.from("store_modules").insert(
            data.modules.map((moduleId) => ({
              store_id: storeId,
              module_id: moduleId,
            }))
          );
        }

        // 5. Refresh auth profile to pick up store_id and has_completed_onboarding = true
        await refreshProfile();
        setStoreCreated(true);
      } catch (err: any) {
        console.error("Error creating store:", err);
        toast({
          title: "Erreur",
          description: "Impossible de créer votre boutique. Veuillez réessayer.",
          variant: "destructive",
        });
      } finally {
        setIsCreating(false);
      }
    };

    createStore();
  }, [user, storeCreated]);

  const sectorLabels: Record<string, string> = {
    ecommerce: "E-commerce & Retail",
    transport: "Transport & Logistique",
    mode: "Prêt-à-porter / Mode",
    epicerie: "Épicerie / Frais",
    beaute: "Institut Beauté / Spa",
  };

  if (isCreating) {
    return (
      <div className="text-center py-16">
        <Loader2 size={32} className="animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Création de votre espace...</p>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={36} className="text-accent" />
      </div>

      <h2 className="text-2xl font-bold text-foreground font-[Space_Grotesk] mb-2">
        🎉 Bienvenue, {data.businessName} !
      </h2>
      <p className="text-muted-foreground mb-8">
        Votre espace Intramate est prêt. Voici un résumé de votre configuration :
      </p>

      <div className="bg-card border border-border rounded-xl p-6 text-left max-w-md mx-auto mb-8">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Secteur</span>
            <span className="font-medium text-foreground">
              {sectorLabels[data.sector] || data.customSectorLabel || data.sector}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Modules activés</span>
            <span className="font-medium text-foreground">{data.modules.length + 5} modules</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium text-foreground">{data.email || user?.email}</span>
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
