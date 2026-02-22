import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { OrderPipelineStatus } from "@/lib/team-roles";

export interface WorkspaceOrder {
  id: string;          // order_number
  dbId: string;        // uuid
  customer: string;
  phone: string;
  email: string;
  items: { name: string; qty: number; price: number; variant?: string }[];
  total: number;
  status: OrderPipelineStatus;
  paymentStatus: string;
  date: string;
  address: string;
}

function mapDbStatus(s: string): OrderPipelineStatus {
  if (s === "shipping") return "in_transit";
  return s as OrderPipelineStatus;
}

function mapToDbStatus(s: OrderPipelineStatus): string {
  if (s === "in_transit") return "shipping";
  return s;
}

export function useWorkspaceOrders(statusFilter: string[]) {
  const { user } = useAuth();
  const storeId = user?.store_id;
  const queryClient = useQueryClient();

  const queryKey = ["workspace-orders", storeId, statusFilter.join(",")];

  const { data: orders = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!storeId) return [];
      const dbStatuses = statusFilter.map(mapToDbStatus);
      const { data, error } = await supabase
        .from("orders")
        .select("*, customers(name, phone, email), order_items(*)")
        .eq("store_id", storeId)
        .in("status", dbStatuses as any)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((o): WorkspaceOrder => {
        const items = (o.order_items || []).map((oi: any) => ({
          name: oi.product_name,
          qty: oi.quantity,
          price: oi.unit_price,
          variant: undefined,
        }));
        return {
          id: o.order_number,
          dbId: o.id,
          customer: (o.customers as any)?.name || "Client inconnu",
          phone: (o.customers as any)?.phone || "",
          email: (o.customers as any)?.email || "",
          items,
          total: o.total_amount,
          status: mapDbStatus(o.status),
          paymentStatus: "pending",
          date: o.created_at,
          address: o.shipping_address || "",
        };
      });
    },
    enabled: !!storeId,
  });

  // Also fetch today's completed orders for KPIs
  const { data: todayStats = { confirmed: 0, cancelled: 0, ready: 0, delivered: 0, returned: 0, collected: 0 } } = useQuery({
    queryKey: ["workspace-today-stats", storeId],
    queryFn: async () => {
      if (!storeId) return { confirmed: 0, cancelled: 0, ready: 0, delivered: 0, returned: 0, collected: 0 };
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("orders")
        .select("status, total_amount, updated_at")
        .eq("store_id", storeId)
        .gte("updated_at", todayStart.toISOString());

      if (error) return { confirmed: 0, cancelled: 0, ready: 0, delivered: 0, returned: 0, collected: 0 };

      const rows = data || [];
      return {
        confirmed: rows.filter((r) => r.status === "confirmed").length,
        cancelled: rows.filter((r) => r.status === "cancelled").length,
        ready: rows.filter((r) => r.status === "ready").length,
        delivered: rows.filter((r) => r.status === "delivered").length,
        returned: rows.filter((r) => r.status === "returned").length,
        collected: rows.filter((r) => r.status === "delivered").reduce((s, r) => s + r.total_amount, 0),
      };
    },
    enabled: !!storeId,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ dbId, status, notes }: { dbId: string; status: OrderPipelineStatus; notes?: string }) => {
      const updateData: any = { status: mapToDbStatus(status) };
      if (notes !== undefined) updateData.notes = notes;
      
      // Set confirmed_by / prepared_by based on role action
      if (status === "confirmed" && user?.id) updateData.confirmed_by = user.id;
      if (status === "preparing" && user?.id) updateData.prepared_by = user.id;

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", dbId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-orders"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-today-stats"] });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  return { orders, isLoading, todayStats, updateStatus };
}
