import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isAuthenticated, loginWithCredentials, logoutFromApi } from "@/lib/api";

type AuthContextValue = {
  authenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean>(() => isAuthenticated());

  useEffect(() => {
    const syncAuthState = () => setAuthenticated(isAuthenticated());
    window.addEventListener("portal-ebd:session-cleared", syncAuthState);
    return () => {
      window.removeEventListener("portal-ebd:session-cleared", syncAuthState);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authenticated,
      login: async (email: string, password: string) => {
        await loginWithCredentials(email, password);
        setAuthenticated(true);
      },
      logout: async () => {
        await logoutFromApi();
        setAuthenticated(false);
      },
    }),
    [authenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
