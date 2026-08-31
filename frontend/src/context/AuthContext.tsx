import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User, LoginResponse, ApiErrorResponse } from "../types/auth";
import { apiFetch, registerSessionExpiredHandler } from "../api/client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  sessionExpiredMessage: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearSessionExpiredMessage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("crm_token"));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("crm_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  const handleSessionExpired = () => {
    localStorage.removeItem("crm_token");
    localStorage.removeItem("crm_user");
    setToken(null);
    setUser(null);
    setSessionExpiredMessage("Your session expired — please log in again.");
  };

  useEffect(() => {
    registerSessionExpiredHandler(handleSessionExpired);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setSessionExpiredMessage(null);
      const data = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem("crm_token", data.token);
      localStorage.setItem("crm_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      throw err as ApiErrorResponse;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (token) {
        await apiFetch<void>("/auth/logout", { method: "POST" });
      }
    } catch {
      // Ignore API logout errors during client teardown
    } finally {
      localStorage.removeItem("crm_token");
      localStorage.removeItem("crm_user");
      setToken(null);
      setUser(null);
    }
  };

  const clearSessionExpiredMessage = () => {
    setSessionExpiredMessage(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        sessionExpiredMessage,
        login,
        logout,
        clearSessionExpiredMessage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
