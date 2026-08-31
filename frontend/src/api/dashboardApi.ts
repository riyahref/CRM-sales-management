import { apiFetch } from "./client";
import type { DashboardSummary } from "../types/dashboard";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/dashboard/summary");
}
