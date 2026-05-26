"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface AuthContextValue {
  accessToken:     string | null;
  isAuthenticated: boolean;
  login:           (token: string) => void;
  logout:          () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("accessToken");
    if (stored) setAccessToken(stored);
  }, []);

  const login = useCallback((token: string) => {
    sessionStorage.setItem("accessToken", token);
    setAccessToken(token);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("accessToken");
    setAccessToken(null);
    router.push("/auth/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        isAuthenticated: !!accessToken,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}