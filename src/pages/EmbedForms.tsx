import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Info, Copy, Check, Loader2, Package, User, Phone, Hash, MapPin,
  ChevronDown, Plus, Pencil, Trash2, ArrowLeft, Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/contexts/ModulesContext";
import { useNavigate } from "react-router-dom";

const FREE_FORMS_LIMIT = 2;

interface FormStyle {
  primaryColor: string;
  brandName: string;
  redirectUrl: string;
  successMessage: string;
}

interface StoreProduct {
  id: string;
  name: string;
  price: number;
}

interface EmbedForm {
  id: string;
  name: string;
  status: "active" | "draft" | "archived";
  fields: any[];
  style: FormStyle;
  created_at: string;
}

const defaultStyle: FormStyle = {
  primaryColor: "#8B5CF6",
  brandName: "Ma Boutique",
  redirectUrl: "https://votresite.com/merci",
  successMessage: "Commande enregistrée avec succès",
};

// ─── Live Preview ────────────────────────────────────────────────
function FormPreview({ style, products, selectedProductId }: {
  style: FormStyle;
  products: StoreProduct[];
  selectedProductId: string | null;
}) {
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const price = selectedProduct?.price ?? 0;
  const [qty, setQty] = useState(1);

  return (
    <div className="border rounded-xl p-5 bg-background space-y-4 text-sm">
      <div>
        <p className="text-xs text-muted-foreground">{style.brandName}</p>
        <h3 className="text-lg font-bold">Commander maintenant</h3>
        <p className="text-xs text-muted-foreground">Remplissez le formulaire pour passer votre commande</p>
      </div>
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium mb-1">
          <Package size={13} className="text-muted-foreground" /> Produit
        </label>
        <div className="border rounded-md p-2 flex items-center justify-between bg-muted/30">
          <span className="text-muted-foreground text-sm">
            {selectedProduct ? selectedProduct.name : "Sélectionner un produit"}
          </span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </div>
      </div>
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium mb-1">
          <User size={13} className="text-muted-foreground" /> Nom complet
        </label>
        <input className="w-full border rounded-md p-2 text-sm bg-background" placeholder="Votre nom" disabled />
      </div>
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium mb-1">
          <Phone size={13} className="text-muted-foreground" /> Téléphone
        </label>
        <input className="w-full border rounded-md p-2 text-sm bg-background" placeholder="+225 XX XX XX XX" disabled />
      </div>
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium mb-1">
          <Hash size={13} className="text-muted-foreground" /> Quantité
        </label>
        <input
          className="w-full border rounded-md p-2 text-sm bg-background"
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          type="number" min={1}
        />
      </div>
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium mb-1">
          <MapPin size={13} className="text-muted-foreground" /> Adresse de livraison
        </label>
        <input className="w-full border rounded-md p-2 text-sm bg-background" placeholder="Votre adresse complète" disabled />
      </div>
      {selectedProduct && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-muted-foreground">Total à payer</span>
          <span className="text-lg font-bold">{(price * qty).toLocaleString("fr-FR")} FCFA</span>
        </div>
      )}
      <button
        className="w-full py-2.5 rounded-md text-white font-semibold text-sm"
        style={{ backgroundColor: style.primaryColor }}
        disabled
      >
        Confirmer ma commande
      </button>
    </div>
  );
}

// ─── Embed code generator ─────────────────────────────────────────
function generateEmbedCode(
  formId: string,
  style: FormStyle,
  selectedProduct: StoreProduct | null,
  type: "elementor" | "wordpress" | "html"
): string {
  const baseUrl = `${window.location.origin}/embed/order`;
  const params = new URLSearchParams({
    brand: style.brandName,
    color: style.primaryColor.replace("#", ""),
    formId,
    ...(style.redirectUrl && { redirect: style.redirectUrl }),
    ...(selectedProduct && { productId: selectedProduct.id }),
  });
  const src = `${baseUrl}?${params.toString()}`;
  return `<iframe
  src="${src}"
  width="100%"
  height="650"
  style="border: none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"
  title="Formulaire de commande"
></iframe>`;
}

