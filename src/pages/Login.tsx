import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch {
      setError("Email ou senha inválidos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Textura leve */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/90 via-transparent to-background/70" />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-[380px] animate-fade-in">
          {/* Marca */}
          <div className="mb-10 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
              Portal
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-[2.75rem]">
              EBD
            </h1>
            <div className="mx-auto mt-4 h-0.5 w-10 rounded-full bg-primary" />
          </div>

          {/* Formulário */}
          <div className="rounded-2xl border border-border/60 bg-card p-7 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)] sm:p-8">
            <p className="mb-6 text-sm font-medium text-foreground">Acesse sua conta</p>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@exemplo.com"
                  className="h-12 border-border/80 bg-background text-base"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="h-12 border-border/80 bg-background text-base"
                  required
                />
              </div>

              {error ? (
                <p className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}

              <Button
                className="h-12 w-full text-base font-medium"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>
            </form>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Problemas no acesso? Contate o secretário da sua igreja.
          </p>
        </div>
      </div>
    </div>
  );
}
