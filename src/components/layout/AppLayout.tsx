import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { ContextRequiredGate } from "./ContextRequiredGate";
import { Outlet, useLocation } from "react-router-dom";

export function AppLayout() {
  const location = useLocation();
  const skipContextGate =
    location.pathname.startsWith("/configuracoes") || location.pathname === "/meu-perfil";

  return (
    <SidebarProvider>
      <div className="flex h-[100dvh] w-full overflow-hidden bg-muted/40">
        <AppSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="safe-area-bottom min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain p-3 pb-4 md:p-6 md:pb-6">
            {skipContextGate ? <Outlet /> : (
              <ContextRequiredGate>
                <Outlet />
              </ContextRequiredGate>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
