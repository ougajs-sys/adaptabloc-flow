import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Truck, Clock, CheckCircle2, XCircle, MapPin, Phone } from "lucide-react";

interface Delivery {
  id: string;
  orderId: string;
  customer: string;
  customerPhone: string;
  address: string;
  zone: string;
  driver: string;
  driverPhone: string;
  status: string;
  estimatedTime: string;
  fee: number;
  createdAt: string;
}

const mockDeliveries: Delivery[] = [
  { id: "LIV-501", orderId: "CMD-1247", customer: "Aminata Diallo", customerPhone: "+225 07 12 34 56", address: "Cocody, Rue des Jardins", zone: "Cocody", driver: "Koné Mamadou", driverPhone: "+225 05 55 66 77", status: "delivered", estimatedTime: "35 min", fee: 2000, createdAt: "2026-02-13T14:30:00" },
  { id: "LIV-500", orderId: "CMD-1246", customer: "Moussa Koné", customerPhone: "+225 05 98 76 54", address: "Plateau, Av. Terrasson", zone: "Plateau", driver: "Traoré Issa", driverPhone: "+225 07 88 99 00", status: "in_transit", estimatedTime: "15 min", fee: 1500, createdAt: "2026-02-13T12:15:00" },
  { id: "LIV-499", orderId: "CMD-1245", customer: "Fatou Sow", customerPhone: "+225 01 23 45 67", address: "Marcory, Zone 4", zone: "Marcory", driver: "Bamba Ali", driverPhone: "+225 01 22 33 44", status: "picking_up", estimatedTime: "45 min", fee: 2500, createdAt: "2026-02-13T10:45:00" },
  { id: "LIV-498", orderId: "CMD-1244", customer: "Ibrahim Traoré", customerPhone: "+225 07 65 43 21", address: "Yopougon, Quartier Millionnaire", zone: "Yopougon", driver: "Bamba Ali", driverPhone: "+225 01 22 33 44", status: "delivered", estimatedTime: "50 min", fee: 3000, createdAt: "2026-02-12T16:00:00" },
  { id: "LIV-497", orderId: "CMD-1243", customer: "Aïcha Bamba", customerPhone: "+225 05 11 22 33", address: "Riviera 3", zone: "Cocody", driver: "", driverPhone: "", status: "cancelled", estimatedTime: "-", fee: 2000, createdAt: "2026-02-12T09:30:00" },
  { id: "LIV-496", orderId: "CMD-1242", customer: "Oumar Cissé", customerPhone: "+225 01 44 55 66", address: "Treichville, Av. 12", zone: "Treichville", driver: "Koné Mamadou", driverPhone: "+225 05 55 66 77", status: "delivered", estimatedTime: "25 min", fee: 1500, createdAt: "2026-02-12T08:00:00" },
  { id: "LIV-495", orderId: "CMD-1241", customer: "Mariam Touré", customerPhone: "+225 07 77 88 99", address: "Abobo, Rond-point", zone: "Abobo", driver: "", driverPhone: "", status: "pending", estimatedTime: "-", fee: 3500, createdAt: "2026-02-11T18:20:00" },
  { id: "LIV-494", orderId: "CMD-1240", customer: "Sékou Diarra", customerPhone: "+225 05 00 11 22", address: "Bingerville, Résidence Palm", zone: "Bingerville", driver: "Traoré Issa", driverPhone: "+225 07 88 99 00", status: "in_transit", estimatedTime: "20 min", fee: 4000, createdAt: "2026-02-11T15:10:00" },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Truck }> = {
  delivered: { label: "Livré", variant: "default", icon: CheckCircle2 },
  in_transit: { label: "En route", variant: "secondary", icon: Truck },
  picking_up: { label: "Récupération", variant: "outline", icon: Clock },
  pending: { label: "En attente", variant: "outline", icon: Clock },
  cancelled: { label: "Annulé", variant: "destructive", icon: XCircle },
};

const Deliveries = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockDeliveries.filter((d) => {
    const matchSearch =
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.customer.toLowerCase().includes(search.toLowerCase()) ||
      d.driver.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeDeliveries = mockDeliveries.filter(d => ["in_transit", "picking_up"].includes(d.status)).length;
  const todayDelivered = mockDeliveries.filter(d => d.status === "delivered" && d.createdAt.startsWith("2026-02-13")).length;

  return (
    <DashboardLayout title="Livraisons">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "En cours", value: activeDeliveries, icon: Truck, color: "text-primary" },
          { label: "Livrées aujourd'hui", value: todayDelivered, icon: CheckCircle2, color: "text-accent" },
          { label: "En attente", value: mockDeliveries.filter(d => d.status === "pending").length, icon: Clock, color: "text-muted-foreground" },
          { label: "Taux de succès", value: "94%", icon: CheckCircle2, color: "text-accent" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={14} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className={`text-xl font-bold font-[Space_Grotesk] ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par ID, client ou livreur..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="picking_up">Récupération</SelectItem>
            <SelectItem value="in_transit">En route</SelectItem>
            <SelectItem value="delivered">Livré</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Livraison</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Livreur</TableHead>
                <TableHead>Temps estimé</TableHead>
                <TableHead>Frais</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((delivery) => {
                const st = statusConfig[delivery.status];
                const StatusIcon = st.icon;
                const driverInitials = delivery.driver ? delivery.driver.split(" ").map(n => n[0]).join("") : "?";
                return (
                  <TableRow key={delivery.id} className="cursor-pointer">
                    <TableCell>
                      <div>
                        <p className="font-mono text-xs font-medium">{delivery.id}</p>
                        <p className="text-xs text-muted-foreground">{delivery.orderId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{delivery.customer}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin size={10} />
                          <span>{delivery.address}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-muted text-muted-foreground rounded px-2 py-0.5">
                        {delivery.zone}
                      </span>
                    </TableCell>
                    <TableCell>
                      {delivery.driver ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-accent/10 text-accent">
                              {driverInitials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{delivery.driver}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Non assigné</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{delivery.estimatedTime}</TableCell>
                    <TableCell className="font-medium text-sm">{delivery.fee.toLocaleString("fr-FR")} F</TableCell>
                    <TableCell>
                      <Badge variant={st.variant} className="text-xs gap-1">
                        <StatusIcon size={12} />
                        {st.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Deliveries;
