import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ModuleGate } from "@/components/modules/ModuleGate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Info, Copy, Check, Loader2, Package, User, Phone, Hash, MapPin, ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  submissions_count: number;
  conversions_count: number;
}

const defaultStyle: FormStyle = {
  primaryColor: "#8B5CF6",
  brandName: "Ma Boutique",
  redirectUrl: "https://votresite.com/merci",
  successMessage: "Commande enregistrée avec succès",
};

// ─── Live Preview ────────────────────────────────────────────────
function FormPreview({
  style,
  products,
  selectedProductId,
}: {
  style: FormStyle;
  products: StoreProduct[];
  selectedProductId: string | null;
}) {
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const price = selectedProduct?.price ?? 0;
  const [qty, setQty] = useState(1);
  const total = price * qty;

  return (
    <div className="border rounded-xl p-5 bg-background space-y-4 text-sm">
      <div>
        <p className="text-xs text-muted-foreground">{style.brandName}</p>
        <h3 className="text-lg font-bold">Commander maintenant</h3>
        <p className="text-xs text-muted-foreground">
          Remplissez le formulaire pour passer votre commande
        </p>
      </div>

      {/* Produit */}
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

      {/* Nom */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium mb-1">
          <User size={13} className="text-muted-foreground" /> Nom complet
        </label>
        <input
          className="w-full border rounded-md p-2 text-sm bg-background"
          placeholder="Votre nom"
          disabled
        />
      </div>

      {/* Téléphone */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium mb-1">
          <Phone size={13} className="text-muted-foreground" /> Téléphone
        </label>
        <input
          className="w-full border rounded-md p-2 text-sm bg-background"
          placeholder="+225 XX XX XX XX"
          disabled
        />
      </div>

      {/* Quantité */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium mb-1">
          <Hash size={13} className="text-muted-foreground" /> Quantité
        </label>
        <input
          className="w-full border rounded-md p-2 text-sm bg-background"
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          type="number"
          min={1}
        />
      </div>

      {/* Adresse */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium mb-1">
          <MapPin size={13} className="text-muted-foreground" /> Adresse de livraison
        </label>
        <input
          className="w-full border rounded-md p-2 text-sm bg-background"
          placeholder="Votre adresse complète"
          disabled
        />
      </div>

      {/* Total */}
      {selectedProduct && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-muted-foreground">Total à payer</span>
          <span className="text-lg font-bold">{(total).toLocaleString("fr-FR")} FCFA</span>
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

// ─── Code generator ──────────────────────────────────────────────
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

  if (type === "elementor") {
    return `<!-- Code pour Elementor - Bloc HTML personnalisé -->
<iframe
  src="${src}"
  width="100%"
  height="650"
  style="border: none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"
  title="Formulaire de commande"
></iframe>`;
  }

  if (type === "wordpress") {
    return `<!-- Shortcode WordPress - Collez dans un bloc HTML -->
<iframe
  src="${src}"
  width="100%"
  height="650"
  style="border: none; border-radius: 12px;"
  title="Formulaire de commande"
></iframe>`;
  }

  return `<!-- HTML Simple - Copiez dans votre page -->
<iframe
  src="${src}"
  width="100%"
  height="650"
  style="border: none; border-radius: 12px;"
  title="Formulaire de commande"
></iframe>`;
}

// ─── Main Component ──────────────────────────────────────────────
const EmbedForms = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Style state
  const [style, setStyle] = useState<FormStyle>({ ...defaultStyle });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Fetch products
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

  // Fetch existing form (use first one or create one)
  const { data: form, isLoading } = useQuery({
    queryKey: ["embed-form", user?.store_id],
    queryFn: async () => {
      if (!user?.store_id) return null;
      const { data, error } = await supabase
        .from("embed_forms")
        .select("*")
        .eq("store_id", user.store_id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const s = data.style as any;
        if (s?.primaryColor) {
          setStyle({
            primaryColor: s.primaryColor || defaultStyle.primaryColor,
            brandName: s.brandName || defaultStyle.brandName,
            redirectUrl: s.redirectUrl || defaultStyle.redirectUrl,
            successMessage: s.successMessage || defaultStyle.successMessage,
          });
        }
        return data as unknown as EmbedForm;
      }
      return null;
    },
    enabled: !!user?.store_id,
  });

  // Auto-create form if none exists
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.store_id) throw new Error("No store");
      const { data, error } = await supabase
        .from("embed_forms")
        .insert({
          store_id: user.store_id,
          name: "Formulaire principal",
          fields: [] as any,
          style: style as any,
          status: "active",
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["embed-form"] });
    },
  });

  useEffect(() => {
    if (!isLoading && !form && user?.store_id) {
      createMutation.mutate();
    }
  }, [isLoading, form, user?.store_id]);

  // Save style
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form?.id) throw new Error("No form");
      const { error } = await supabase
        .from("embed_forms")
        .update({ style: style as any })
        .eq("id", form.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["embed-form"] });
      toast({ title: "Personnalisation sauvegardée" });
    },
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId) || null;

  const copyCode = (type: "elementor" | "wordpress" | "html") => {
    if (!form) return;
    const code = generateEmbedCode(form.id, style, selectedProduct, type);
    navigator.clipboard.writeText(code);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
    toast({ title: "Code copié !" });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Formulaires Embarquables">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Formulaires Embarquables">
      <ModuleGate moduleId="embed_forms">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold font-[Space_Grotesk]">Formulaires Embarquables</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Générez des codes iframe pour intégrer vos formulaires de commande dans WordPress/Elementor
            </p>
          </div>

          {/* How it works */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <Info size={18} className="text-primary mt-0.5 shrink-0" />
              <div className="text-sm space-y-1">
                <p className="font-semibold">Comment ça marche ?</p>
                <ol className="list-decimal list-inside text-muted-foreground space-y-0.5">
                  <li>Personnalisez votre branding ci-dessous</li>
                  <li>Sélectionnez un produit (optionnel)</li>
                  <li>Copiez le code généré dans votre page WordPress/Elementor</li>
                  <li>Les commandes arriveront automatiquement dans la section "Commandes"</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Main grid: Customization + Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Customization */}
            <Card>
              <CardContent className="p-6 space-y-5">
                <div>
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <span className="text-primary">⚙</span> Personnalisation
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Adaptez le formulaire à votre marque
                  </p>
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
                      Le client sera redirigé vers cette page après avoir passé commande (idéal pour Pixel Facebook)
                    </p>
                  </div>
                </div>

                <Button onClick={() => saveMutation.mutate()} className="w-full" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                  Sauvegarder la personnalisation
                </Button>
              </CardContent>
            </Card>

            {/* Right: Preview */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                  <span className="text-primary">👁</span> Aperçu du formulaire
                </h2>
                <div className="max-h-[500px] overflow-y-auto">
                  <FormPreview
                    style={style}
                    products={products}
                    selectedProductId={selectedProductId}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product pre-selection */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <span className="text-primary">⚙</span> Produit pré-sélectionné
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Optionnel - Le client pourra toujours changer
                </p>
              </div>

              <div className="space-y-1">
                <div
                  className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                    !selectedProductId
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedProductId(null)}
                >
                  <span className="font-medium text-sm">Aucun (formulaire générique)</span>
                </div>
                {products.map((p) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-lg cursor-pointer border transition-colors flex items-center justify-between ${
                      selectedProductId === p.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedProductId(p.id)}
                  >
                    <span className="font-medium text-sm">{p.name}</span>
                    <Badge variant={selectedProductId === p.id ? "secondary" : "outline"}>
                      {p.price.toLocaleString("fr-FR")} FCFA
                    </Badge>
                  </div>
                ))}
                {products.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">
                    Aucun produit actif. Ajoutez des produits dans la section Produits.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Integration code */}
          {form && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <span className="text-primary">&lt;&gt;</span> Code d'intégration
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Copiez le code correspondant à votre plateforme
                  </p>
                </div>

                <Tabs defaultValue="elementor">
                  <TabsList>
                    <TabsTrigger value="elementor">Elementor</TabsTrigger>
                    <TabsTrigger value="wordpress">WordPress</TabsTrigger>
                    <TabsTrigger value="html">HTML Simple</TabsTrigger>
                  </TabsList>

                  {(["elementor", "wordpress", "html"] as const).map((type) => {
                    const instructions =
                      type === "elementor"
                        ? ['Ajoutez un bloc "HTML personnalisé" dans Elementor', "Collez le code ci-dessous"]
                        : type === "wordpress"
                        ? ['Ajoutez un bloc "HTML personnalisé"', "Collez le code ci-dessous"]
                        : ["Copiez le code dans votre page HTML"];

                    return (
                      <TabsContent key={type} value={type} className="space-y-3">
                        <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-0.5">
                          {instructions.map((instr, i) => (
                            <li key={i}>{instr}</li>
                          ))}
                        </ol>
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
                    );
                  })}
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </ModuleGate>
    </DashboardLayout>
  );
};

export default EmbedForms;
