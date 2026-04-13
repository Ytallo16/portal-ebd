import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/auth/AuthProvider";
import { ProtectedRoute, PublicOnlyRoute } from "@/auth/RouteGuards";

import Dashboard from "@/pages/Dashboard";
import Licoes from "@/pages/Licoes";
import Trimestres from "@/pages/Trimestres";
import LicaoDetalhe from "@/pages/LicaoDetalhe";
import ClasseDetalhe from "@/pages/ClasseDetalhe";
import Turmas from "@/pages/Turmas";
import TurmaLicoes from "@/pages/TurmaLicoes";
import TurmaDetalhe from "@/pages/TurmaDetalhe";
import Alunos from "@/pages/Alunos";
import Financeiro from "@/pages/Financeiro";
import Revistas from "@/pages/Revistas";
import Configuracoes from "@/pages/Configuracoes";
import Usuarios from "@/pages/Usuarios";
import PerfisPermissoes from "@/pages/PerfisPermissoes";
import Organizacoes from "@/pages/Organizacoes";
import OrganizacaoDetalhe from "@/pages/OrganizacaoDetalhe";
import MeuPerfil from "@/pages/MeuPerfil";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Login />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/licoes" element={<Licoes />} />
                <Route path="/trimestres" element={<Trimestres />} />
                <Route path="/licoes/:id" element={<LicaoDetalhe />} />
                <Route path="/licoes/:id/classe/:classId" element={<ClasseDetalhe />} />
                <Route path="/turmas" element={<Turmas />} />
                <Route path="/turmas/:id" element={<TurmaDetalhe />} />
                <Route path="/turmas/:id/licoes" element={<TurmaLicoes />} />
                <Route path="/alunos" element={<Alunos />} />
                <Route path="/financeiro" element={<Financeiro />} />
                <Route path="/revistas" element={<Revistas />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="/configuracoes/usuarios" element={<Usuarios />} />
                <Route path="/configuracoes/perfis-permissoes" element={<PerfisPermissoes />} />
                <Route path="/configuracoes/trimestres" element={<Trimestres />} />
                <Route path="/configuracoes/organizacoes" element={<Organizacoes />} />
                <Route path="/configuracoes/organizacoes/:id" element={<OrganizacaoDetalhe />} />
                <Route path="/meu-perfil" element={<MeuPerfil />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
