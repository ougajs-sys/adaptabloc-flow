import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ModuleGate } from "@/components/modules/ModuleGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Send, MessageSquare, Mail, Phone, Eye, MousePointerClick, Loader2, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const channelIcons: Record<string, typeof MessageSquare> = {
  sms: Phone,
  whatsapp: MessageSquare,
  email: Mail,
};

const channelLabels: Record<string, string> = {
  sms: "SMS",
  whatsapp: "WhatsApp",
  email: "Email",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  sent: { label: "Envoyée", variant: "default" },
  draft: { label: "Brouillon", variant: "secondary" },
  scheduled: { label: "Planifiée", variant: "outline" },
  cancelled: { label: "Annulée", variant: "destructive" },
};

const CampaignsContent = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const storeId = user?.store_id;

  const [newOpen, setNewOpen] = useState(false);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<"sms" | "whatsapp" | "email">("whatsapp");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Create campaign
  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("campaigns").insert({
        store_id: storeId!,
        name,
        type: channel,
        message_content: message || null,
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setName("");
      setMessage("");
      setNewOpen(false);
      toast({ title: "Campagne créée", description: `"${name}" est en brouillon.` });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  // Delete campaign
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete recipients first
      await supabase.from("campaign_recipients").delete().eq("campaign_id", id);
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setDeletingId(null);
      toast({ title: "Campagne supprimée" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const sentCampaigns = campaigns.filter((c) => c.status === "sent");
  const totalSent = sentCampaigns.reduce((s, c) => s + (c.recipient_count || 0), 0);
  const totalOpened = sentCampaigns.reduce((s, c) => s + (c.opened_count || 0), 0);
  const totalClicked = sentCampaigns.reduce((s, c) => s + (c.converted_count || 0), 0);
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const clickRate = totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  return (
    <>
      {/* New campaign dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[Space_Grotesk] flex items-center gap-2">
              <Send size={18} /> Nouvelle campagne
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la campagne</Label>
              <Input placeholder="Promo Été 2026" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea placeholder="Contenu de votre campagne..." value={message} onChange={(e) => setMessage(e.target.value)} className="resize-none h-24" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Annuler</Button>
            <Button onClick={() => createMutation.mutate()} className="gap-2" disabled={!name.trim() || createMutation.isPending}>
              <Send size={14} /> Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(v) => { if (!v) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette campagne ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteMutation.mutate(deletingId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Campagnes envoyées", value: sentCampaigns.length, icon: Send },
            { label: "Destinataires total", value: totalSent.toLocaleString("fr-FR"), icon: MessageSquare },
            { label: "Taux d'ouverture", value: `${openRate}%`, icon: Eye },
            { label: "Taux de clic", value: `${clickRate}%`, icon: MousePointerClick },
          ].map((kpi) => (
            <Card key={kpi.label} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon size={14} className="text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
                <p className="text-xl font-bold font-[Space_Grotesk] text-foreground">{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-[Space_Grotesk]">Historique des campagnes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {campaigns.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Send size={40} className="mx-auto mb-3 opacity-30" />
                <p>Aucune campagne encore</p>
                <p className="text-sm">Créez votre première campagne marketing.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campagne</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Destinataires</TableHead>
                    <TableHead>Ouvertures</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => {
                    const Icon = channelIcons[c.type] || MessageSquare;
                    const st = statusLabels[c.status] || statusLabels.draft;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium text-sm">{c.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Icon size={14} className="text-muted-foreground" />
                            <span className="text-sm">{channelLabels[c.type] || c.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{c.recipient_count || 0}</TableCell>
                        <TableCell className="text-sm">{c.opened_count || 0}</TableCell>
                        <TableCell className="text-sm">{c.converted_count || 0}</TableCell>
                        <TableCell>
                          <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingId(c.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

const Campaigns = () => {
  return (
    <DashboardLayout
      title="Campagnes"
      actions={
        <ModuleGate moduleId="campaigns" fallback={null}>
          <Button size="sm" className="gap-2" onClick={() => document.dispatchEvent(new CustomEvent("open-new-campaign"))}>
            <Plus size={16} /> Nouvelle campagne
          </Button>
        </ModuleGate>
      }
    >
      <ModuleGate moduleId="campaigns">
        <CampaignsContent />
      </ModuleGate>
    </DashboardLayout>
  );
};

export default Campaigns;
