"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";
import { clearSessionData } from "./session-storage";

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.me().then((u) => {
      setUser(u);
    }).catch(() => {
      setUser(null);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    // Clear any existing session data before logging in
    // This prevents previous user's data from being loaded
    clearSessionData();
    
    await api.auth.login(email, password);
    const u = await api.auth.me();
    setUser(u);
  };

  const register = async (email: string, password: string) => {
    // Clear any existing session data before registering
    clearSessionData();
    
    await api.auth.register(email, password);
    const u = await api.auth.me();
    setUser(u);
  };

  const logout = async () => {
    await api.auth.logout();
    
    // Clear all session data on logout to prevent data leakage
    clearSessionData();
    
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
