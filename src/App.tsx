import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminSettings from "./pages/admin/Settings";
import AdminAgenda from "./pages/admin/Agenda";
import AdminClientes from "./pages/admin/Clientes";
import AdminFinanceiro from "./pages/admin/Financeiro";
import AdminProfissionais from "./pages/admin/Profissionais";
import AdminServicos from "./pages/admin/Servicos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/agenda" element={<AdminAgenda />} />
          <Route path="/admin/profissionais" element={<AdminProfissionais />} />
          <Route path="/admin/servicos" element={<AdminServicos />} />
          <Route path="/admin/clientes" element={<AdminClientes />} />
          <Route path="/admin/financeiro" element={<AdminFinanceiro />} />
          <Route path="/admin/configuracoes" element={<AdminSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
