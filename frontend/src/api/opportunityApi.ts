import { apiFetch } from "./client";
import type {
  Opportunity,
  OpportunityListResponse,
  StageTransitionRequest
} from "../types/opportunity";

export async function getOpportunities(params: {
  page?: number;
  pageSize?: number;
  stage?: string;
  mine?: boolean;
}): Promise<OpportunityListResponse> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", params.page.toString());
  if (params.pageSize) queryParams.set("pageSize", params.pageSize.toString());
  if (params.stage) queryParams.set("stage", params.stage);
  if (params.mine !== undefined) queryParams.set("mine", params.mine.toString());

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  return apiFetch<OpportunityListResponse>(`/opportunities${queryString}`);
}

export async function getOpportunityById(id: number): Promise<Opportunity> {
  return apiFetch<Opportunity>(`/opportunities/${id}`);
}

export async function transitionOpportunityStage(
  id: number,
  body: StageTransitionRequest
): Promise<Opportunity> {
  return apiFetch<Opportunity>(`/opportunities/${id}/stage`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}
