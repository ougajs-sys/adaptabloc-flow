import { OnboardingData } from "@/pages/Onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  data: OnboardingData;
  updateData: (d: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const OnboardingStepInfo = ({ data, updateData, onNext, onBack }: Props) => {
  const canContinue = data.businessName.trim() && data.email.trim() && data.phone.trim();

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground font-[Space_Grotesk] mb-2">Vos informations</h2>
      <p className="text-muted-foreground mb-8">
        Quelques détails pour créer votre espace Intramate.
      </p>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="businessName">Nom de l'entreprise</Label>
          <Input
            id="businessName"
            placeholder="Ex: Ma Boutique en Ligne"
            value={data.businessName}
            onChange={(e) => updateData({ businessName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email professionnel</Label>
          <Input
            id="email"
            type="email"
            placeholder="contact@monbusiness.com"
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+225 XX XX XX XX"
            value={data.phone}
            onChange={(e) => updateData({ phone: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Retour
        </Button>
        <Button onClick={onNext} disabled={!canContinue} className="px-8">
          Créer mon compte
        </Button>
      </div>
    </div>
  );
};
