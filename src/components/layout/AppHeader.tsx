import { Moon, Sun, Bell, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import { usuarioLogado } from "@/data/mock";
import { useTheme } from "@/hooks/useTheme";

function getPageTitle(pathname: string) {
  if (matchPath("/", pathname)) return "Dashboard";
  if (matchPath("/licoes", pathname)) return "Lições";
  if (matchPath("/licoes/:id", pathname)) return "Detalhes da Lição";
  if (matchPath("/licoes/:id/classe/:classId", pathname)) return "Detalhes da Classe";
  if (matchPath("/turmas", pathname)) return "Turmas";
  if (matchPath("/turmas/:id", pathname)) return "Lições da Turma";
  if (matchPath("/alunos", pathname)) return "Alunos";
  if (matchPath("/financeiro", pathname)) return "Financeiro";
  if (matchPath("/revistas", pathname)) return "Revistas";
  if (matchPath("/configuracoes/usuarios", pathname)) return "Usuários";
  if (matchPath("/configuracoes/perfis-permissoes", pathname)) return "Perfis e permissões";
  if (matchPath("/configuracoes/organizacoes", pathname)) return "Organizações";
  if (matchPath("/configuracoes", pathname)) return "Configurações";
  if (matchPath("/meu-perfil", pathname)) return "Meu Perfil";
  return "Portal EBD";
}

export function AppHeader() {
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card px-4">
      <Button
        variant="ghost"
        size="icon"
        className="touch-target"
        onClick={toggleSidebar}
      >
        <PanelLeft className="h-4 w-4" />
      </Button>

      <h1 className="text-base font-semibold">{pageTitle}</h1>

      <div className="flex-1" />

      <Button variant="ghost" size="icon" className="touch-target" onClick={toggleTheme}>
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <Button variant="ghost" size="icon" className="touch-target relative">
        <Bell className="h-5 w-5" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="touch-target flex items-center gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {usuarioLogado.iniciais}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:inline">{usuarioLogado.nome.split(" ")[0]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate("/meu-perfil")}>Meu Perfil</DropdownMenuItem>
          <DropdownMenuItem>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
