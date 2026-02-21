import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useModules } from "@/contexts/ModulesContext";
import { modulesRegistry } from "@/lib/modules-registry";
import {
  mockInvoices, mockPaymentMethods,
  type PaymentMethod,
} from "@/lib/billing-store";
import { getModuleById } from "@/lib/modules-registry";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Store, Bell, CreditCard, Palette, Globe, Shield, Save, Upload,
  Zap, Download, Trash2, Plus, Smartphone, Wallet,
} from "lucide-react";

/* ───── General Tab ───── */
function GeneralTab() {
  const [shopName, setShopName] = useState("Ma Boutique");
  const [email, setEmail] = useState("contact@maboutique.com");
  const [phone, setPhone] = useState("+225 07 00 00 00");
  const [currency, setCurrency] = useState("XOF");
  const [timezone, setTimezone] = useState("Africa/Abidjan");
  const [language, setLanguage] = useState("fr");

  const handleSave = () => {
    toast({ title: "Paramètres enregistrés", description: "Vos informations ont été mises à jour." });
  };

  return (
    <div className="space-y-6">
      {/* Business info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store size={18} className="text-primary" />
            Informations de l'entreprise
          </CardTitle>
          <CardDescription>Les infos de base affichées à vos clients et sur vos documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shopName">Nom de la boutique</Label>
              <Input id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email de contact</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Upload size={16} /> Importer un logo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe size={18} className="text-primary" />
            Régionalisation
          </CardTitle>
          <CardDescription>Devise, fuseau horaire et langue de l'interface.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Devise</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="XOF">FCFA (XOF)</SelectItem>
                  <SelectItem value="XAF">FCFA (XAF)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="USD">Dollar (USD)</SelectItem>
                  <SelectItem value="GBP">Livre (GBP)</SelectItem>
                  <SelectItem value="MAD">Dirham (MAD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fuseau horaire</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Abidjan">Abidjan (GMT+0)</SelectItem>
                  <SelectItem value="Africa/Lagos">Lagos (GMT+1)</SelectItem>
                  <SelectItem value="Africa/Casablanca">Casablanca (GMT+1)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                  <SelectItem value="Africa/Nairobi">Nairobi (GMT+3)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Langue</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2"><Save size={16} /> Enregistrer</Button>
      </div>
    </div>
  );
}

/* ───── Notifications Tab ───── */
function NotificationsTab() {
  const [notifNewOrder, setNotifNewOrder] = useState(true);
  const [notifOrderStatus, setNotifOrderStatus] = useState(true);
  const [notifLowStock, setNotifLowStock] = useState(false);
  const [notifTeam, setNotifTeam] = useState(true);
  const [emailDigest, setEmailDigest] = useState("daily");

  const handleSave = () => {
    toast({ title: "Notifications mises à jour" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            Notifications push
          </CardTitle>
          <CardDescription>Choisissez les événements qui déclenchent une notification.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Nouvelle commande reçue", desc: "Alerte immédiate à chaque nouvelle commande", state: notifNewOrder, set: setNotifNewOrder },
            { label: "Changement de statut", desc: "Quand une commande avance dans le pipeline", state: notifOrderStatus, set: setNotifOrderStatus },
            { label: "Stock faible", desc: "Quand un produit passe sous le seuil d'alerte", state: notifLowStock, set: setNotifLowStock },
            { label: "Activité équipe", desc: "Actions importantes des membres de l'équipe", state: notifTeam, set: setNotifTeam },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch checked={item.state} onCheckedChange={item.set} />
            </div>
          ))}
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Résumé par email</p>
              <p className="text-xs text-muted-foreground">Recevez un récapitulatif périodique.</p>
            </div>
            <Select value={emailDigest} onValueChange={setEmailDigest}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Désactivé</SelectItem>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2"><Save size={16} /> Enregistrer</Button>
      </div>
    </div>
  );
}

/* ───── Billing Tab ───── */
function BillingTab() {
  const { activeModules, monthlyPrice } = useModules();
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);

  const paidModules = activeModules
    .map((id) => modulesRegistry.find((m) => m.id === id))
    .filter((m) => m && m.tier !== "free");

  const handleSetDefault = (id: string) => {
    setPaymentMethods((prev) =>
      prev.map((pm) => ({ ...pm, isDefault: pm.id === id }))
    );
    toast({ title: "Moyen de paiement par défaut mis à jour" });
  };

  const handleRemove = (id: string) => {
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
    toast({ title: "Moyen de paiement supprimé" });
  };

  const handleAddPayment = () => {
    toast({ title: "Bientôt disponible", description: "L'ajout de moyens de paiement sera disponible avec Lovable Cloud." });
  };

  const paymentIcon = (type: string) => {
    if (type === "card") return <CreditCard size={16} className="text-primary" />;
    if (type.includes("money")) return <Smartphone size={16} className="text-primary" />;
    return <Wallet size={16} className="text-primary" />;
  };

  const statusBadge = (status: string) => {
    if (status === "paid") return <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-xs">Payée</Badge>;
    if (status === "pending") return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 text-xs">En attente</Badge>;
    return <Badge variant="destructive" className="text-xs">Échouée</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard size={18} className="text-primary" />
            Coût mensuel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-bold font-[Space_Grotesk] text-foreground">
                  {monthlyPrice.toLocaleString("fr-FR")}
                </span>
                <span className="text-sm text-muted-foreground mb-1">FCFA / mois</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Basé sur <strong className="text-foreground">{paidModules.length} module{paidModules.length > 1 ? "s" : ""} payant{paidModules.length > 1 ? "s" : ""}</strong>
              </p>
            </div>
            <Button size="sm" onClick={() => navigate("/dashboard/billing")} className="gap-2">
              <Zap size={14} /> Gérer les modules
            </Button>
          </div>

          {paidModules.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Modules payants actifs</p>
              <div className="flex flex-wrap gap-2">
                {paidModules.map((m) => (
                  <Badge key={m!.id} variant="secondary" className="text-xs">
                    {m!.name} — {m!.price.toLocaleString("fr-FR")} FCFA
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment methods */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield size={18} className="text-primary" />
                Moyens de paiement
              </CardTitle>
              <CardDescription>Gérez vos méthodes de paiement pour les abonnements.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleAddPayment} className="gap-2">
              <Plus size={14} /> Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {paymentMethods.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">Aucun moyen de paiement configuré</p>
              <Button variant="outline" className="gap-2" onClick={handleAddPayment}>
                <CreditCard size={16} /> Ajouter un moyen de paiement
              </Button>
            </div>
          ) : (
            paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
              >
                <div className="flex items-center gap-3">
                  {paymentIcon(pm.type)}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {pm.label} {pm.last4 && `•••• ${pm.last4}`}
                    </p>
                    {pm.isDefault && (
                      <Badge variant="secondary" className="text-[10px] mt-0.5">Par défaut</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!pm.isDefault && (
                    <Button variant="ghost" size="sm" onClick={() => handleSetDefault(pm.id)}>
                      Définir par défaut
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemove(pm.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Invoice history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard size={18} className="text-primary" />
            Historique des factures
          </CardTitle>
          <CardDescription>Consultez et téléchargez vos factures passées.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Modules</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                  <TableCell className="text-sm">{new Date(inv.date).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell className="text-sm">{inv.modules.length > 0 ? inv.modules.map((id) => getModuleById(id)?.name ?? id).join(", ") : "Pack gratuit"}</TableCell>
                  <TableCell className="text-sm font-medium">{inv.amount.toLocaleString("fr-FR")} FCFA</TableCell>
                  <TableCell>{statusBadge(inv.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toast({ title: "Téléchargement simulé", description: `Facture ${inv.id}` })}
                    >
                      <Download size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
/* ───── Appearance Tab ───── */
function AppearanceTab() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [compactMode, setCompactMode] = useState(false);

  const applyTheme = (t: "light" | "dark" | "system") => {
    setTheme(t);
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
    } else if (t === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
    toast({ title: "Thème mis à jour" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette size={18} className="text-primary" />
            Thème
          </CardTitle>
          <CardDescription>Personnalisez l'apparence de votre interface.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: "light" as const, label: "Clair", preview: "bg-background border-border" },
              { value: "dark" as const, label: "Sombre", preview: "bg-[hsl(220,25%,10%)] border-[hsl(220,15%,18%)]" },
              { value: "system" as const, label: "Système", preview: "bg-gradient-to-r from-background to-[hsl(220,25%,10%)] border-border" },
            ]).map((t) => (
              <button
                key={t.value}
                onClick={() => applyTheme(t.value)}
                className={`rounded-lg border-2 p-4 text-center transition-all ${
                  theme === t.value
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className={`h-12 rounded-md mb-2 ${t.preview}`} />
                <span className="text-sm font-medium text-foreground">{t.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Options d'affichage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Mode compact</p>
              <p className="text-xs text-muted-foreground">Réduit l'espacement pour afficher plus de données.</p>
            </div>
            <Switch checked={compactMode} onCheckedChange={setCompactMode} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ───── Main Settings Page ───── */
const Settings = () => {
  return (
    <DashboardLayout title="Paramètres">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="gap-1.5">
            <Store size={14} /> Général
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell size={14} /> Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5">
            <CreditCard size={14} /> Facturation
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5">
            <Palette size={14} /> Apparence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general"><GeneralTab /></TabsContent>
        <TabsContent value="notifications"><NotificationsTab /></TabsContent>
        <TabsContent value="billing"><BillingTab /></TabsContent>
        <TabsContent value="appearance"><AppearanceTab /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Settings;
