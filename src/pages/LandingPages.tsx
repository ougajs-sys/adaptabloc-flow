import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ModuleGate } from "@/components/modules/ModuleGate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Info, Copy, Check, Loader2, Plus, Pencil, Trash2, ArrowLeft, Lock,
  Globe, Eye, ExternalLink, Sparkles, Code as CodeIcon, FileCode,
  Layers, BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FREE_PAGES_LIMIT = 1;

interface LandingPage {
  id: string;
  store_id: string;
  product_id: string | null;
  embed_form_id: string | null;
  slug: string;
  title: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  mode: "template" | "html";
  template_data: TemplateData;
  html_content: string | null;
  status: "draft" | "published";
  views_count: number;
  conversions_count: number;
  created_at: string;
  published_at: string | null;
}

interface TemplateData {
  hero_title?: string;
  hero_subtitle?: string;
  hero_image_url?: string;
  cta_text?: string;
  primary_color?: string;
  features?: { title: string; description: string }[];
  show_form?: boolean;
}

const defaultTemplateData: TemplateData = {
  hero_title: "Découvrez notre offre",
  hero_subtitle: "Le meilleur produit à un prix imbattable",
  hero_image_url: "",
  cta_text: "Commander maintenant",
  primary_color: "#8B5CF6",
  features: [
    { title: "Livraison rapide", description: "Sous 24-48h dans toute la ville" },
    { title: "Paiement à la livraison", description: "Payez uniquement à la réception" },
    { title: "Satisfaction garantie", description: "Retour gratuit sous 7 jours" },
  ],
  show_form: true,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function generateUniqueSlug(base: string): string {
  const random = Math.random().toString(36).slice(2, 6);
  return `${slugify(base) || "page"}-${random}`;
}

// ─── Editor ──────────────────────────────────────────────────────────
function LandingPageEditor({ page, onBack }: { page: LandingPage; onBack: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const [title, setTitle] = useState(page.title);
  const [description, setDescription] = useState(page.description || "");
  const [slug, setSlug] = useState(page.slug);
  const [mode, setMode] = useState<"template" | "html">(page.mode);
  const [productId, setProductId] = useState<string | null>(page.product_id);
  const [embedFormId, setEmbedFormId] = useState<string | null>(page.embed_form_id);
  const [templateData, setTemplateData] = useState<TemplateData>({
    ...defaultTemplateData,
    ...(page.template_data || {}),
  });
  const [htmlContent, setHtmlContent] = useState(page.html_content || "");
  const [status, setStatus] = useState<"draft" | "published">(page.status);

  // Fetch products for selection
  const { data: products = [] } = useQuery({
    queryKey: ["products-for-lp", user?.store_id],
    queryFn: async () => {
      if (!user?.store_id) return [];
      const { data } = await supabase
        .from("products")
        .select("id, name, price")
        .eq("store_id", user.store_id)
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
    enabled: !!user?.store_id,
  });

  // Fetch embed forms for selection
  const { data: forms = [] } = useQuery({
    queryKey: ["embed-forms-for-lp", user?.store_id],
    queryFn: async () => {
      if (!user?.store_id) return [];
      const { data } = await supabase
        .from("embed_forms" as never)
        .select("id, name")
        .eq("store_id", user.store_id);
      return (data || []) as { id: string; name: string }[];
    },
    enabled: !!user?.store_id,
  });

  const saveMutation = useMutation({
    mutationFn: async (newStatus?: "draft" | "published") => {
      const finalStatus = newStatus ?? status;
      const { error } = await supabase
        .from("landing_pages" as never)
        .update({
          title,
          description: description || null,
          slug,
          mode,
          product_id: productId,
          embed_form_id: embedFormId,
          template_data: templateData as any,
          html_content: htmlContent || null,
          status: finalStatus,
          published_at: finalStatus === "published" ? new Date().toISOString() : null,
        } as never)
        .eq("id", page.id);
      if (error) throw error;
      setStatus(finalStatus);
    },
    onSuccess: (_data, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
      toast({
        title: newStatus === "published" ? "Page publiée !" : "Page sauvegardée",
        description: newStatus === "published" ? `Accessible sur ${publicUrl}` : undefined,
      });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const publicUrl = `${window.location.origin}/p/${slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout title="Landing Pages">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={18} />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold font-[Space_Grotesk] truncate">{title || "Sans titre"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={status === "published" ? "default" : "secondary"} className="text-xs">
                {status === "published" ? "Publiée" : "Brouillon"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {page.views_count} vue{page.views_count > 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {status === "published" && (
              <Button variant="outline" size="sm" asChild>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                  <ExternalLink size={14} /> Ouvrir
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveMutation.mutate("draft")}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
              Sauvegarder
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate("published")}
              disabled={saveMutation.isPending}
              className="gap-2"
            >
              <Globe size={14} /> {status === "published" ? "Republier" : "Publier"}
            </Button>
          </div>
        </div>

        {/* Public URL banner */}
        {status === "published" && (
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Globe size={18} className="text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">URL publique</p>
                <code className="text-sm font-mono truncate block">{publicUrl}</code>
              </div>
              <Button variant="outline" size="sm" onClick={copyUrl} className="gap-2 shrink-0">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copié" : "Copier"}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: settings */}
          <div className="space-y-6">
            {/* General */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-base font-semibold">Informations générales</h2>
                <div>
                  <Label>Titre de la page</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Promo Été 2026" />
                </div>
                <div>
                  <Label>Description courte</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description brève (utilisée pour le SEO et les partages)"
                    className="resize-none h-20"
                  />
                </div>
                <div>
                  <Label>URL (slug)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">/p/</span>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      placeholder="ma-promo"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Doit être unique. Caractères : lettres, chiffres et tirets.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Linked product & form */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-base font-semibold">Liaisons</h2>
                <div>
                  <Label>Produit lié (optionnel)</Label>
                  <Select value={productId || "none"} onValueChange={(v) => setProductId(v === "none" ? null : v)}>
                    <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun produit lié</SelectItem>
                      {products.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} — {p.price?.toLocaleString("fr-FR")} FCFA
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Formulaire intégré (optionnel)</Label>
                  <Select value={embedFormId || "none"} onValueChange={(v) => setEmbedFormId(v === "none" ? null : v)}>
                    <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun formulaire</SelectItem>
                      {forms.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Le formulaire de commande sera intégré à la page automatiquement.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Mode picker */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-base font-semibold">Mode d'édition</h2>
                <Tabs value={mode} onValueChange={(v) => setMode(v as "template" | "html")}>
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="template" className="gap-2">
                      <Sparkles size={14} /> Template
                    </TabsTrigger>
                    <TabsTrigger value="html" className="gap-2">
                      <FileCode size={14} /> HTML libre
                    </TabsTrigger>
                  </TabsList>

                  {/* TEMPLATE MODE */}
                  <TabsContent value="template" className="space-y-4 pt-4">
                    <div>
                      <Label>Titre principal (hero)</Label>
                      <Input
                        value={templateData.hero_title || ""}
                        onChange={(e) => setTemplateData({ ...templateData, hero_title: e.target.value })}
                        placeholder="Le meilleur produit de l'année"
                      />
                    </div>
                    <div>
                      <Label>Sous-titre</Label>
                      <Textarea
                        value={templateData.hero_subtitle || ""}
                        onChange={(e) => setTemplateData({ ...templateData, hero_subtitle: e.target.value })}
                        placeholder="Description accrocheuse"
                        className="resize-none h-20"
                      />
                    </div>
                    <div>
                      <Label>Image hero (URL)</Label>
                      <Input
                        value={templateData.hero_image_url || ""}
                        onChange={(e) => setTemplateData({ ...templateData, hero_image_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Texte du bouton</Label>
                      <Input
                        value={templateData.cta_text || ""}
                        onChange={(e) => setTemplateData({ ...templateData, cta_text: e.target.value })}
                        placeholder="Commander maintenant"
                      />
                    </div>
                    <div>
                      <Label>Couleur principale</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={templateData.primary_color || "#8B5CF6"}
                          onChange={(e) => setTemplateData({ ...templateData, primary_color: e.target.value })}
                          className="w-10 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={templateData.primary_color || ""}
                          onChange={(e) => setTemplateData({ ...templateData, primary_color: e.target.value })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* HTML MODE */}
                  <TabsContent value="html" className="space-y-3 pt-4">
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex gap-2 text-xs">
                      <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">
                        Votre HTML sera rendu dans un environnement isolé (sandbox). Les scripts
                        ne s'exécuteront pas. Le formulaire de commande s'ajoute automatiquement
                        en bas de page si vous en avez sélectionné un.
                      </p>
                    </div>
                    <Label>Code HTML</Label>
                    <Textarea
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      placeholder="<!DOCTYPE html>&#10;<html>&#10;<body>&#10;  <h1>Ma landing page</h1>&#10;</body>&#10;</html>"
                      className="font-mono text-xs h-96 resize-none"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right: live preview */}
          <div className="space-y-4">
            <Card className="sticky top-4">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <Eye size={16} /> Aperçu
                  </h2>
                  <Badge variant="outline" className="text-xs">
                    {mode === "template" ? "Template" : "HTML"}
                  </Badge>
                </div>
                <div className="rounded-lg border overflow-hidden bg-background" style={{ height: "70vh" }}>
                  {mode === "template" ? (
                    <TemplatePreview data={templateData} title={title} formId={embedFormId} />
                  ) : (
                    <HtmlPreview html={htmlContent} formId={embedFormId} />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── Template Preview (mirrored design, scaled for editor sidebar) ────
export function TemplatePreview({
  data,
  title,
  formId,
}: {
  data: TemplateData;
  title?: string;
  formId: string | null;
}) {
  const primary = data.primary_color || "#8B5CF6";
  const hasImage = !!data.hero_image_url;
  const heroText = hasImage ? "#fff" : "#111827";
  const heroSubtext = hasImage ? "rgba(255,255,255,.85)" : "#4B5563";

  return (
    <div className="h-full overflow-y-auto" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#fff", color: "#111827" }}>

      {/* Hero */}
      <div style={{ position: "relative", minHeight: "13rem", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
        {hasImage ? (
          <>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${data.hero_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,.45), rgba(0,0,0,.72))" }} />
          </>
        ) : (
          <>
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${primary}14, #fff)` }} />
            <div style={{ position: "absolute", top: "-3rem", right: "-3rem", width: "10rem", height: "10rem", borderRadius: "50%", background: `radial-gradient(circle, ${primary}28, transparent 68%)`, filter: "blur(20px)", pointerEvents: "none" }} />
          </>
        )}
        <div style={{ position: "relative", zIndex: 1, padding: "1.25rem", width: "100%" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: ".35rem", padding: ".25rem .75rem", borderRadius: "9999px", fontSize: ".68rem", fontWeight: 600, marginBottom: ".75rem", background: hasImage ? "rgba(255,255,255,.18)" : `${primary}18`, color: hasImage ? "#fff" : primary, border: hasImage ? "1px solid rgba(255,255,255,.25)" : `1px solid ${primary}35` }}>
            ★ Commande rapide
          </div>
          <h1 style={{ fontSize: "1.15rem", fontWeight: 800, color: heroText, lineHeight: 1.25, marginBottom: ".4rem", fontFamily: "'Space Grotesk', sans-serif" }}>
            {data.hero_title || title || "Titre de votre page"}
          </h1>
          {data.hero_subtitle && (
            <p style={{ fontSize: ".75rem", color: heroSubtext, lineHeight: 1.5, margin: 0 }}>{data.hero_subtitle}</p>
          )}
        </div>
      </div>

      {/* CTA button */}
      <div style={{ padding: ".75rem 1rem", background: "#fff", textAlign: "center" }}>
        <button style={{ display: "inline-flex", alignItems: "center", gap: ".4rem", padding: ".55rem 1.4rem", borderRadius: "9999px", background: primary, color: "#fff", fontWeight: 700, fontSize: ".78rem", border: "none", cursor: "default", boxShadow: `0 4px 16px ${primary}40` }}>
          {data.cta_text || "Commander maintenant"}
        </button>
      </div>

      {/* Features */}
      {data.features && data.features.length > 0 && (
        <div style={{ padding: ".75rem 1rem", background: "#F9FAFB" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: ".5rem" }}>
            {data.features.slice(0, 3).map((f, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: ".75rem", padding: ".75rem .5rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
                <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: ".4rem", background: `${primary}16`, color: primary, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto .5rem" }}>
                  <Check size={13} strokeWidth={3} />
                </div>
                <p style={{ fontSize: ".65rem", fontWeight: 700, color: "#111827", lineHeight: 1.3, margin: 0 }}>{f.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form section */}
      {formId ? (
        <div style={{ padding: "1rem", background: "#F9FAFB" }}>
          <div style={{ background: "#fff", borderRadius: "1rem", overflow: "hidden", boxShadow: "0 8px 25px rgba(0,0,0,.07)", border: "1px solid #F3F4F6" }}>
            <div style={{ padding: ".6rem 1rem", borderBottom: "1px solid #F9FAFB", background: "#FAFAFA" }}>
              <p style={{ fontSize: ".7rem", fontWeight: 600, color: "#6B7280", margin: 0 }}>Formulaire de commande</p>
            </div>
            <iframe
              src={`/embed/order?formId=${formId}&color=${primary.replace("#", "")}`}
              style={{ width: "100%", height: 520, border: "none", display: "block" }}
              title="Formulaire de commande"
            />
          </div>
        </div>
      ) : (
        <div style={{ padding: "1.25rem 1rem", textAlign: "center", background: "#F9FAFB" }}>
          <p style={{ fontSize: ".7rem", color: "#9CA3AF", margin: 0 }}>Sélectionnez un formulaire pour activer la commande</p>
        </div>
      )}
    </div>
  );
}

// ─── HTML Preview (sandboxed iframe) ─────────────────────────────────
export function HtmlPreview({ html, formId }: { html: string; formId: string | null }) {
  const formBlock = formId
    ? `<section style="padding:2rem 1rem;background:#F9FAFB"><div style="max-width:100%;margin:0 auto"><div style="background:#fff;border-radius:1rem;overflow:hidden;box-shadow:0 8px 25px rgba(0,0,0,.07)"><iframe src="/embed/order?formId=${formId}" style="width:100%;height:600px;border:none;display:block" title="Formulaire"></iframe></div></div></section>`
    : "";
  const fullHtml = (html || "<p style='padding:20px;color:#888;font-family:sans-serif;text-align:center'>Aucun HTML — collez votre code dans l'éditeur</p>") + formBlock;

  return (
    <iframe
      srcDoc={fullHtml}
      sandbox="allow-forms allow-popups"
      className="w-full h-full"
      style={{ border: "none" }}
      title="Aperçu HTML"
    />
  );
}

// ─── Main list view ──────────────────────────────────────────────────
const LandingPagesContent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingPage, setEditingPage] = useState<LandingPage | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [deletingPage, setDeletingPage] = useState<LandingPage | null>(null);

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["landing-pages", user?.store_id],
    queryFn: async () => {
      if (!user?.store_id) return [];
      const { data, error } = await supabase
        .from("landing_pages" as never)
        .select("*")
        .eq("store_id", user.store_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as LandingPage[];
    },
    enabled: !!user?.store_id,
  });

  const atLimit = pages.length >= FREE_PAGES_LIMIT;

  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      if (!user?.store_id) throw new Error("No store");
      const { data, error } = await supabase
        .from("landing_pages" as never)
        .insert({
          store_id: user.store_id,
          title,
          slug: generateUniqueSlug(title),
          mode: "template",
          template_data: defaultTemplateData as any,
          status: "draft",
        } as never)
        .select("*")
        .single();
      if (error) throw error;
      return data as LandingPage;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
      setCreateDialogOpen(false);
      setNewTitle("");
      setEditingPage(created);
      toast({ title: "Landing page créée" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("landing_pages" as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
      setDeletingPage(null);
      toast({ title: "Page supprimée" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  if (editingPage) {
    return <LandingPageEditor page={editingPage} onBack={() => setEditingPage(null)} />;
  }

  return (
    <DashboardLayout
      title="Landing Pages"
      actions={
        <Button
          size="sm"
          className="gap-2"
          disabled={atLimit}
          onClick={() => { setNewTitle(""); setCreateDialogOpen(true); }}
          title={atLimit ? `Limite gratuite atteinte (${FREE_PAGES_LIMIT} page max)` : undefined}
        >
          {atLimit ? <Lock size={14} /> : <Plus size={14} />}
          Nouvelle page
        </Button>
      }
    >
      {/* Create dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle landing page</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Titre de la page</Label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex: Promo Été 2026"
              onKeyDown={(e) => { if (e.key === "Enter" && newTitle.trim()) createMutation.mutate(newTitle.trim()); }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={() => createMutation.mutate(newTitle.trim())}
              disabled={!newTitle.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deletingPage} onOpenChange={(v) => { if (!v) setDeletingPage(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deletingPage?.title} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              La page deviendra inaccessible. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingPage && deleteMutation.mutate(deletingPage.id)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-[Space_Grotesk]">Landing Pages</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Créez des pages publiques liées à vos produits et formulaires de commande.
            Partagez le lien sur Instagram, WhatsApp, TikTok…
          </p>
        </div>

        {/* Free tier banner */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Layers size={18} className="text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">Plan gratuit — {pages.length} / {FREE_PAGES_LIMIT} page{FREE_PAGES_LIMIT > 1 ? "s" : ""} utilisée{pages.length > 1 ? "s" : ""}</p>
              <p className="text-muted-foreground mt-0.5">
                {atLimit
                  ? "Vous avez atteint la limite gratuite. Contactez-nous pour passer à la version Pro et créer des pages illimitées."
                  : `Il vous reste ${FREE_PAGES_LIMIT - pages.length} page${FREE_PAGES_LIMIT - pages.length > 1 ? "s" : ""} disponible${FREE_PAGES_LIMIT - pages.length > 1 ? "s" : ""}.`}
              </p>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        )}

        {!isLoading && pages.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="p-12 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Layers size={24} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">Aucune landing page</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Créez une page pour mettre en avant un produit ou une promo.
                </p>
              </div>
              <Button onClick={() => { setNewTitle(""); setCreateDialogOpen(true); }}>
                <Plus size={14} className="mr-2" /> Créer ma première page
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && pages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map((p) => (
              <Card key={p.id} className="border-border/60 hover:border-primary/40 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{p.title}</p>
                      <code className="text-xs text-muted-foreground truncate block mt-0.5">/p/{p.slug}</code>
                    </div>
                    <Badge variant={p.status === "published" ? "default" : "secondary"} className="text-xs shrink-0">
                      {p.status === "published" ? "Publiée" : "Brouillon"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Eye size={12} /> {p.views_count}
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 size={12} /> {p.conversions_count} conv.
                    </div>
                    <div className="flex items-center gap-1">
                      {p.mode === "template" ? <Sparkles size={12} /> : <CodeIcon size={12} />}
                      {p.mode === "template" ? "Template" : "HTML"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => setEditingPage(p)}>
                      <Pencil size={13} /> Éditer
                    </Button>
                    {p.status === "published" && (
                      <Button variant="outline" size="icon" asChild className="shrink-0">
                        <a href={`/p/${p.slug}`} target="_blank" rel="noopener noreferrer" title="Ouvrir">
                          <ExternalLink size={13} />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => setDeletingPage(p)}
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const LandingPages = () => (
  <ModuleGate moduleId="landing_pages">
    <LandingPagesContent />
  </ModuleGate>
);

export default LandingPages;
