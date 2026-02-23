import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useModules } from "@/contexts/ModulesContext";
import { getModuleById, FREE_MODULE_IDS, modulesRegistry, tierLabels } from "@/lib/modules-registry";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Package, ArrowRight, Receipt, CreditCard, Layers, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { PaymentCheckout } from "@/components/billing/PaymentCheckout";

const Billing = () => {
  const { activeModules, monthlyPrice } = useModules();
  const navigate = useNavigate();
  const { user } = useAuth();
  const storeId = user?.store_id;

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("store_id", storeId!)
        .order("issued_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  const paidModules = activeModules
    .map((id) => getModuleById(id))
    .filter((m) => m && !FREE_MODULE_IDS.includes(m.id));

  const freeModules = activeModules
    .map((id) => getModuleById(id))
    .filter((m) => m && FREE_MODULE_IDS.includes(m.id));

  return (
    <DashboardLayout title="Facturation">
      <div className="space-y-8">
        {/* Payment checkout */}
        <PaymentCheckout />

        {/* Summary card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Receipt size={24} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Coût mensuel total</p>
                    <p className="text-3xl font-bold font-[Space_Grotesk] text-foreground">
                      {monthlyPrice.toLocaleString("fr-FR")} <span className="text-base font-normal text-muted-foreground">FCFA/mois</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Layers size={12} />
                    {paidModules.length} module{paidModules.length > 1 ? "s" : ""} payant{paidModules.length > 1 ? "s" : ""}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Package size={12} />
                    {freeModules.length} inclus
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active paid modules */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Modules actifs facturés</h2>
              <p className="text-sm text-muted-foreground">Détail des modules payants qui composent votre facture mensuelle.</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/dashboard/modules")}>
              Gérer les modules <ArrowRight size={14} />
            </Button>
          </div>

          {paidModules.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <Package size={32} className="mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-3">Aucun module payant activé.</p>
                <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/modules")}>
                  Explorer les modules
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {paidModules.map((mod, i) => {
                if (!mod) return null;
                const Icon = mod.icon;
                return (
                  <motion.div
                    key={mod.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <Card className="border-border/60">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon size={18} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground truncate">{mod.name}</p>
                              <Badge variant="secondary" className="text-[10px]">{tierLabels[mod.tier]}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{mod.description}</p>
                          </div>
                          <p className="text-sm font-semibold text-foreground whitespace-nowrap">
                            {mod.price.toLocaleString("fr-FR")} <span className="text-xs font-normal text-muted-foreground">FCFA</span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

              {/* Total row */}
              <div className="flex items-center justify-between pt-3 px-4">
                <p className="text-sm font-medium text-muted-foreground">Total mensuel</p>
                <p className="text-lg font-bold text-foreground font-[Space_Grotesk]">
                  {monthlyPrice.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Free modules included */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Modules inclus gratuitement</h2>
          <p className="text-sm text-muted-foreground mb-4">Ces modules font partie du pack de base, toujours actifs.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {freeModules.map((mod) => {
              if (!mod) return null;
              const Icon = mod.icon;
              return (
                <div key={mod.id} className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5">
                  <Icon size={16} className="text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">{mod.name}</span>
                  <Check size={14} className="text-primary ml-auto shrink-0" />
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Invoice history */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Historique des factures</h2>
              <p className="text-sm text-muted-foreground">Vos 5 dernières factures.</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/dashboard/settings", { state: { tab: "billing" } })}>
              <CreditCard size={14} /> Moyens de paiement
            </Button>
          </div>

          <Card>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="animate-spin text-muted-foreground" size={24} />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Receipt size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune facture pour le moment.</p>
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                    <TableCell className="text-sm">{new Date(inv.issued_at).toLocaleDateString("fr-FR")}</TableCell>
                    <TableCell className="text-sm font-medium">{inv.amount.toLocaleString("fr-FR")} FCFA</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === "paid" ? "default" : inv.status === "overdue" ? "destructive" : "secondary"} className="text-xs">
                        {inv.status === "paid" ? "Payée" : inv.status === "sent" ? "Envoyée" : inv.status === "overdue" ? "En retard" : inv.status === "draft" ? "Brouillon" : "Annulée"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
