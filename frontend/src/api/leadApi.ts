import { apiFetch } from "./client";
import type {
  Lead,
  PaginatedLeads,
  LeadCreatePayload,
  LeadUpdatePayload,
  LeadStatus,
  LeadSource
} from "../types/lead";

export interface LeadQueryParams {
  page?: number;
  pageSize?: number;
  status?: LeadStatus | "";
  source?: LeadSource | "";
  q?: string;
}

export interface ConvertLeadResult {
  message: string;
  customer: { id: number; companyName: string };
  opportunity: { id: number; dealValue: number; stage: string };
}

export async function fetchLeads(params: LeadQueryParams = {}): Promise<PaginatedLeads> {
  const query = new URLSearchParams();

  if (params.page) query.append("page", params.page.toString());
  if (params.pageSize) query.append("pageSize", params.pageSize.toString());
  if (params.status) query.append("status", params.status);
  if (params.source) query.append("source", params.source);
  if (params.q) query.append("q", params.q);

  const queryString = query.toString();
  const endpoint = `/leads${queryString ? `?${queryString}` : ""}`;

  return apiFetch<PaginatedLeads>(endpoint);
}

export async function fetchLeadById(id: number): Promise<Lead> {
  return apiFetch<Lead>(`/leads/${id}`);
}

export async function createLead(payload: LeadCreatePayload): Promise<Lead> {
  return apiFetch<Lead>("/leads", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateLead(id: number, payload: LeadUpdatePayload): Promise<Lead> {
  return apiFetch<Lead>(`/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function convertLead(
  id: number,
  payload?: { dealValue?: number; expectedCloseDate?: string }
): Promise<ConvertLeadResult> {
  return apiFetch<ConvertLeadResult>(`/leads/${id}/convert`, {
    method: "POST",
    body: JSON.stringify(payload || {})
  });
}
