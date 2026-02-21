import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  User,
  getUser,
  clearUser,
  mockFacebookLogin,
  mockGoogleLogin,
  mockEmailLogin,
} from "@/lib/auth-store";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (provider: "facebook" | "google" | "email", email?: string, password?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getUser();
    setUser(stored);
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (provider: "facebook" | "google" | "email", email?: string, password?: string) => {
      setIsLoading(true);
      try {
        let loggedUser: User;
        if (provider === "facebook") {
          loggedUser = await mockFacebookLogin();
        } else if (provider === "google") {
          loggedUser = await mockGoogleLogin();
        } else {
          loggedUser = await mockEmailLogin(email || "", password || "");
        }
        setUser(loggedUser);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    clearUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
