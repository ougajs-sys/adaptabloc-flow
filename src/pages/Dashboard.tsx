import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { OrdersChart } from "@/components/dashboard/OrdersChart";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { Loader2, DollarSign, ShoppingCart, Users, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const Dashboard = () => {
  const { user } = useAuth();
  const storeId = user?.store_id;

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const [ordersRes, customersRes, deliveriesRes, orderItemsRes] = await Promise.all([
        supabase.from("orders").select("id, order_number, total_amount, status, created_at, customer_id, customers(name)").eq("store_id", storeId!).order("created_at", { ascending: false }),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("store_id", storeId!),
        supabase.from("deliveries").select("id", { count: "exact", head: true }).eq("store_id", storeId!),
        supabase.from("order_items").select("product_name, quantity, unit_price, total_price, order_id, orders!inner(store_id, status)").filter("orders.store_id", "eq", storeId!),
      ]);

      const orders = ordersRes.data || [];
      const orderItems = orderItemsRes.data || [];

      const REVENUE_STATUSES = ["confirmed", "preparing", "ready", "shipping", "delivered"];
      const revenue = orders
        .filter((o) => REVENUE_STATUSES.includes(o.status))
        .reduce((s, o) => s + (o.total_amount || 0), 0);
      const ordersCount = orders.length;
      const customersCount = customersRes.count || 0;
      const deliveriesCount = deliveriesRes.count || 0;

      const recentOrders = orders.slice(0, 6).map((o) => ({
        id: o.order_number,
        customer: (o.customers as any)?.name || "—",
        total: o.total_amount,
        status: o.status,
        date: new Date(o.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
        items: orderItems.filter((oi) => oi.order_id === o.id).length || 1,
      }));

      const productMap = new Map<string, { sales: number; revenue: number }>();
      orderItems.forEach((oi) => {
        const existing = productMap.get(oi.product_name) || { sales: 0, revenue: 0 };
        existing.sales += oi.quantity;
        existing.revenue += oi.total_price;
        productMap.set(oi.product_name, existing);
      });
      const topProducts = [...productMap.entries()]
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      const now = new Date();
      const revenueByMonth: { month: string; revenue: number; orders: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const monthOrders = orders.filter((o) => o.created_at.startsWith(monthKey));
        revenueByMonth.push({
          month: MONTH_LABELS[d.getMonth()],
          revenue: monthOrders
            .filter((o) => REVENUE_STATUSES.includes(o.status))
            .reduce((s, o) => s + (o.total_amount || 0), 0),
          orders: monthOrders.length,
        });
      }

      const ordersByDay: { day: string; completed: number; pending: number; cancelled: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const dayOrders = orders.filter((o) => o.created_at.startsWith(dateStr));
        ordersByDay.push({
          day: DAY_LABELS[d.getDay()],
          completed: dayOrders.filter((o) => o.status === "delivered").length,
          pending: dayOrders.filter((o) => !["delivered", "cancelled", "returned"].includes(o.status)).length,
          cancelled: dayOrders.filter((o) => o.status === "cancelled").length,
        });
      }

      return { revenue, ordersCount, customersCount, deliveriesCount, recentOrders, topProducts, revenueByMonth, ordersByDay };
    },
  });

  if (isLoading || !data) {
    return (
      <DashboardLayout title="Tableau de bord">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Tableau de bord">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Chiffre d'affaires"
          value={`${data.revenue.toLocaleString("fr-FR")} F`}
          change={0}
          icon={DollarSign}
          iconBgClass="bg-primary/10 text-primary"
        />
        <KpiCard
          title="Commandes"
          value={String(data.ordersCount)}
          change={0}
          icon={ShoppingCart}
          iconBgClass="bg-accent/10 text-accent"
        />
        <KpiCard
          title="Clients actifs"
          value={String(data.customersCount)}
          change={0}
          icon={Users}
          iconBgClass="bg-primary/10 text-primary"
        />
        <KpiCard
          title="Livraisons"
          value={String(data.deliveriesCount)}
          change={0}
          icon={Truck}
          iconBgClass="bg-accent/10 text-accent"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart data={data.revenueByMonth} />
        <OrdersChart data={data.ordersByDay} />
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentOrders orders={data.recentOrders} />
        </div>
        <TopProducts products={data.topProducts} />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
