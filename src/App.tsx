import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ModulesProvider } from "@/contexts/ModulesContext";
import { AuthProvider } from "@/contexts/AuthContext";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ModulesProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/orders" element={<Orders />} />
              <Route path="/dashboard/products" element={<Products />} />
              <Route path="/dashboard/customers" element={<Customers />} />
              <Route path="/dashboard/deliveries" element={<Deliveries />} />
              <Route path="/dashboard/team" element={<Team />} />
              <Route path="/dashboard/modules" element={<ModulesManagement />} />
              <Route path="/dashboard/settings" element={<Settings />} />
              <Route path="/dashboard/billing" element={<Billing />} />
              <Route path="/dashboard/stats" element={<Statistics />} />
              <Route path="/dashboard/workspace/caller" element={<CallerWorkspace />} />
              <Route path="/dashboard/workspace/preparateur" element={<PreparateurWorkspace />} />
              <Route path="/dashboard/workspace/livreur" element={<LivreurWorkspace />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ModulesProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
