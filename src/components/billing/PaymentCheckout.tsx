import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/contexts/ModulesContext";
import { supabase } from "@/integrations/supabase/client";
import { FREE_MODULE_IDS, getModuleById } from "@/lib/modules-registry";
import { detectCurrency, convertFromXOF, formatCurrency, getProvidersForCountry, type SupportedCurrency } from "@/lib/currency-utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, CreditCard, Smartphone, Wallet, CheckCircle, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentProvider {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  fee_percentage: number;
  markets: string[];
  supported_methods: string[];
}

const providerIcons: Record<string, typeof CreditCard> = {
  cinetpay: CreditCard,
  paydunya: Smartphone,
  wave: Wallet,
  paystack: Globe,
};

const methodLabels: Record<string, string> = {
  "visa": "Visa",
  "mastercard": "Mastercard",
  "orange_money": "Orange Money",
  "mtn_money": "MTN Money",
  "wave": "Wave",
  "mobile_money": "Mobile Money",
  "card": "Carte bancaire",
};

export function PaymentCheckout() {
  const { user } = useAuth();
  const { activeModules, monthlyPrice } = useModules();
  const { toast } = useToast();
  const storeId = user?.store_id;

  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [storeCountry, setStoreCountry] = useState<string>("CI");
  const [currency, setCurrency] = useState<SupportedCurrency>("XOF");
  const [existingSub, setExistingSub] = useState<any>(null);

  // Get store country & subscription
  useEffect(() => {
    if (!storeId) return;

    const fetchData = async () => {
      const [storeRes, subRes, providersRes] = await Promise.all([
        supabase.from("stores").select("country").eq("id", storeId).single(),
        supabase.from("subscriptions").select("*").eq("store_id", storeId).eq("status", "active").limit(1),
        supabase.from("payment_providers").select("*").eq("is_active", true),
      ]);

      const country = storeRes.data?.country || "CI";
      setStoreCountry(country);
      setCurrency(detectCurrency(country));

      if (subRes.data && subRes.data.length > 0) {
        setExistingSub(subRes.data[0]);
      }

      // Filter providers by country match
      if (providersRes.data) {
        const countryProviders = getProvidersForCountry(country);
        const filtered = (providersRes.data as PaymentProvider[]).filter(
          (p) => countryProviders.includes(p.name)
        );
        // Sort: best match first
        filtered.sort((a, b) => {
          const aIdx = countryProviders.indexOf(a.name);
          const bIdx = countryProviders.indexOf(b.name);
          return aIdx - bIdx;
        });
        setProviders(filtered);
        if (filtered.length > 0) setSelectedProvider(filtered[0].name);
      }

      setLoading(false);
    };

    fetchData();
  }, [storeId]);

  const paidModuleIds = activeModules.filter((id) => {
    if (FREE_MODULE_IDS.includes(id)) return false;
    const mod = getModuleById(id);
    if (mod && mod.available === false) return false;
    return true;
  });
  const totalXOF = monthlyPrice;
  const totalConverted = convertFromXOF(totalXOF, currency);

  const handlePayment = async () => {
    if (!selectedProvider || !storeId || paidModuleIds.length === 0) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("initiate-payment", {
        body: {
          store_id: storeId,
          provider: selectedProvider,
          modules: paidModuleIds,
          currency,
          country: storeCountry,
        },
      });

      if (error) throw error;

      if (data?.payment_url) {
        // Redirect to payment page
        window.open(data.payment_url, "_blank");
        toast({
          title: "Redirection vers le paiement",
          description: "Complétez le paiement dans l'onglet ouvert.",
        });
      } else if (data?.success) {
        toast({
          title: "Abonnement activé !",
          description: "Vos modules sont maintenant actifs.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Erreur de paiement",
        description: err.message || "Impossible d'initier le paiement.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </CardContent>
      </Card>
    );
  }

  if (paidModuleIds.length === 0) {
    return null; // No paid modules, nothing to pay
  }

  if (existingSub) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-primary" />
            <CardTitle className="text-lg">Abonnement actif</CardTitle>
          </div>
          <CardDescription>
            Prochain renouvellement le{" "}
            {existingSub.renewal_date
              ? new Date(existingSub.renewal_date).toLocaleDateString("fr-FR")
              : "N/A"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Montant mensuel</p>
              <p className="text-xl font-bold font-[Space_Grotesk]">
                {formatCurrency(existingSub.amount, existingSub.currency as SupportedCurrency)}
              </p>
            </div>
            <Badge variant="default">
              {existingSub.provider?.toUpperCase() || "N/A"}
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {(existingSub.modules || []).map((modId: string) => {
              const mod = getModuleById(modId);
              return mod ? (
                <Badge key={modId} variant="secondary" className="text-[10px]">
                  {mod.name}
                </Badge>
              ) : null;
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payer votre abonnement</CardTitle>
        <CardDescription>
          Sélectionnez un moyen de paiement pour activer vos {paidModuleIds.length} module{paidModuleIds.length > 1 ? "s" : ""} payant{paidModuleIds.length > 1 ? "s" : ""}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount summary */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total mensuel</p>
            <div className="text-right">
              <p className="text-xl font-bold font-[Space_Grotesk] text-foreground">
                {formatCurrency(totalConverted, currency)}
              </p>
              {currency !== "XOF" && (
                <p className="text-xs text-muted-foreground">
                  ≈ {formatCurrency(totalXOF, "XOF")}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Provider selection */}
        {providers.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CreditCard size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun moyen de paiement disponible pour votre région.</p>
            <p className="text-xs mt-1">Contactez le support pour activer un provider.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Choisissez votre moyen de paiement</p>
            {providers.map((provider) => {
              const Icon = providerIcons[provider.name] || CreditCard;
              const isSelected = selectedProvider === provider.name;
              return (
                <button
                  key={provider.name}
                  onClick={() => setSelectedProvider(provider.name)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/30 hover:bg-muted/30"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-primary/15" : "bg-muted"
                  }`}>
                    <Icon size={20} className={isSelected ? "text-primary" : "text-muted-foreground"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{provider.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {provider.supported_methods.map((m) => methodLabels[m] || m).join(", ")}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {provider.fee_percentage}% frais
                  </Badge>
                  {isSelected && (
                    <CheckCircle size={16} className="text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Pay button */}
        {providers.length > 0 && (
          <Button
            className="w-full h-12 text-base"
            size="lg"
            onClick={handlePayment}
            disabled={processing || !selectedProvider}
          >
            {processing ? (
              <Loader2 className="animate-spin mr-2" size={18} />
            ) : (
              <CreditCard size={18} className="mr-2" />
            )}
            Payer {formatCurrency(totalConverted, currency)}/mois
          </Button>
        )}

        <p className="text-xs text-center text-muted-foreground">
          Les frais de transaction sont inclus. Renouvellement automatique mensuel.
        </p>
      </CardContent>
    </Card>
  );
}
