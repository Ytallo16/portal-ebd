import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type OrganizationAccessBlockedProps = {
  motivo?: string | null;
};

export function OrganizationAccessBlocked({ motivo }: OrganizationAccessBlockedProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl">Acesso temporariamente suspenso</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            {motivo === "USUARIO_INATIVO"
              ? "Sua conta está inativa no momento. Entre em contato com o suporte para regularizar pendências e reativar seu acesso."
              : "O uso do Portal EBD para sua organização está pausado no momento. Para regularizar pendências e reativar seu acesso, entre em contato com o suporte."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={() => void handleLogout()}>
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
