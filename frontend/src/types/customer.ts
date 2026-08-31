import type { Opportunity } from "./opportunity";

export type ActivityType = "call" | "meeting" | "note";

export interface ContactPerson {
  id: number;
  customerId: number;
  name: string;
  title?: string | null;
  email: string;
  phone?: string | null;
  isPrimary: boolean;
}

export interface Activity {
  id: number;
  customerId: number;
  opportunityId?: number | null;
  ownerId: number;
  type: ActivityType;
  notes: string;
  nextFollowUpDate?: string | null;
  createdAt: string;
  owner?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Customer {
  id: number;
  companyName: string;
  industry?: string | null;
  billingAddress?: string | null;
  convertedFromLeadId?: number | null;
  createdAt: string;
}

export interface CustomerDetailResponse extends Customer {
  contacts: ContactPerson[];
  opportunities: Opportunity[];
  activities: Activity[];
}

export interface ContactPersonCreateRequest {
  name: string;
  title?: string;
  email: string;
  phone?: string;
  isPrimary?: boolean;
}

export interface ActivityCreateRequest {
  type: ActivityType;
  notes: string;
  nextFollowUpDate?: string | null;
  opportunityId?: number;
}
