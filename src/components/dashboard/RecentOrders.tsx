import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const orders = [
  { id: "CMD-1247", customer: "Aminata Diallo", total: 45000, status: "delivered", date: "13 Fév 2026", items: 3 },
  { id: "CMD-1246", customer: "Moussa Koné", total: 28500, status: "in_transit", date: "13 Fév 2026", items: 2 },
  { id: "CMD-1245", customer: "Fatou Sow", total: 67000, status: "preparing", date: "13 Fév 2026", items: 5 },
  { id: "CMD-1244", customer: "Ibrahim Traoré", total: 15000, status: "delivered", date: "12 Fév 2026", items: 1 },
  { id: "CMD-1243", customer: "Aïcha Bamba", total: 92000, status: "cancelled", date: "12 Fév 2026", items: 7 },
  { id: "CMD-1242", customer: "Oumar Cissé", total: 33500, status: "delivered", date: "12 Fév 2026", items: 2 },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  delivered: { label: "Livré", variant: "default" },
  in_transit: { label: "En livraison", variant: "secondary" },
  preparing: { label: "En préparation", variant: "outline" },
  cancelled: { label: "Annulé", variant: "destructive" },
};

export function RecentOrders() {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-card-foreground">
          Commandes récentes
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Commande</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Articles</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const status = statusConfig[order.status];
              return (
                <TableRow key={order.id}>
                  <TableCell className="font-medium font-mono text-xs">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell className="font-medium">
                    {order.total.toLocaleString("fr-FR")} F
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant} className="text-xs">
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{order.date}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
