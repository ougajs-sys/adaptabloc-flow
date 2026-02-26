import { Outlet } from "react-router-dom";
import { Shield } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import SuperAdminSidebar from "./SuperAdminSidebar";
import AdminNotifications from "./AdminNotifications";

export default function SuperAdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SuperAdminSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b bg-card px-4 flex items-center gap-3 shrink-0">
            <SidebarTrigger />
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-sm font-semibold">Intramate HQ</h1>
            <div className="ml-auto">
              <AdminNotifications />
            </div>
          </header>
          <div className="flex-1 p-6 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
