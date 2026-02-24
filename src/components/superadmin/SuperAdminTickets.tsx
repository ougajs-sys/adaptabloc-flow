import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, MessageSquare, Clock, CheckCircle, AlertTriangle, Send, User } from "lucide-react";

const STATUS_LABELS: Record<string, string> = { open: "Ouvert", in_progress: "En cours", resolved: "Résolu", closed: "Fermé" };
const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-500",
  in_progress: "bg-amber-500/10 text-amber-500",
  resolved: "bg-emerald-500/10 text-emerald-500",
  closed: "bg-muted text-muted-foreground",
};
const PRIORITY_LABELS: Record<string, string> = { low: "Basse", medium: "Moyenne", high: "Haute" };
const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-500/10 text-amber-500",
  high: "bg-destructive/10 text-destructive",
};

interface Ticket {
  id: string;
  store_id: string;
  created_by: string;
  assigned_to: string | null;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  store_name?: string;
  creator_name?: string;
}

interface Comment {
  id: string;
  author_name: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

interface TeamMember {
  user_id: string;
  name: string;
}

export default function SuperAdminTickets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);

  const loadTickets = useCallback(async () => {
    const { data: ticketsData } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (!ticketsData) { setLoading(false); return; }

    // Enrich with store names and creator names
    const storeIds = [...new Set(ticketsData.map((t: any) => t.store_id))];
    const creatorIds = [...new Set(ticketsData.map((t: any) => t.created_by))];

    const [storesRes, profilesRes] = await Promise.all([
      supabase.from("stores").select("id, name").in("id", storeIds),
      supabase.from("profiles").select("user_id, name").in("user_id", creatorIds),
    ]);

    const storeMap = new Map((storesRes.data || []).map((s: any) => [s.id, s.name]));
    const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p.name]));

    setTickets(ticketsData.map((t: any) => ({
      ...t,
      store_name: storeMap.get(t.store_id) || "—",
      creator_name: profileMap.get(t.created_by) || "Utilisateur",
    })));
    setLoading(false);
  }, []);

  const loadTeamMembers = useCallback(async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["superadmin", "support"] as any[]);

    if (!roles) return;
    const userIds = [...new Set(roles.map((r: any) => r.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name")
      .in("user_id", userIds);

    setTeamMembers((profiles || []).map((p: any) => ({ user_id: p.user_id, name: p.name })));
  }, []);

  useEffect(() => { loadTickets(); loadTeamMembers(); }, [loadTickets, loadTeamMembers]);

  const loadComments = useCallback(async (ticketId: string) => {
    const { data } = await supabase
      .from("ticket_comments")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    setComments(data || []);
  }, []);

  async function openTicketDetail(ticket: Ticket) {
    setSelectedTicket(ticket);
    await loadComments(ticket.id);
  }

  async function updateTicketStatus(ticketId: string, status: string) {
    await supabase.from("support_tickets").update({ status } as any).eq("id", ticketId);
    await loadTickets();
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((prev) => prev ? { ...prev, status } : null);
    }
    toast({ title: `Statut mis à jour: ${STATUS_LABELS[status]}` });
  }

  async function assignTicket(ticketId: string, userId: string | null) {
    await supabase.from("support_tickets").update({ assigned_to: userId } as any).eq("id", ticketId);
    await loadTickets();
    toast({ title: userId ? "Ticket assigné" : "Assignation retirée" });
  }

  async function sendComment() {
    if (!newComment.trim() || !selectedTicket || !user) return;
    setSending(true);
    await supabase.from("ticket_comments").insert({
      ticket_id: selectedTicket.id,
      author_id: user.id,
      author_name: user.name,
      content: newComment.trim(),
      is_internal: isInternal,
    } as any);
    setNewComment("");
    setIsInternal(false);
    await loadComments(selectedTicket.id);
    setSending(false);
  }

  const filtered = tickets.filter((t) => {
    const matchesSearch = t.subject.toLowerCase().includes(search.toLowerCase()) ||
      (t.store_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  if (loading) return <p className="text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold">Tickets Support</h2>
          <p className="text-sm text-muted-foreground">{tickets.length} ticket(s) au total</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-blue-500"><Clock className="h-3.5 w-3.5" /> {counts.open} ouvert(s)</span>
            <span className="flex items-center gap-1 text-amber-500"><AlertTriangle className="h-3.5 w-3.5" /> {counts.in_progress} en cours</span>
            <span className="flex items-center gap-1 text-emerald-500"><CheckCircle className="h-3.5 w-3.5" /> {counts.resolved} résolu(s)</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="open">Ouvert</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="resolved">Résolu</SelectItem>
            <SelectItem value="closed">Fermé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-muted-foreground">Sujet</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Boutique</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Priorité</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Statut</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Assigné à</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => openTicketDetail(t)}
                  >
                    <td className="p-3 font-medium max-w-[200px] truncate">{t.subject}</td>
                    <td className="p-3 text-muted-foreground">{t.store_name}</td>
                    <td className="p-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[t.priority]}`}>
                        {PRIORITY_LABELS[t.priority] || t.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status]}`}>
                        {STATUS_LABELS[t.status] || t.status}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {teamMembers.find((m) => m.user_id === t.assigned_to)?.name || "—"}
                    </td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">Aucun ticket</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">{selectedTicket.subject}</DialogTitle>
                <div className="flex gap-2 flex-wrap mt-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selectedTicket.status]}`}>
                    {STATUS_LABELS[selectedTicket.status]}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[selectedTicket.priority]}`}>
                    {PRIORITY_LABELS[selectedTicket.priority]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedTicket.store_name} · {selectedTicket.creator_name} · {new Date(selectedTicket.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </DialogHeader>

              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm">{selectedTicket.description}</div>

              {/* Actions */}
              <div className="flex gap-3 flex-wrap mt-4">
                <Select
                  value={selectedTicket.status}
                  onValueChange={(v) => updateTicketStatus(selectedTicket.id, v)}
                >
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Ouvert</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="resolved">Résolu</SelectItem>
                    <SelectItem value="closed">Fermé</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedTicket.assigned_to || "none"}
                  onValueChange={(v) => assignTicket(selectedTicket.id, v === "none" ? null : v)}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Assigner à..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non assigné</SelectItem>
                    {teamMembers.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Comments */}
              <div className="mt-6 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Conversation ({comments.length})
                </h4>

                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun message</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {comments.map((c) => (
                      <div key={c.id} className={`p-3 rounded-lg text-sm ${c.is_internal ? "bg-amber-500/5 border border-amber-500/20" : "bg-muted/50"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium text-xs">{c.author_name}</span>
                          {c.is_internal && <Badge variant="outline" className="text-[10px] py-0">Interne</Badge>}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p>{c.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Écrire un message..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded"
                    />
                    Note interne (invisible pour le client)
                  </label>
                  <Button size="sm" onClick={sendComment} disabled={sending || !newComment.trim()}>
                    <Send className="h-3.5 w-3.5 mr-1" /> Envoyer
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
