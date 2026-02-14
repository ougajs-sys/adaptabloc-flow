import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  kanbanColumns,
  getStageByStatus,
  type OrderPipelineStatus,
} from "@/lib/team-roles";
import { Phone, MapPin, ArrowRight } from "lucide-react";

export interface PipelineOrder {
  id: string;
  customer: string;
  phone: string;
  address: string;
  total: number;
  itemCount: number;
  status: OrderPipelineStatus;
  assignee?: string;
  date: string;
}

interface OrderPipelineProps {
  orders: PipelineOrder[];
  onAdvance: (orderId: string, nextStatus: OrderPipelineStatus) => void;
  onCancel: (orderId: string) => void;
}

const nextStatusMap: Partial<Record<OrderPipelineStatus, OrderPipelineStatus>> = {
  new: "caller_pending",
  caller_pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "in_transit",
  in_transit: "delivered",
};

const actionLabels: Partial<Record<OrderPipelineStatus, string>> = {
  new: "Assigner au caller",
  caller_pending: "Confirmer",
  confirmed: "Envoyer en préparation",
  preparing: "Marquer prête",
  ready: "Expédier",
  in_transit: "Marquer livrée",
};

export function OrderPipeline({ orders, onAdvance, onCancel }: OrderPipelineProps) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-3 pb-4 min-w-[1100px]">
        {kanbanColumns.map((colStatus) => {
          const stage = getStageByStatus(colStatus);
          const columnOrders = orders.filter((o) => o.status === colStatus);
          const nextStatus = nextStatusMap[colStatus];
          const actionLabel = actionLabels[colStatus];

          return (
            <div key={colStatus} className="flex-1 min-w-[180px] max-w-[240px]">
              {/* Column header */}
              <div className={`rounded-t-lg px-3 py-2 ${stage.color}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{stage.shortLabel}</span>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                    {columnOrders.length}
                  </Badge>
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-2 mt-2 min-h-[120px]">
                {columnOrders.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">Aucune commande</p>
                )}
                {columnOrders.map((order) => (
                  <Card key={order.id} className="border-border/60 shadow-sm">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-xs font-medium">{order.id}</span>
                        <span className="text-xs font-bold font-[Space_Grotesk]">
                          {order.total.toLocaleString("fr-FR")} F
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">{order.customer}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone size={10} />
                        <span className="truncate">{order.phone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin size={10} />
                        <span className="truncate">{order.address}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {order.itemCount} article{order.itemCount > 1 ? "s" : ""}
                      </p>

                      {/* Action buttons */}
                      <div className="flex gap-1 pt-1">
                        {nextStatus && actionLabel && (
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1 text-xs h-7 gap-1"
                            onClick={() => onAdvance(order.id, nextStatus)}
                          >
                            <ArrowRight size={12} />
                            {actionLabel}
                          </Button>
                        )}
                        {colStatus !== "delivered" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7 text-destructive hover:text-destructive"
                            onClick={() => onCancel(order.id)}
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
