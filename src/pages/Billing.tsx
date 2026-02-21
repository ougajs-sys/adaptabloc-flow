import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { plans, getSubscription, setSubscription, getPlanById, type Plan } from "@/lib/billing-store";
import { toast } from "@/hooks/use-toast";
import { Check, Crown, Zap, Building2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function PlanCard({
  plan,
  currentPlanId,
  onSelect,
}: {
  plan: Plan;
  currentPlanId: string;
  onSelect: (id: string) => void;
}) {
  const isCurrent = plan.id === currentPlanId;
  const icons: Record<string, typeof Zap> = { free: Zap, pro: Crown, enterprise: Building2 };
  const Icon = icons[plan.id] || Zap;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: plans.indexOf(plan) * 0.1 }}
    >
      <Card
        className={`relative flex flex-col h-full transition-all ${
          plan.popular
            ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]"
            : "border-border"
        } ${isCurrent ? "ring-2 ring-primary/30" : ""}`}
      >
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground text-xs px-3">
              Le plus populaire
            </Badge>
          </div>
        )}

        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
            <Icon size={24} className="text-primary" />
          </div>
          <CardTitle className="text-xl">{plan.name}</CardTitle>
          <CardDescription>{plan.description}</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col flex-1">
          {/* Price */}
          <div className="text-center mb-6">
            <div className="flex items-end justify-center gap-1">
              <span className="text-4xl font-bold font-[Space_Grotesk] text-foreground">
                {plan.price === 0 ? "0" : plan.price.toLocaleString("fr-FR")}
              </span>
              <span className="text-sm text-muted-foreground mb-1">FCFA/mois</span>
            </div>
          </div>

          <Separator className="mb-4" />

          {/* Features */}
          <ul className="space-y-2.5 flex-1 mb-6">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check size={16} className="text-primary mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          {isCurrent ? (
            <Button variant="outline" disabled className="w-full gap-2">
              Plan actuel
            </Button>
          ) : (
            <Button
              onClick={() => onSelect(plan.id)}
              variant={plan.popular ? "default" : "outline"}
              className="w-full gap-2"
            >
              {plan.price > (getPlanById(currentPlanId)?.price ?? 0) ? "Passer au" : "Changer pour"}{" "}
              {plan.name}
              <ArrowRight size={16} />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

const Billing = () => {
  const [subscription, setSubState] = useState(getSubscription);
  const navigate = useNavigate();

  const handleSelectPlan = (planId: string) => {
    const plan = getPlanById(planId);
    if (!plan) return;

    const newSub = {
      planId,
      status: "active" as const,
      startDate: new Date().toISOString().split("T")[0],
      nextBilling: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    };
    setSubscription(newSub);
    setSubState(newSub);

    toast({
      title: `Abonnement mis à jour`,
      description: `Vous êtes maintenant sur le plan ${plan.name}${
        plan.price > 0 ? ` — ${plan.price.toLocaleString("fr-FR")} FCFA/mois` : ""
      }.`,
    });
  };

  const currentPlan = getPlanById(subscription.planId);

  return (
    <DashboardLayout title="Abonnement & Facturation">
      <div className="space-y-8">
        {/* Current plan summary */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-5">
            <div>
              <p className="text-sm text-muted-foreground">Plan actuel</p>
              <p className="text-2xl font-bold font-[Space_Grotesk] text-foreground">
                {currentPlan?.name ?? "Gratuit"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Prochaine facturation : {subscription.nextBilling}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/settings", { state: { tab: "billing" } })}>
              Gérer les moyens de paiement
            </Button>
          </CardContent>
        </Card>

        {/* Plans grid */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Choisir un plan</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Changez de plan à tout moment. La différence sera calculée au prorata.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentPlanId={subscription.planId}
                onSelect={handleSelectPlan}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
