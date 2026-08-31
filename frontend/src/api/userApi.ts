import { apiFetch } from "./client";
import type { User } from "../types/auth";

export async function fetchUsers(includeInactive = false): Promise<User[]> {
  const query = includeInactive ? "?includeInactive=true" : "";
  return apiFetch<User[]>(`/users${query}`);
}

export async function updateUserStatus(id: number, isActive: boolean): Promise<User> {
  return apiFetch<User>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ isActive })
  });
}
