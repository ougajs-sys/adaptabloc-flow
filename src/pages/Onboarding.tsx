import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OnboardingStepSector } from "@/components/onboarding/OnboardingStepSector";
import { OnboardingStepModules } from "@/components/onboarding/OnboardingStepModules";
import { OnboardingStepInfo } from "@/components/onboarding/OnboardingStepInfo";
import { OnboardingStepLaunch } from "@/components/onboarding/OnboardingStepLaunch";
import { OnboardingStepCustom } from "@/components/onboarding/OnboardingStepCustom";
import { Progress } from "@/components/ui/progress";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export interface OnboardingData {
  sector: string;
  modules: string[];
  businessName: string;
  email: string;
  phone: string;
  customSectorLabel?: string;
}

const Onboarding = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Skip wizard entirely if user already has a store
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.has_completed_onboarding) {
      navigate("/dashboard", { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    sector: "",
    modules: [],
    businessName: "",
    email: "",
    phone: "",
  });

  // Dynamic steps based on sector choice
  const isCustom = data.sector === "autre";
  const steps = isCustom
    ? ["Secteur", "Personnalisation", "Infos", "Lancement"]
    : ["Secteur", "Modules", "Infos", "Lancement"];

  const progress = ((step + 1) / steps.length) * 100;

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const updateData = (partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const renderStep = () => {
    if (step === 0) return <OnboardingStepSector data={data} updateData={updateData} onNext={next} />;
    if (step === 1 && isCustom) return <OnboardingStepCustom data={data} updateData={updateData} onNext={next} onBack={back} />;
    if (step === 1) return <OnboardingStepModules data={data} updateData={updateData} onNext={next} onBack={back} />;
    if (step === 2) return <OnboardingStepInfo data={data} updateData={updateData} onNext={next} onBack={back} />;
    if (step === 3) return <OnboardingStepLaunch data={data} />;
    return null;
  };

  // Wait for auth state to resolve before showing the wizard
  if (isLoading || (isAuthenticated && !user)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not signed in — send to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Already onboarded — useEffect above will redirect; render nothing in the meantime
  if (user?.has_completed_onboarding) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs font-[Space_Grotesk]">IM</span>
            </div>
            <span className="font-bold font-[Space_Grotesk] text-foreground">
              Intra<span className="text-primary">mate</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Étape {step + 1}/{steps.length} — {steps[step]}
            </span>
          </div>
        </div>
        <Progress value={progress} className="h-1 rounded-none" />
      </div>

      {/* Content */}
      <div className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${step}-${isCustom}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
