import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/auth/AuthProvider";
import { ProtectedRoute, PublicOnlyRoute } from "@/auth/RouteGuards";

import Dashboard from "@/pages/Dashboard";
import LicoesHub from "@/pages/licoes/LicoesHub";
import LicoesTrimestre from "@/pages/licoes/LicoesTrimestre";
import {
  LicoesClasseLegacyRedirect,
  LicoesLicaoIdRedirect,
} from "@/pages/licoes/LicoesLegacyRedirect";
import Trimestres from "@/pages/Trimestres";
import LicaoDetalhe from "@/pages/LicaoDetalhe";
import FrequenciaProfessoresLicao from "@/pages/FrequenciaProfessoresLicao";
import ClasseDetalhe from "@/pages/ClasseDetalhe";
import Turmas from "@/pages/Turmas";
import TurmaLicoes from "@/pages/TurmaLicoes";
import TurmaDetalhe from "@/pages/TurmaDetalhe";
import Alunos from "@/pages/Alunos";
import Professores from "@/pages/Professores";
import Financeiro from "@/pages/Financeiro";
import Revistas from "@/pages/Revistas";
import Configuracoes from "@/pages/Configuracoes";
import Usuarios from "@/pages/Usuarios";
import Organizacoes from "@/pages/Organizacoes";
import OrganizacaoDetalhe from "@/pages/OrganizacaoDetalhe";
import Igrejas from "@/pages/Igrejas";
import MeuPerfil from "@/pages/MeuPerfil";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

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
                <Route path="/licoes" element={<LicoesHub />} />
                <Route path="/licoes/gerenciar-trimestres" element={<Trimestres />} />
                <Route path="/licoes/:ano/:trimestre" element={<LicoesTrimestre />} />
                <Route path="/licoes/:ano/:trimestre/:licaoNumero" element={<LicaoDetalhe />} />
                <Route
                  path="/licoes/:ano/:trimestre/:licaoNumero/frequencia-professores"
                  element={<FrequenciaProfessoresLicao />}
                />
                <Route
                  path="/licoes/:ano/:trimestre/:licaoNumero/turmas/:classId"
                  element={<ClasseDetalhe />}
                />
                <Route path="/trimestres" element={<Navigate to="/licoes/gerenciar-trimestres" replace />} />
                <Route path="/licoes/:id/classe/:classId" element={<LicoesClasseLegacyRedirect />} />
                <Route path="/licoes/:id" element={<LicoesLicaoIdRedirect />} />
                <Route path="/turmas" element={<Turmas />} />
                <Route path="/turmas/:id" element={<TurmaDetalhe />} />
                <Route path="/turmas/:id/licoes" element={<TurmaLicoes />} />
                <Route path="/alunos" element={<Alunos />} />
                <Route path="/professores" element={<Professores />} />
                <Route path="/ranking/professores" element={<Navigate to="/professores" replace />} />
                <Route path="/matriculados" element={<Navigate to="/alunos" replace />} />
                <Route path="/financeiro" element={<Financeiro />} />
                <Route path="/revistas" element={<Revistas />} />
                <Route path="/igrejas" element={<Igrejas />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="/configuracoes/usuarios" element={<Usuarios />} />
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
