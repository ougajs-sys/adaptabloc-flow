import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle, MessageCircle, Mail, Rocket, ShoppingCart, Users, Package, Plus, Send, Ticket, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useCallback } from "react";

const faqItems = [
  { q: "Comment créer ma première commande ?", a: "Allez dans Commandes > Nouvelle commande, remplissez les infos client et ajoutez les articles. La commande apparaîtra dans le pipeline." },
  { q: "Comment ajouter un membre à mon équipe ?", a: "Rendez-vous dans Équipe > Ajouter un membre. Choisissez un rôle (Caller, Préparateur ou Livreur) et entrez les infos du membre." },
  { q: "Comment activer un module payant ?", a: "Allez dans Modules, parcourez les modules disponibles et cliquez sur 'Activer'. Le coût mensuel sera recalculé automatiquement." },
  { q: "Comment fonctionne la facturation ?", a: "La facturation est modulaire : vous payez uniquement les modules activés. Le montant est calculé en temps réel dans la section Facturation." },
  { q: "Comment gérer mon stock ?", a: "Activez le module 'Gestion stock automatique' pour bénéficier des alertes de stock faible et de la mise à jour automatique après chaque commande." },
  { q: "Comment contacter le support ?", a: "Créez un ticket support ci-dessous ou envoyez-nous un email à support@intramate.app." },
];

const STATUS_LABELS: Record<string, string> = { open: "Ouvert", in_progress: "En cours", resolved: "Résolu", closed: "Fermé" };
const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-500",
  in_progress: "bg-amber-500/10 text-amber-500",
  resolved: "bg-emerald-500/10 text-emerald-500",
  closed: "bg-muted text-muted-foreground",
};
const PRIORITY_LABELS: Record<string, string> = { low: "Basse", medium: "Moyenne", high: "Haute" };

interface MyTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  comments_count?: number;
}

interface TicketComment {
  id: string;
  author_name: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

const Help = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

  // Ticket detail
  const [selectedTicket, setSelectedTicket] = useState<MyTicket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const loadTickets = useCallback(async () => {
    if (!user?.store_id) { setLoadingTickets(false); return; }
    const { data } = await supabase
      .from("support_tickets")
      .select("id, subject, status, priority, created_at")
      .eq("store_id", user.store_id)
      .order("created_at", { ascending: false });
    setTickets((data as any[]) || []);
    setLoadingTickets(false);
  }, [user?.store_id]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  async function handleSubmitTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.store_id || !subject.trim() || !description.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("support_tickets").insert({
      store_id: user.store_id,
      created_by: user.id,
      subject: subject.trim(),
      description: description.trim(),
      priority,
    } as any);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ticket créé", description: "Notre équipe va traiter votre demande." });
      setSubject("");
      setDescription("");
      setPriority("medium");
      setShowNewTicket(false);
      await loadTickets();
    }
    setSubmitting(false);
  }

  async function openTicketDetail(ticket: MyTicket) {
    setSelectedTicket(ticket);
    const { data } = await supabase
      .from("ticket_comments")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });
    setComments((data as any[]) || []);
  }

  async function handleSendComment() {
    if (!newComment.trim() || !selectedTicket || !user) return;
    setSendingComment(true);
    await supabase.from("ticket_comments").insert({
      ticket_id: selectedTicket.id,
      author_id: user.id,
      author_name: user.name,
      content: newComment.trim(),
      is_internal: false,
    } as any);
    setNewComment("");
    const { data } = await supabase
      .from("ticket_comments")
      .select("*")
      .eq("ticket_id", selectedTicket.id)
      .order("created_at", { ascending: true });
    setComments((data as any[]) || []);
    setSendingComment(false);
  }

  return (
    <DashboardLayout title="Aide & Support">
      <div className="space-y-8">
        {/* Quick start */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 font-[Space_Grotesk]">
              <Rocket size={20} className="text-primary" />
              Démarrage rapide
            </CardTitle>
            <CardDescription>3 étapes pour être opérationnel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { step: 1, icon: Package, title: "Ajoutez vos produits", desc: "Créez votre catalogue avec prix, variantes et stock." },
                { step: 2, icon: ShoppingCart, title: "Recevez des commandes", desc: "Créez ou importez vos premières commandes clients." },
                { step: 3, icon: Users, title: "Gérez votre équipe", desc: "Ajoutez callers, préparateurs et livreurs." },
              ].map((s) => (
                <div key={s.step} className="flex gap-3 p-3 rounded-lg border border-border bg-card">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{s.step}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Support Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Ticket size={18} className="text-primary" />
                Mes tickets support
              </CardTitle>
              <CardDescription>{tickets.length} ticket(s)</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowNewTicket(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nouveau ticket
            </Button>
          </CardHeader>
          <CardContent>
            {loadingTickets ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun ticket. Créez-en un si vous avez besoin d'aide !</p>
            ) : (
              <div className="space-y-2">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => openTicketDetail(t)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString("fr-FR")} · {PRIORITY_LABELS[t.priority]}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${STATUS_COLORS[t.status]}`}>
                      {STATUS_LABELS[t.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle size={18} className="text-primary" />
              Questions fréquentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-sm text-left">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contactez-nous</CardTitle>
            <CardDescription>Notre équipe est là pour vous aider.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2" onClick={() => window.open("mailto:support@intramate.app")}>
              <Mail size={16} /> Email
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => window.open("https://wa.me/22507000000")}>
              <MessageCircle size={16} /> WhatsApp
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau ticket support</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitTicket} className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sujet</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Décrivez brièvement votre problème"
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Donnez-nous le maximum de détails..."
                required
                maxLength={2000}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priorité</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Envoi..." : "Créer le ticket"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">{selectedTicket.subject}</DialogTitle>
                <div className="flex gap-2 mt-1">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selectedTicket.status]}`}>
                    {STATUS_LABELS[selectedTicket.status]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedTicket.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </DialogHeader>

              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" /> Messages
                </h4>
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">En attente de réponse de l'équipe support</p>
                ) : (
                  <div className="space-y-2">
                    {comments.map((c) => (
                      <div key={c.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium text-xs">{c.author_name}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p>{c.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTicket.status !== "closed" && (
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Écrire un message..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                )}
                {selectedTicket.status !== "closed" && (
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleSendComment} disabled={sendingComment || !newComment.trim()}>
                      <Send className="h-3.5 w-3.5 mr-1" /> Envoyer
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Help;
