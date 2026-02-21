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
import type { ReactNode } from "react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.has_completed_onboarding) return <Navigate to="/onboarding" replace />;

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
    <Route path="/dashboard/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
    <Route path="/dashboard/modules" element={<ProtectedRoute><ModulesManagement /></ProtectedRoute>} />
    <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    <Route path="/dashboard/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
    <Route path="/dashboard/stats" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
    <Route path="/dashboard/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
    <Route path="/dashboard/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
    <Route path="/dashboard/workspace/caller" element={<ProtectedRoute><CallerWorkspace /></ProtectedRoute>} />
    <Route path="/dashboard/workspace/preparateur" element={<ProtectedRoute><PreparateurWorkspace /></ProtectedRoute>} />
    <Route path="/dashboard/workspace/livreur" element={<ProtectedRoute><LivreurWorkspace /></ProtectedRoute>} />
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
