export type OpportunityStage =
  "New" | "Contacted" | "Qualified" | "Proposal" | "Negotiation" | "Won" | "Lost";

export interface Opportunity {
  id: number;
  customerId: number;
  ownerId: number;
  stage: OpportunityStage;
  dealValue: number;
  expectedCloseDate: string;
  lostReason?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: number;
    companyName: string;
  };
  owner?: {
    id: number;
    name: string;
  };
}

export interface OpportunityListResponse {
  page: number;
  pageSize: number;
  total: number;
  data: Opportunity[];
}

export interface StageTransitionRequest {
  toStage: OpportunityStage;
  lostReason?: string;
}
