export interface PerRepSummary {
  repId: number;
  repName: string;
  openLeads: number;
  openPipelineValue: number;
  wonThisMonth: number;
}

export interface DashboardSummary {
  openLeads: number;
  leadsByStatus: Record<string, number>;
  openOpportunities: number;
  openPipelineValue: number;
  followUpsDueToday: number;
  wonThisMonth: number;
  lostThisMonth: number;
  conversionRate: number | null;
  perRep?: PerRepSummary[];
}
