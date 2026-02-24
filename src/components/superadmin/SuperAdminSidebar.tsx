import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Shield,
  LayoutDashboard,
  BarChart3,
  Store,
  Users,
  Puzzle,
  DollarSign,
  CreditCard,
  Activity,
  UsersRound,
  Settings,
  LogOut,
} from "lucide-react";
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
import { NavLink } from "@/components/NavLink";

const navGroups = [
  {
    label: "Tableau de bord",
    items: [
      { title: "Vue Globale", url: "/admin/overview", icon: LayoutDashboard },
      { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Gestion",
    items: [
      { title: "Boutiques", url: "/admin/stores", icon: Store },
      { title: "Utilisateurs", url: "/admin/users", icon: Users },
      { title: "Modules", url: "/admin/modules", icon: Puzzle },
    ],
  },
  {
    label: "Finances",
    items: [
      { title: "Transactions", url: "/admin/finances", icon: DollarSign },
      { title: "Providers Paiement", url: "/admin/providers", icon: CreditCard },
    ],
  },
  {
    label: "Support",
    items: [
      { title: "Journal d'activité", url: "/admin/activity", icon: Activity },
      { title: "Équipe Intramate", url: "/admin/team", icon: UsersRound },
    ],
  },
  {
    label: "Système",
    items: [
      { title: "Configuration", url: "/admin/config", icon: Settings },
    ],
  },
];

export default function SuperAdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Sidebar className="border-r border-sidebar-border">
      <div className="p-4 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
          <Shield size={20} className="text-primary" />
        </div>
        <div className="min-w-0">
          <span className="font-[Space_Grotesk] font-bold text-base text-sidebar-foreground block leading-tight">
            Intramate HQ
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Administration
          </span>
        </div>
      </div>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                        activeClassName="bg-sidebar-accent text-primary font-medium"
                      >
                        <item.icon size={18} />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-3 py-3 border-t border-sidebar-border space-y-2">
          {user && (
            <div className="flex items-center gap-3">
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={async () => {
              await logout();
              navigate("/admin/login");
            }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
          >
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
