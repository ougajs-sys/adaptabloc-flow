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
import { Plus, Send, MessageSquare, Mail, Phone, TrendingUp, Eye, MousePointerClick } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Campaign {
  id: string;
  name: string;
  channel: "sms" | "whatsapp" | "email";
  status: "sent" | "draft" | "scheduled";
  recipients: number;
  opened: number;
  clicked: number;
  date: string;
}

const mockCampaigns: Campaign[] = [
  { id: "CMP-001", name: "Promo Saint-Valentin", channel: "whatsapp", status: "sent", recipients: 450, opened: 312, clicked: 89, date: "2026-02-10" },
  { id: "CMP-002", name: "Nouveautés Février", channel: "sms", status: "sent", recipients: 820, opened: 654, clicked: 142, date: "2026-02-05" },
  { id: "CMP-003", name: "Soldes Flash", channel: "email", status: "sent", recipients: 1200, opened: 890, clicked: 234, date: "2026-01-28" },
  { id: "CMP-004", name: "Bienvenue nouveaux clients", channel: "whatsapp", status: "draft", recipients: 0, opened: 0, clicked: 0, date: "2026-02-15" },
];

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

let campaignCounter = mockCampaigns.length + 1;

const CampaignsContent = () => {
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [newOpen, setNewOpen] = useState(false);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<"sms" | "whatsapp" | "email">("whatsapp");
  const [message, setMessage] = useState("");

  const totalSent = campaigns.filter((c) => c.status === "sent").reduce((s, c) => s + c.recipients, 0);
  const totalOpened = campaigns.filter((c) => c.status === "sent").reduce((s, c) => s + c.opened, 0);
  const totalClicked = campaigns.filter((c) => c.status === "sent").reduce((s, c) => s + c.clicked, 0);
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const clickRate = totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0;

  const handleCreate = () => {
    if (!name.trim()) return;
    const newCampaign: Campaign = {
      id: `CMP-${String(campaignCounter++).padStart(3, "0")}`,
      name,
      channel,
      status: "draft",
      recipients: 0,
      opened: 0,
      clicked: 0,
      date: new Date().toISOString().split("T")[0],
    };
    setCampaigns((prev) => [newCampaign, ...prev]);
    setName("");
    setMessage("");
    setNewOpen(false);
    toast({ title: "Campagne créée", description: `"${newCampaign.name}" est en brouillon.` });
  };

  return (
    <>
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
            <Button onClick={handleCreate} className="gap-2" disabled={!name.trim()}>
              <Send size={14} /> Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Campagnes envoyées", value: campaigns.filter((c) => c.status === "sent").length, icon: Send },
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campagne</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Destinataires</TableHead>
                  <TableHead>Ouvertures</TableHead>
                  <TableHead>Clics</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => {
                  const Icon = channelIcons[c.channel];
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-sm">{c.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Icon size={14} className="text-muted-foreground" />
                          <span className="text-sm">{channelLabels[c.channel]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{c.recipients}</TableCell>
                      <TableCell className="text-sm">{c.opened}</TableCell>
                      <TableCell className="text-sm">{c.clicked}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "sent" ? "default" : c.status === "draft" ? "secondary" : "outline"} className="text-xs">
                          {c.status === "sent" ? "Envoyée" : c.status === "draft" ? "Brouillon" : "Planifiée"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(c.date).toLocaleDateString("fr-FR")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
