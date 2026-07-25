import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/auth/AuthProvider";
import { ProtectedRoute, PublicOnlyRoute } from "@/auth/RouteGuards";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const LicoesHub = lazy(() => import("@/pages/licoes/LicoesHub"));
const LicoesTrimestre = lazy(() => import("@/pages/licoes/LicoesTrimestre"));
const LicoesClasseLegacyRedirect = lazy(() =>
  import("@/pages/licoes/LicoesLegacyRedirect").then((module) => ({
    default: module.LicoesClasseLegacyRedirect,
  })),
);
const LicoesLicaoIdRedirect = lazy(() =>
  import("@/pages/licoes/LicoesLegacyRedirect").then((module) => ({
    default: module.LicoesLicaoIdRedirect,
  })),
);
const Trimestres = lazy(() => import("@/pages/Trimestres"));
const LicaoDetalhe = lazy(() => import("@/pages/LicaoDetalhe"));
const FrequenciaProfessoresLicao = lazy(() => import("@/pages/FrequenciaProfessoresLicao"));
const ClasseDetalhe = lazy(() => import("@/pages/ClasseDetalhe"));
const Turmas = lazy(() => import("@/pages/Turmas"));
const TurmaLicoes = lazy(() => import("@/pages/TurmaLicoes"));
const TurmaDetalhe = lazy(() => import("@/pages/TurmaDetalhe"));
const Alunos = lazy(() => import("@/pages/Alunos"));
const Professores = lazy(() => import("@/pages/Professores"));
const Financeiro = lazy(() => import("@/pages/Financeiro"));
const Revistas = lazy(() => import("@/pages/Revistas"));
const Configuracoes = lazy(() => import("@/pages/Configuracoes"));
const Usuarios = lazy(() => import("@/pages/Usuarios"));
const Organizacoes = lazy(() => import("@/pages/Organizacoes"));
const OrganizacaoDetalhe = lazy(() => import("@/pages/OrganizacaoDetalhe"));
const Igrejas = lazy(() => import("@/pages/Igrejas"));
const MeuPerfil = lazy(() => import("@/pages/MeuPerfil"));
const Login = lazy(() => import("@/pages/Login"));
const NotFound = lazy(() => import("@/pages/NotFound"));

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
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground" role="status">
                Carregando...
              </div>
            }
          >
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
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
