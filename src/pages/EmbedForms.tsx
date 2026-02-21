import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ModuleGate } from "@/components/modules/ModuleGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Copy, Eye, Code, BarChart3, Trash2, ExternalLink, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmbedForm {
  id: string;
  name: string;
  status: "active" | "draft";
  fields: FormField[];
  style: FormStyle;
  createdAt: string;
  submissions: number;
  conversions: number;
}

interface FormField {
  id: string;
  type: "text" | "email" | "phone" | "select" | "number" | "address";
  label: string;
  placeholder: string;
  required: boolean;
}

interface FormStyle {
  primaryColor: string;
  borderRadius: string;
  buttonText: string;
  successMessage: string;
}

const defaultFields: FormField[] = [
  { id: "1", type: "text", label: "Nom complet", placeholder: "Votre nom", required: true },
  { id: "2", type: "phone", label: "Téléphone", placeholder: "+225 07 00 00 00", required: true },
  { id: "3", type: "address", label: "Adresse de livraison", placeholder: "Votre adresse", required: true },
  { id: "4", type: "select", label: "Produit", placeholder: "Choisir un produit", required: true },
  { id: "5", type: "number", label: "Quantité", placeholder: "1", required: true },
];

const defaultStyle: FormStyle = {
  primaryColor: "#6366f1",
  borderRadius: "8px",
  buttonText: "Commander maintenant",
  successMessage: "Merci ! Votre commande a été enregistrée. Nous vous contacterons sous peu.",
};

const mockForms: EmbedForm[] = [
  {
    id: "f1",
    name: "Formulaire Landing Page Principale",
    status: "active",
    fields: defaultFields,
    style: defaultStyle,
    createdAt: "2025-01-15",
    submissions: 247,
    conversions: 189,
  },
  {
    id: "f2",
    name: "Formulaire Promo Facebook",
    status: "draft",
    fields: defaultFields.slice(0, 3),
    style: { ...defaultStyle, primaryColor: "#1877F2", buttonText: "Profiter de l'offre" },
    createdAt: "2025-02-01",
    submissions: 0,
    conversions: 0,
  },
];

function generateEmbedCode(form: EmbedForm, type: "html" | "wordpress" | "elementor"): string {
  const baseUrl = "https://app.easyflow.africa/embed";
  if (type === "html") {
    return `<!-- EasyFlow Formulaire Embarqué -->
<div id="easyflow-form-${form.id}"></div>
<script src="${baseUrl}/sdk.js"></script>
<script>
  EasyFlow.init({
    formId: "${form.id}",
    container: "#easyflow-form-${form.id}",
    theme: {
      primaryColor: "${form.style.primaryColor}",
      borderRadius: "${form.style.borderRadius}"
    }
  });
</script>`;
  }
  if (type === "wordpress") {
    return `[easyflow_form id="${form.id}" color="${form.style.primaryColor}" radius="${form.style.borderRadius}"]

<!-- Ou en shortcode PHP dans votre thème : -->
<?php echo do_shortcode('[easyflow_form id="${form.id}"]'); ?>`;
  }
  return `<!-- Elementor : Ajouter un widget HTML personnalisé -->
<!-- Collez ce code dans un widget "HTML" d'Elementor -->
<div id="easyflow-form-${form.id}"></div>
<script src="${baseUrl}/sdk.js"></script>
<script>
  EasyFlow.init({
    formId: "${form.id}",
    container: "#easyflow-form-${form.id}"
  });
</script>`;
}

function FormPreview({ form }: { form: EmbedForm }) {
  return (
    <div
      className="border rounded-lg p-6 bg-background max-w-md mx-auto"
      style={{ borderRadius: form.style.borderRadius }}
    >
      <h3 className="text-lg font-semibold mb-4">Passer commande</h3>
      <div className="space-y-3">
        {form.fields.map((field) => (
          <div key={field.id}>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </label>
            {field.type === "select" ? (
              <select className="w-full border rounded-md p-2 text-sm bg-background" disabled>
                <option>{field.placeholder}</option>
              </select>
            ) : (
              <input
                type={field.type === "phone" ? "tel" : field.type}
                placeholder={field.placeholder}
                className="w-full border rounded-md p-2 text-sm bg-background"
                disabled
              />
            )}
          </div>
        ))}
      </div>
      <button
        className="w-full mt-4 py-2.5 rounded-md text-white font-medium text-sm"
        style={{ backgroundColor: form.style.primaryColor, borderRadius: form.style.borderRadius }}
        disabled
      >
        {form.style.buttonText}
      </button>
    </div>
  );
}

