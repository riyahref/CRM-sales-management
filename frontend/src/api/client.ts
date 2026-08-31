import type { ApiErrorResponse } from "../types/auth";

const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return "http://localhost:4000/api/v1";
  const trimmed = envUrl.trim().replace(/\/$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
};

const BASE_URL = getBaseUrl();

let onSessionExpiredHandler: (() => void) | null = null;

export function registerSessionExpiredHandler(handler: () => void): void {
  onSessionExpiredHandler = handler;
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("crm_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      const errorData = data as ApiErrorResponse;
      if (
        errorData.error === "UNAUTHORIZED" &&
        onSessionExpiredHandler &&
        endpoint !== "/auth/login"
      ) {
        onSessionExpiredHandler();
      }
    }
    throw data as ApiErrorResponse;
  }

  return data as T;
}
