import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pencil, Trash2, Star, Phone, Mail, Calendar, MapPin } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  segment: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
  loyaltyPoints: number;
  joinDate: string;
}

const segmentConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  vip: { label: "VIP", variant: "default" },
  regular: { label: "Régulier", variant: "secondary" },
  new: { label: "Nouveau", variant: "outline" },
  inactive: { label: "Inactif", variant: "destructive" },
};

interface Props {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export function CustomerDetailDialog({ customer, open, onOpenChange, onEdit, onDelete }: Props) {
  if (!customer) return null;
  const seg = segmentConfig[customer.segment];
  const initials = customer.name.split(" ").map((n) => n[0]).join("");
  const loyaltyMax = 1500;
  const loyaltyPercent = Math.min((customer.loyaltyPoints / loyaltyMax) * 100, 100);
  const loyaltyTier = customer.loyaltyPoints >= 1000 ? "Or" : customer.loyaltyPoints >= 500 ? "Argent" : "Bronze";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[Space_Grotesk]">Fiche client</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{customer.name}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant={seg.variant} className="text-xs">{seg.label}</Badge>
                <Badge variant="secondary" className="text-xs">{customer.id}</Badge>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone size={14} /> <span>{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail size={14} /> <span>{customer.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar size={14} /> <span>Client depuis {new Date(customer.joinDate).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-lg font-bold font-[Space_Grotesk]">{customer.totalOrders}</p>
              <p className="text-xs text-muted-foreground">Commandes</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-lg font-bold font-[Space_Grotesk]">{(customer.totalSpent / 1000).toFixed(0)}k</p>
              <p className="text-xs text-muted-foreground">Dépensé (F)</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-lg font-bold font-[Space_Grotesk]">{customer.totalOrders > 0 ? Math.round(customer.totalSpent / customer.totalOrders).toLocaleString("fr-FR") : 0}</p>
              <p className="text-xs text-muted-foreground">Panier moy.</p>
            </div>
          </div>

          {/* Loyalty */}
          <div className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star size={16} className="text-primary" />
                <span className="text-sm font-medium">Fidélité — {loyaltyTier}</span>
              </div>
              <span className="text-sm font-bold text-primary">{customer.loyaltyPoints} pts</span>
            </div>
            <Progress value={loyaltyPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {loyaltyMax - customer.loyaltyPoints > 0 ? `${loyaltyMax - customer.loyaltyPoints} pts pour le prochain palier` : "Palier maximum atteint !"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => { onOpenChange(false); onEdit(customer); }}>
              <Pencil size={14} /> Modifier
            </Button>
            <Button variant="destructive" className="flex-1 gap-2" onClick={() => { onOpenChange(false); onDelete(customer); }}>
              <Trash2 size={14} /> Supprimer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
