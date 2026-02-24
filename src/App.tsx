import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ModulesProvider } from "@/contexts/ModulesContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Deliveries from "./pages/Deliveries";
import Team from "./pages/Team";
import ModulesManagement from "./pages/ModulesManagement";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import CallerWorkspace from "./pages/workspace/CallerWorkspace";
import PreparateurWorkspace from "./pages/workspace/PreparateurWorkspace";
import LivreurWorkspace from "./pages/workspace/LivreurWorkspace";
import NotFound from "./pages/NotFound";
import Statistics from "./pages/Statistics";
import Help from "./pages/Help";
import Campaigns from "./pages/Campaigns";
import EmbedForms from "./pages/EmbedForms";
import EmbedOrder from "./pages/EmbedOrder";
import SetupAdmin from "./pages/SetupAdmin";
import AdminLogin from "./pages/AdminLogin";
import SuperAdminLayout from "./components/superadmin/SuperAdminLayout";
import SuperAdminOverview from "./components/superadmin/SuperAdminOverview";
import SuperAdminStores from "./components/superadmin/SuperAdminStores";
import SuperAdminUsers from "./components/superadmin/SuperAdminUsers";
import SuperAdminFinances from "./components/superadmin/SuperAdminFinances";
import SuperAdminModules from "./components/superadmin/SuperAdminModules";
import SuperAdminPricing from "./components/superadmin/SuperAdminPricing";
import SuperAdminAnalytics from "./components/superadmin/SuperAdminAnalytics";
import SuperAdminProviders from "./components/superadmin/SuperAdminProviders";
import SuperAdminActivity from "./components/superadmin/SuperAdminActivity";
import SuperAdminTeam from "./components/superadmin/SuperAdminTeam";
import SuperAdminTickets from "./components/superadmin/SuperAdminTickets";
import SuperAdminConfig from "./components/superadmin/SuperAdminConfig";
import type { ReactNode } from "react";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.has_completed_onboarding) return <Navigate to="/onboarding" replace />;
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/onboarding" element={<Onboarding />} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/dashboard/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
    <Route path="/dashboard/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
    <Route path="/dashboard/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
    <Route path="/dashboard/deliveries" element={<ProtectedRoute><Deliveries /></ProtectedRoute>} />
    <Route path="/dashboard/team" element={<ProtectedRoute allowedRoles={["admin"]}><Team /></ProtectedRoute>} />
    <Route path="/dashboard/modules" element={<ProtectedRoute allowedRoles={["admin"]}><ModulesManagement /></ProtectedRoute>} />
    <Route path="/dashboard/settings" element={<ProtectedRoute allowedRoles={["admin"]}><Settings /></ProtectedRoute>} />
    <Route path="/dashboard/billing" element={<ProtectedRoute allowedRoles={["admin"]}><Billing /></ProtectedRoute>} />
    <Route path="/dashboard/stats" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
    <Route path="/dashboard/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
    <Route path="/dashboard/campaigns" element={<ProtectedRoute allowedRoles={["admin"]}><Campaigns /></ProtectedRoute>} />
    <Route path="/dashboard/forms" element={<ProtectedRoute allowedRoles={["admin"]}><EmbedForms /></ProtectedRoute>} />
    <Route path="/dashboard/workspace/caller" element={<ProtectedRoute allowedRoles={["admin", "caller"]}><CallerWorkspace /></ProtectedRoute>} />
    <Route path="/dashboard/workspace/preparateur" element={<ProtectedRoute allowedRoles={["admin", "preparer"]}><PreparateurWorkspace /></ProtectedRoute>} />
    <Route path="/dashboard/workspace/livreur" element={<ProtectedRoute allowedRoles={["admin", "driver"]}><LivreurWorkspace /></ProtectedRoute>} />
    <Route path="/embed/order" element={<EmbedOrder />} />
    <Route path="/setup-admin" element={<SetupAdmin />} />

    {/* Admin HQ - aliases */}
    <Route path="/admin-login" element={<Navigate to="/admin/login" replace />} />
    <Route path="/hq/login" element={<Navigate to="/admin/login" replace />} />
    <Route path="/hq" element={<Navigate to="/admin/login" replace />} />

    {/* Admin HQ - login is standalone */}
    <Route path="/admin/login" element={<AdminLogin />} />
    {/* Admin HQ - workspace with layout */}
    <Route path="/admin" element={<SuperAdminLayout />}>
      <Route index element={<Navigate to="/admin/overview" replace />} />
      <Route path="overview" element={<SuperAdminOverview />} />
      <Route path="stores" element={<SuperAdminStores />} />
      <Route path="users" element={<SuperAdminUsers />} />
      <Route path="finances" element={<SuperAdminFinances />} />
      <Route path="modules" element={<SuperAdminModules />} />
      <Route path="pricing" element={<SuperAdminPricing />} />
      <Route path="analytics" element={<SuperAdminAnalytics />} />
      <Route path="providers" element={<SuperAdminProviders />} />
      <Route path="activity" element={<SuperAdminActivity />} />
      <Route path="tickets" element={<SuperAdminTickets />} />
      <Route path="team" element={<SuperAdminTeam />} />
      <Route path="config" element={<SuperAdminConfig />} />
    </Route>

    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ModulesProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ModulesProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
