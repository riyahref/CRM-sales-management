export type LeadStatus = "New" | "Contacted" | "Qualified" | "Converted" | "Disqualified";

export type LeadSource = "Website" | "Referral" | "Cold Call" | "Trade Show" | "Other";

export interface Lead {
  id: number;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  source: LeadSource;
  status: LeadStatus;
  disqualifyReason?: string | null;
  ownerId: number;
  owner?: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedLeads {
  page: number;
  pageSize: number;
  total: number;
  data: Lead[];
}

export interface LeadCreatePayload {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  source: LeadSource;
  ownerId: number;
}

export interface LeadUpdatePayload {
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string | null;
  source?: LeadSource;
  status?: LeadStatus;
  disqualifyReason?: string | null;
  ownerId?: number;
}
