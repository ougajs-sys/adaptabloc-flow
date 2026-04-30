import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Mail,
  MessageCircle,
  MessageSquare,
  Loader2,
  Pencil,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Template {
  id: string;
  name: string;
  type: "sms" | "whatsapp" | "email";
  content: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
}

const VARIABLES = [
  { tag: "{{client}}", label: "Nom du client" },
  { tag: "{{commande}}", label: "Numéro de commande" },
  { tag: "{{total}}", label: "Montant total" },
  { tag: "{{boutique}}", label: "Nom de la boutique" },
  { tag: "{{lien_suivi}}", label: "Lien de suivi" },
  { tag: "{{date}}", label: "Date du jour" },
];

const TYPE_CONFIG = {
  sms: { label: "SMS", icon: MessageSquare, color: "bg-primary/10 text-primary border-primary/30" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, color: "bg-accent/10 text-accent border-accent/30" },
  email: { label: "Email", icon: Mail, color: "bg-[hsl(280,80%,55%)]/10 text-[hsl(280,80%,55%)] border-[hsl(280,80%,55%)]/30" },
};

const Templates = () => {
  const { user } = useAuth();
  const storeId = user?.store_id;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState<Template | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    type: "whatsapp" as Template["type"],
    content: "",
    description: "",
  });

  const fetchTemplates = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("message_templates" as never)
      .select("*")
      .eq("store_id" as never, storeId as never)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    setTemplates((data as unknown as Template[]) || []);
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", type: "whatsapp", content: "", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({
      name: t.name,
      type: t.type,
      content: t.content,
      description: t.description ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!storeId) return;
    if (!form.name.trim() || !form.content.trim()) {
      toast({ title: "Champs requis", description: "Nom et contenu obligatoires", variant: "destructive" });
      return;
    }

    if (editing) {
      const { error } = await supabase
        .from("message_templates" as never)
        .update({
          name: form.name,
          type: form.type,
          content: form.content,
          description: form.description || null,
        } as never)
        .eq("id" as never, editing.id as never);
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Template modifié" });
    } else {
      const { error } = await supabase.from("message_templates" as never).insert({
        store_id: storeId,
        name: form.name,
        type: form.type,
        content: form.content,
        description: form.description || null,
        created_by: user?.id ?? null,
      } as never);
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Template créé" });
    }

    setDialogOpen(false);
    fetchTemplates();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase
      .from("message_templates" as never)
      .delete()
      .eq("id" as never, deleting.id as never);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Template supprimé" });
    }
    setDeleting(null);
    fetchTemplates();
  };

  const insertVariable = (tag: string) => {
    setForm((prev) => ({ ...prev, content: prev.content + tag }));
  };

  const copyContent = async (t: Template) => {
    await navigator.clipboard.writeText(t.content);
    setCopied(t.id);
    setTimeout(() => setCopied(null), 1500);
  };

  if (loading) {
    return (
      <DashboardLayout title="Templates de messages">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Templates de messages"
      actions={
        <Button size="sm" onClick={openNew} className="gap-2">
          <Plus size={16} /> Nouveau template
        </Button>
      }
    >
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <p className="text-sm text-foreground">
          <span className="font-semibold">Variables disponibles :</span>{" "}
          {VARIABLES.map((v) => (
            <code
              key={v.tag}
              className="inline-block mr-1.5 mb-1 px-1.5 py-0.5 rounded bg-card border border-border/60 text-xs font-mono text-primary"
              title={v.label}
            >
              {v.tag}
            </code>
          ))}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Utilisez ces variables dans vos messages — elles seront remplacées automatiquement à l'envoi.
        </p>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border/60 rounded-xl">
          <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucun template</p>
          <p className="text-sm mt-1">
            Créez votre premier template pour gagner du temps sur vos communications.
          </p>
          <Button size="sm" onClick={openNew} className="gap-2 mt-4">
            <Plus size={14} /> Créer un template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => {
            const cfg = TYPE_CONFIG[t.type];
            const Icon = cfg.icon;
            return (
              <Card key={t.id} className="border-border/60 hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-card-foreground truncate">{t.name}</h3>
                      {t.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={`${cfg.color} text-xs gap-1 shrink-0`}>
                      <Icon size={11} />
                      {cfg.label}
                    </Badge>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-3 text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed line-clamp-4 min-h-[80px]">
                    {t.content}
                  </div>

                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyContent(t)}
                      className="flex-1 gap-1.5 h-8 text-xs"
                    >
                      {copied === t.id ? (
                        <>
                          <Check size={12} className="text-accent" />
                          Copié
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Copier
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(t)}
                      className="h-8 px-2"
                    >
                      <Pencil size={12} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleting(t)}
                      className="h-8 px-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le template" : "Nouveau template"}</DialogTitle>
            <DialogDescription>
              Créez un message réutilisable avec des variables dynamiques.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="t-name">Nom du template</Label>
              <Input
                id="t-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Confirmation commande"
              />
            </div>

            <div>
              <Label htmlFor="t-type">Type de message</Label>
              <Select
                value={form.type}
                onValueChange={(v: Template["type"]) => setForm({ ...form, type: v })}
              >
                <SelectTrigger id="t-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="t-desc">Description (optionnel)</Label>
              <Input
                id="t-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex: Envoyé après confirmation par téléphone"
              />
            </div>

            <div>
              <Label htmlFor="t-content">Contenu du message</Label>
              <Textarea
                id="t-content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Bonjour {{client}}, votre commande {{commande}} de {{total}} F est confirmée."
                rows={6}
                className="font-mono text-sm"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {VARIABLES.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => insertVariable(v.tag)}
                    className="text-xs px-2 py-1 rounded border border-border/60 bg-muted/40 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors font-mono"
                    title={v.label}
                  >
                    {v.tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              {editing ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer "{deleting?.name}" ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Templates;
