import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Shield } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import SuperAdminSidebar from "./SuperAdminSidebar";

const ADMIN_ROLES = ["superadmin", "support", "finance", "developer"];

export default function SuperAdminLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate("/admin/login", { replace: true });
      return;
    }

    async function check() {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);

      const hasAdmin = roles?.some((r) => ADMIN_ROLES.includes(r.role));
      if (!hasAdmin) {
        navigate("/admin/login", { replace: true });
        return;
      }
      setAuthorized(true);
      setChecking(false);
    }
    check();
  }, [isLoading, isAuthenticated, user]);

  if (isLoading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SuperAdminSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b bg-card px-4 flex items-center gap-3 shrink-0">
            <SidebarTrigger />
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-sm font-semibold">Intramate HQ</h1>
          </header>
          <div className="flex-1 p-6 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
