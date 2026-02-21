import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Truck,
  BarChart3,
  MessageSquare,
  Settings,
  HelpCircle,
  Zap,
  Lock,
  Boxes,
  CreditCard,
  UsersRound,
  Phone,
  PackageCheck,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useModules } from "@/contexts/ModulesContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

interface SidebarItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  /** Module ID required to unlock this item. undefined = always visible */
  requiredModule?: string;
}

const mainItems: SidebarItem[] = [
  { title: "Tableau de bord", url: "/dashboard", icon: LayoutDashboard },
  { title: "Commandes", url: "/dashboard/orders", icon: ShoppingCart },
  { title: "Clients", url: "/dashboard/customers", icon: Users },
  { title: "Produits", url: "/dashboard/products", icon: Package },
  { title: "Livraisons", url: "/dashboard/deliveries", icon: Truck },
  { title: "Équipe", url: "/dashboard/team", icon: UsersRound },
];

const workspaceItems: SidebarItem[] = [
  { title: "Espace Caller", url: "/dashboard/workspace/caller", icon: Phone },
  { title: "Espace Préparateur", url: "/dashboard/workspace/preparateur", icon: PackageCheck },
  { title: "Espace Livreur", url: "/dashboard/workspace/livreur", icon: Truck },
];

const toolItems: SidebarItem[] = [
  { title: "Statistiques", url: "/dashboard/stats", icon: BarChart3 },
  { title: "Campagnes", url: "/dashboard/campaigns", icon: MessageSquare, requiredModule: "campaigns" },
];

const bottomItems: SidebarItem[] = [
  { title: "Modules", url: "/dashboard/modules", icon: Boxes },
  { title: "Abonnement", url: "/dashboard/billing", icon: CreditCard },
  { title: "Paramètres", url: "/dashboard/settings", icon: Settings },
  { title: "Aide", url: "/dashboard/help", icon: HelpCircle },
];

function SidebarNavItem({ item }: { item: SidebarItem }) {
  const { hasModule } = useModules();
  const locked = item.requiredModule ? !hasModule(item.requiredModule) : false;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        {locked ? (
          <NavLink
            to="/dashboard/modules"
            end={false}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground/60 hover:bg-sidebar-accent transition-colors"
            activeClassName=""
          >
            <item.icon size={18} />
            <span>{item.title}</span>
            <Lock size={14} className="ml-auto text-muted-foreground/40" />
          </NavLink>
        ) : (
          <NavLink
            to={item.url}
            end
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            activeClassName="bg-sidebar-accent text-primary font-medium"
          >
            <item.icon size={18} />
            <span>{item.title}</span>
          </NavLink>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function DashboardSidebar() {
  return (
    <Sidebar className="border-r border-sidebar-border">
      <div className="p-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Zap size={18} className="text-primary-foreground" />
        </div>
        <span className="font-[Space_Grotesk] font-bold text-lg text-sidebar-foreground">
          EasyFlow
        </span>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarNavItem key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Espaces de travail</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceItems.map((item) => (
                <SidebarNavItem key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Outils</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => (
                <SidebarNavItem key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {bottomItems.map((item) => (
            <SidebarNavItem key={item.title} item={item} />
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
