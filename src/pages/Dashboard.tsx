import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { OrdersChart } from "@/components/dashboard/OrdersChart";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { TopProducts } from "@/components/dashboard/TopProducts";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Truck,
} from "lucide-react";

const Dashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold font-[Space_Grotesk] text-foreground">
              Tableau de bord
            </h1>
            <span className="text-sm text-muted-foreground ml-auto">E-commerce & Retail</span>
          </header>

          <div className="p-6 space-y-6 max-w-[1400px]">
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Chiffre d'affaires"
                value="950 000 F"
                change={12.5}
                icon={DollarSign}
                iconBgClass="bg-primary/10 text-primary"
              />
              <KpiCard
                title="Commandes"
                value="192"
                change={8.2}
                icon={ShoppingCart}
                iconBgClass="bg-accent/10 text-accent"
              />
              <KpiCard
                title="Clients actifs"
                value="1 247"
                change={5.1}
                icon={Users}
                iconBgClass="bg-primary/10 text-primary"
              />
              <KpiCard
                title="Livraisons"
                value="178"
                change={-2.3}
                icon={Truck}
                iconBgClass="bg-accent/10 text-accent"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RevenueChart />
              <OrdersChart />
            </div>

            {/* Bottom section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <RecentOrders />
              </div>
              <TopProducts />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
