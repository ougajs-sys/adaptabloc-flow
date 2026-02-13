import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function DashboardLayout({ children, title, subtitle, actions }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold font-[Space_Grotesk] text-foreground">
              {title}
            </h1>
            {subtitle && (
              <span className="text-sm text-muted-foreground">{subtitle}</span>
            )}
            {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
            {!actions && (
              <span className="text-sm text-muted-foreground ml-auto">E-commerce & Retail</span>
            )}
          </header>
          <div className="p-6 space-y-6 max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
