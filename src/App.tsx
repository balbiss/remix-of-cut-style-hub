import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { SuperAdminRoute } from "@/components/super-admin/SuperAdminRoute";
import { BarberRoute } from "@/components/barber/BarberRoute";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import Index from "./pages/Index";
import Booking from "./pages/Booking";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminSettings from "./pages/admin/Settings";
import AdminAgenda from "./pages/admin/Agenda";
import AdminClientes from "./pages/admin/Clientes";
import AdminFinanceiro from "./pages/admin/Financeiro";
import AdminProfissionais from "./pages/admin/Profissionais";
import AdminServicos from "./pages/admin/Servicos";
import AdminRelatorios from "./pages/admin/Relatorios";
import SuperAdminDashboard from "./pages/super-admin/Dashboard";
import SuperAdminTenants from "./pages/super-admin/Tenants";
import BarberDashboard from "./pages/barber/Dashboard";
import MeusPontos from "./pages/MeusPontos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PWAInstallPrompt />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/b/:slug" element={<Booking />} />
            <Route path="/agendar/:slug" element={<Booking />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/pontos/:slug" element={<MeusPontos />} />
            <Route path="/meus-pontos/:slug" element={<MeusPontos />} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/agenda" element={<ProtectedRoute><AdminAgenda /></ProtectedRoute>} />
            <Route path="/admin/profissionais" element={<ProtectedRoute><AdminProfissionais /></ProtectedRoute>} />
            <Route path="/admin/servicos" element={<ProtectedRoute><AdminServicos /></ProtectedRoute>} />
            <Route path="/admin/clientes" element={<ProtectedRoute><AdminClientes /></ProtectedRoute>} />
            <Route path="/admin/financeiro" element={<ProtectedRoute><AdminFinanceiro /></ProtectedRoute>} />
            <Route path="/admin/relatorios" element={<ProtectedRoute><AdminRelatorios /></ProtectedRoute>} />
            <Route path="/admin/configuracoes" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
            <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
            <Route path="/super-admin/tenants" element={<SuperAdminRoute><SuperAdminTenants /></SuperAdminRoute>} />
            <Route path="/barbeiro" element={<BarberRoute><BarberDashboard /></BarberRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
