import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface RecentOrder {
  id: string;
  customer: string;
  total: number;
  status: string;
  date: string;
  items: number;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  delivered: { label: "Livré", variant: "default" },
  in_transit: { label: "En livraison", variant: "secondary" },
  shipping: { label: "En livraison", variant: "secondary" },
  preparing: { label: "En préparation", variant: "outline" },
  confirmed: { label: "Confirmée", variant: "outline" },
  caller_pending: { label: "À confirmer", variant: "outline" },
  new: { label: "Nouvelle", variant: "outline" },
  ready: { label: "Prête", variant: "secondary" },
  cancelled: { label: "Annulé", variant: "destructive" },
  returned: { label: "Retourné", variant: "destructive" },
};

interface Props {
  orders: RecentOrder[];
}

export function RecentOrders({ orders }: Props) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-card-foreground">
          Commandes récentes
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aucune commande pour le moment</p>
        ) : (
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
                const status = statusConfig[order.status] || statusConfig.new;
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
        )}
      </CardContent>
    </Card>
  );
}