function FormBuilderDialog({
  form,
  onSave,
  trigger,
}: {
  form?: EmbedForm;
  onSave: (f: EmbedForm) => void;
  trigger: React.ReactNode;
}) {
  const [name, setName] = useState(form?.name ?? "");
  const [fields, setFields] = useState<FormField[]>(form?.fields ?? [...defaultFields]);
  const [style, setStyle] = useState<FormStyle>(form?.style ?? { ...defaultStyle });
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    const saved: EmbedForm = {
      id: form?.id ?? `f${Date.now()}`,
      name: name || "Nouveau formulaire",
      status: "draft",
      fields,
      style,
      createdAt: form?.createdAt ?? new Date().toISOString().slice(0, 10),
      submissions: form?.submissions ?? 0,
      conversions: form?.conversions ?? 0,
    };
    onSave(saved);
    setOpen(false);
  };

  const addField = () => {
    setFields([
      ...fields,
      { id: String(Date.now()), type: "text", label: "Nouveau champ", placeholder: "", required: false },
    ]);
  };

  const removeField = (id: string) => setFields(fields.filter((f) => f.id !== id));

  const updateField = (id: string, updates: Partial<FormField>) =>
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form ? "Modifier le formulaire" : "Nouveau formulaire"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Builder */}
          <div className="space-y-4">
            <div>
              <Label>Nom du formulaire</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Landing Page Promo" />
            </div>

            <div>
              <Label className="mb-2 block">Champs du formulaire</Label>
              <div className="space-y-2">
                {fields.map((field) => (
                  <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                    <Select
                      value={field.type}
                      onValueChange={(v) => updateField(field.id, { type: v as FormField["type"] })}
                    >
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texte</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Tél.</SelectItem>
                        <SelectItem value="number">Nombre</SelectItem>
                        <SelectItem value="address">Adresse</SelectItem>
                        <SelectItem value="select">Liste</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      className="h-8 text-sm flex-1"
                      placeholder="Label"
                    />
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={field.required}
                        onCheckedChange={(v) => updateField(field.id, { required: v })}
                      />
                      <span className="text-xs text-muted-foreground">Req.</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeField(field.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-2" onClick={addField}>
                <Plus size={14} className="mr-1" /> Ajouter un champ
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Couleur principale</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={style.primaryColor}
                    onChange={(e) => setStyle({ ...style, primaryColor: e.target.value })}
                    className="w-8 h-8 rounded border cursor-pointer"
                  />
                  <Input
                    value={style.primaryColor}
                    onChange={(e) => setStyle({ ...style, primaryColor: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div>
                <Label>Rayon des bords</Label>
                <Input
                  value={style.borderRadius}
                  onChange={(e) => setStyle({ ...style, borderRadius: e.target.value })}
                  placeholder="8px"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div>
              <Label>Texte du bouton</Label>
              <Input
                value={style.buttonText}
                onChange={(e) => setStyle({ ...style, buttonText: e.target.value })}
                className="text-sm"
              />
            </div>

            <div>
              <Label>Message de succès</Label>
              <Textarea
                value={style.successMessage}
                onChange={(e) => setStyle({ ...style, successMessage: e.target.value })}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>

          {/* Preview */}
          <div>
            <Label className="mb-2 block">Aperçu</Label>
            <div className="border rounded-lg p-4 bg-muted/20">
              <FormPreview form={{ id: "preview", name, status: "draft", fields, style, createdAt: "", submissions: 0, conversions: 0 }} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={handleSave}>Enregistrer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const EmbedForms = () => {
  const [forms, setForms] = useState<EmbedForm[]>(mockForms);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSaveForm = (form: EmbedForm) => {
    setForms((prev) => {
      const exists = prev.find((f) => f.id === form.id);
      if (exists) return prev.map((f) => (f.id === form.id ? form : f));
      return [...prev, form];
    });
    toast({ title: "Formulaire enregistré" });
  };

  const handleDelete = (id: string) => {
    setForms((prev) => prev.filter((f) => f.id !== id));
    toast({ title: "Formulaire supprimé" });
  };

  const handleToggleStatus = (id: string) => {
    setForms((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: f.status === "active" ? "draft" : "active" } : f))
    );
  };

  const copyCode = (form: EmbedForm, type: "html" | "wordpress" | "elementor") => {
    const code = generateEmbedCode(form, type);
    navigator.clipboard.writeText(code);
    setCopiedId(`${form.id}-${type}`);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Code copié !" });
  };

  return (
    <DashboardLayout title="Formulaires embarqués">
      <ModuleGate moduleId="embed_forms">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Formulaires actifs</p>
              <p className="text-2xl font-bold font-[Space_Grotesk]">{forms.filter((f) => f.status === "active").length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total soumissions</p>
              <p className="text-2xl font-bold font-[Space_Grotesk]">{forms.reduce((s, f) => s + f.submissions, 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Taux de conversion</p>
              <p className="text-2xl font-bold font-[Space_Grotesk]">
                {forms.reduce((s, f) => s + f.submissions, 0) > 0
                  ? `${Math.round((forms.reduce((s, f) => s + f.conversions, 0) / forms.reduce((s, f) => s + f.submissions, 0)) * 100)}%`
                  : "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action bar */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Mes formulaires</h2>
          <FormBuilderDialog
            onSave={handleSaveForm}
            trigger={
              <Button size="sm">
                <Plus size={16} className="mr-1" /> Nouveau formulaire
              </Button>
            }
          />
        </div>

        {/* Forms list */}
        <div className="space-y-4">
          {forms.map((form) => (
            <Card key={form.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">{form.name}</CardTitle>
                    <Badge variant={form.status === "active" ? "default" : "secondary"}>
                      {form.status === "active" ? "Actif" : "Brouillon"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.status === "active"}
                      onCheckedChange={() => handleToggleStatus(form.id)}
                    />
                    <FormBuilderDialog
                      form={form}
                      onSave={handleSaveForm}
                      trigger={
                        <Button variant="outline" size="sm">
                          Modifier
                        </Button>
                      }
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(form.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                  <span><BarChart3 size={14} className="inline mr-1" />{form.submissions} soumissions</span>
                  <span><Check size={14} className="inline mr-1" />{form.conversions} conversions</span>
                  <span>Créé le {form.createdAt}</span>
                </div>

                <Tabs defaultValue="html" className="w-full">
                  <TabsList className="h-8">
                    <TabsTrigger value="html" className="text-xs px-3 h-7">HTML</TabsTrigger>
                    <TabsTrigger value="wordpress" className="text-xs px-3 h-7">WordPress</TabsTrigger>
                    <TabsTrigger value="elementor" className="text-xs px-3 h-7">Elementor</TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs px-3 h-7">Aperçu</TabsTrigger>
                  </TabsList>

                  {(["html", "wordpress", "elementor"] as const).map((type) => (
                    <TabsContent key={type} value={type}>
                      <div className="relative">
                        <pre className="bg-muted/50 rounded-md p-3 text-xs overflow-x-auto max-h-40 font-mono">
                          {generateEmbedCode(form, type)}
                        </pre>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2 h-7 text-xs"
                          onClick={() => copyCode(form, type)}
                        >
                          {copiedId === `${form.id}-${type}` ? (
                            <><Check size={12} className="mr-1" /> Copié</>
                          ) : (
                            <><Copy size={12} className="mr-1" /> Copier</>
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  ))}

                  <TabsContent value="preview">
                    <FormPreview form={form} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      </ModuleGate>
    </DashboardLayout>
  );
};

export default EmbedForms;