// ─── Form Editor ──────────────────────────────────────────────────
function FormEditor({ form, onBack }: { form: EmbedForm; onBack: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [style, setStyle] = useState<FormStyle>({
    primaryColor: (form.style as any)?.primaryColor || defaultStyle.primaryColor,
    brandName: (form.style as any)?.brandName || defaultStyle.brandName,
    redirectUrl: (form.style as any)?.redirectUrl || defaultStyle.redirectUrl,
    successMessage: (form.style as any)?.successMessage || defaultStyle.successMessage,
  });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-form", user?.store_id],
    queryFn: async () => {
      if (!user?.store_id) return [];
      const { data } = await supabase
        .from("products")
        .select("id, name, price")
        .eq("store_id", user.store_id)
        .eq("is_active", true)
        .order("name");
      return (data || []) as StoreProduct[];
    },
    enabled: !!user?.store_id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("embed_forms" as never)
        .update({ style: style as any, name: style.brandName || form.name } as never)
        .eq("id", form.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["embed-forms"] });
      toast({ title: "Formulaire sauvegardé" });
    },
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId) || null;

  const copyCode = (type: "elementor" | "wordpress" | "html") => {
    const code = generateEmbedCode(form.id, style, selectedProduct, type);
    navigator.clipboard.writeText(code);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
    toast({ title: "Code copié !" });
  };

  return (
    <DashboardLayout title="Formulaires Embarquables">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-[Space_Grotesk]">{form.name}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Personnalisez et récupérez le code d'intégration</p>
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Info size={18} className="text-primary mt-0.5 shrink-0" />
            <div className="text-sm space-y-0.5">
              <p className="font-semibold">Comment ça marche ?</p>
              <ol className="list-decimal list-inside text-muted-foreground space-y-0.5">
                <li>Personnalisez votre branding ci-dessous</li>
                <li>Sélectionnez un produit (optionnel)</li>
                <li>Copiez le code dans votre page WordPress/Elementor</li>
                <li>Les commandes arrivent automatiquement dans "Commandes"</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold">⚙ Personnalisation</h2>
                <p className="text-xs text-muted-foreground mt-1">Adaptez le formulaire à votre marque</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Nom de la marque</Label>
                  <Input
                    value={style.brandName}
                    onChange={(e) => setStyle({ ...style, brandName: e.target.value })}
                    placeholder="Ma Boutique"
                  />
                </div>
                <div>
                  <Label>Couleur principale</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={style.primaryColor}
                      onChange={(e) => setStyle({ ...style, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={style.primaryColor}
                      onChange={(e) => setStyle({ ...style, primaryColor: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>URL de redirection après commande</Label>
                  <Input
                    value={style.redirectUrl}
                    onChange={(e) => setStyle({ ...style, redirectUrl: e.target.value })}
                    placeholder="https://votresite.com/merci"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Le client sera redirigé après commande (idéal pour Pixel Facebook)
                  </p>
                </div>
              </div>
              <Button onClick={() => saveMutation.mutate()} className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                Sauvegarder
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-base font-semibold mb-4">👁 Aperçu du formulaire</h2>
              <div className="max-h-[500px] overflow-y-auto">
                <FormPreview style={style} products={products} selectedProductId={selectedProductId} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold">⚙ Produit pré-sélectionné</h2>
              <p className="text-xs text-muted-foreground mt-1">Optionnel — le client pourra toujours changer</p>
            </div>
            <div className="space-y-1">
              <div
                className={`p-3 rounded-lg cursor-pointer border transition-colors ${!selectedProductId ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted/50"}`}
                onClick={() => setSelectedProductId(null)}
              >
                <span className="font-medium text-sm">Aucun (formulaire générique)</span>
              </div>
              {products.map((p) => (
                <div
                  key={p.id}
                  className={`p-3 rounded-lg cursor-pointer border transition-colors flex items-center justify-between ${selectedProductId === p.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted/50"}`}
                  onClick={() => setSelectedProductId(p.id)}
                >
                  <span className="font-medium text-sm">{p.name}</span>
                  <Badge variant={selectedProductId === p.id ? "secondary" : "outline"}>
                    {p.price.toLocaleString("fr-FR")} FCFA
                  </Badge>
                </div>
              ))}
              {products.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">Aucun produit actif.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold">&lt;&gt; Code d'intégration</h2>
              <p className="text-xs text-muted-foreground mt-1">Copiez le code correspondant à votre plateforme</p>
            </div>
            <Tabs defaultValue="elementor">
              <TabsList>
                <TabsTrigger value="elementor">Elementor</TabsTrigger>
                <TabsTrigger value="wordpress">WordPress</TabsTrigger>
                <TabsTrigger value="html">HTML Simple</TabsTrigger>
              </TabsList>
              {(["elementor", "wordpress", "html"] as const).map((type) => (
                <TabsContent key={type} value={type} className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {type === "html"
                      ? "Copiez le code dans votre page HTML"
                      : `Ajoutez un bloc "HTML personnalisé" dans ${type === "elementor" ? "Elementor" : "WordPress"} et collez le code`}
                  </p>
                  <div className="relative">
                    <pre className="bg-muted/50 rounded-lg p-4 text-xs overflow-x-auto max-h-48 font-mono whitespace-pre-wrap">
                      {generateEmbedCode(form.id, style, selectedProduct, type)}
                    </pre>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => copyCode(type)}
                    >
                      {copiedType === type ? <Check size={14} /> : <Copy size={14} />}
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// ─── Main Component (list view) ───────────────────────────────────
const EmbedForms = () => {
  const { user } = useAuth();
  const { hasModule } = useModules();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingForm, setEditingForm] = useState<EmbedForm | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [deletingForm, setDeletingForm] = useState<EmbedForm | null>(null);

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ["embed-forms", user?.store_id],
    queryFn: async () => {
      if (!user?.store_id) return [];
      const { data, error } = await supabase
        .from("embed_forms" as never)
        .select("*")
        .eq("store_id", user.store_id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as EmbedForm[];
    },
    enabled: !!user?.store_id,
  });

  const hasExtraForms = hasModule("extra_forms");
  const effectiveLimit = hasExtraForms ? FREE_FORMS_LIMIT + 3 : FREE_FORMS_LIMIT;
  const atLimit = forms.length >= effectiveLimit;

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user?.store_id) throw new Error("No store");
      const { data, error } = await supabase
        .from("embed_forms" as never)
        .insert({
          store_id: user.store_id,
          name,
          fields: [] as any,
          style: defaultStyle as any,
          status: "active",
        } as never)
        .select("*")
        .single();
      if (error) throw error;
      return data as EmbedForm;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["embed-forms"] });
      setCreateDialogOpen(false);
      setNewFormName("");
      setEditingForm(created);
      toast({ title: "Formulaire créé" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (formId: string) => {
      const { error } = await supabase
        .from("embed_forms" as never)
        .delete()
        .eq("id", formId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["embed-forms"] });
      setDeletingForm(null);
      toast({ title: "Formulaire supprimé" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  if (editingForm) {
    return <FormEditor form={editingForm} onBack={() => setEditingForm(null)} />;
  }

  return (
    <DashboardLayout
      title="Formulaires Embarquables"
      actions={
        <Button
          size="sm"
          className="gap-2"
          disabled={atLimit}
          onClick={() => { setNewFormName(""); setCreateDialogOpen(true); }}
          title={atLimit ? `Limite gratuite atteinte (${FREE_FORMS_LIMIT} formulaires max)` : undefined}
        >
          {atLimit ? <Lock size={14} /> : <Plus size={14} />}
          Nouveau formulaire
        </Button>
      }
    >
      {/* Create dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau formulaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Nom du formulaire</Label>
            <Input
              value={newFormName}
              onChange={(e) => setNewFormName(e.target.value)}
              placeholder="Ex: Formulaire principal, Landing page promo..."
              onKeyDown={(e) => { if (e.key === "Enter" && newFormName.trim()) createMutation.mutate(newFormName.trim()); }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={() => createMutation.mutate(newFormName.trim())}
              disabled={!newFormName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingForm} onOpenChange={(v) => { if (!v) setDeletingForm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deletingForm?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ce formulaire et tous ses paramètres seront supprimés définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingForm && deleteMutation.mutate(deletingForm.id)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        {/* Header info */}
        <div>
          <h1 className="text-2xl font-bold font-[Space_Grotesk]">Formulaires Embarquables</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Créez des formulaires de commande et intégrez-les sur vos landing pages WordPress, Elementor ou HTML.
          </p>
        </div>

        {/* Quota banner */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Info size={18} className="text-primary mt-0.5 shrink-0" />
            <div className="text-sm flex-1">
              <p className="font-semibold">
                {hasExtraForms ? "Plan étendu" : "Plan gratuit"} — {forms.length} / {effectiveLimit} formulaires utilisés
              </p>
              <p className="text-muted-foreground mt-0.5">
                {atLimit
                  ? "Limite atteinte. Achetez le module \"+3 Formulaires\" pour en créer davantage."
                  : `Il vous reste ${effectiveLimit - forms.length} formulaire${effectiveLimit - forms.length > 1 ? "s" : ""} disponible${effectiveLimit - forms.length > 1 ? "s" : ""}.`}
              </p>
            </div>
            {atLimit && (
              <Button size="sm" onClick={() => navigate("/dashboard/modules")} className="shrink-0">
                Acheter +3
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && forms.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="p-12 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus size={24} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">Aucun formulaire</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Créez votre premier formulaire de commande et intégrez-le sur votre site.
                </p>
              </div>
              <Button onClick={() => { setNewFormName(""); setCreateDialogOpen(true); }}>
                <Plus size={14} className="mr-2" /> Créer mon premier formulaire
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Forms list */}
        {!isLoading && forms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forms.map((form) => (
              <Card key={form.id} className="border-border/60 hover:border-primary/40 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{form.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Créé le {new Date(form.created_at).toLocaleDateString("fr-FR")}
                      </p>
                      <Badge
                        variant={form.status === "active" ? "default" : "secondary"}
                        className="mt-2 text-xs"
                      >
                        {form.status === "active" ? "Actif" : form.status === "draft" ? "Brouillon" : "Archivé"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingForm(form)}
                        title="Modifier"
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingForm(form)}
                        title="Supprimer"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 gap-2"
                    onClick={() => setEditingForm(form)}
                  >
                    <Pencil size={13} /> Configurer & obtenir le code
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmbedForms;
