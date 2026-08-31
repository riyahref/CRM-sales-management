// File length exception (~235 lines): Contains role-scoped summary aggregation logic, per-rep performance breakdowns, and win rate calculation.
import { prisma } from "../lib/prisma.js";
import { AuthUser } from "../types/express.js";

export class DashboardService {
  public async getSummary(user: AuthUser) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (user.role === "rep") {
      return this.getRepSummary(user.id, startOfMonth, endOfToday);
    } else {
      return this.getManagerSummary(startOfMonth, endOfToday);
    }
  }

  private async getRepSummary(repId: number, startOfMonth: Date, endOfToday: Date) {
    const [
      openLeads,
      statusGroup,
      openOpportunities,
      openValueAgg,
      wonThisMonth,
      lostThisMonth,
      dueActivities
    ] = await Promise.all([
      // 1. Open leads
      prisma.lead.count({
        where: {
          ownerId: repId,
          status: { notIn: ["Converted", "Disqualified"] }
        }
      }),
      // 2. Leads by status
      prisma.lead.groupBy({
        by: ["status"],
        where: { ownerId: repId },
        _count: { status: true }
      }),
      // 3. Open opportunities
      prisma.opportunity.count({
        where: {
          ownerId: repId,
          stage: { notIn: ["Won", "Lost"] }
        }
      }),
      // 4. Open pipeline value
      prisma.opportunity.aggregate({
        _sum: { dealValue: true },
        where: {
          ownerId: repId,
          stage: { notIn: ["Won", "Lost"] }
        }
      }),
      // 5. Won this month
      prisma.opportunity.count({
        where: {
          ownerId: repId,
          stage: "Won",
          updatedAt: { gte: startOfMonth }
        }
      }),
      // 6. Lost this month
      prisma.opportunity.count({
        where: {
          ownerId: repId,
          stage: "Lost",
          updatedAt: { gte: startOfMonth }
        }
      }),
      // 7. Follow-ups due today
      prisma.activity.findMany({
        where: {
          ownerId: repId,
          nextFollowUpDate: { lte: endOfToday }
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    const leadsByStatus: Record<string, number> = {};
    for (const item of statusGroup) {
      leadsByStatus[item.status] = item._count.status;
    }

    // Deduplicate follow-ups: latest activity per customer
    const customerLatestFollowUp = new Map<number, Date>();
    for (const act of dueActivities) {
      if (!customerLatestFollowUp.has(act.customerId)) {
        if (act.nextFollowUpDate) {
          customerLatestFollowUp.set(act.customerId, act.nextFollowUpDate);
        }
      }
    }
    let followUpsDueToday = 0;
    for (const [, nextDate] of customerLatestFollowUp) {
      if (nextDate <= endOfToday) {
        followUpsDueToday++;
      }
    }

    const totalClosed = wonThisMonth + lostThisMonth;
    const conversionRate = totalClosed > 0 ? Number((wonThisMonth / totalClosed).toFixed(4)) : null;

    return {
      openLeads,
      leadsByStatus,
      openOpportunities,
      openPipelineValue: openValueAgg._sum.dealValue || 0,
      followUpsDueToday,
      wonThisMonth,
      lostThisMonth,
      conversionRate
    };
  }

  private async getManagerSummary(startOfMonth: Date, endOfToday: Date) {
    const [
      openLeads,
      statusGroup,
      openOpportunities,
      openValueAgg,
      wonThisMonth,
      lostThisMonth,
      dueActivities,
      activeReps
    ] = await Promise.all([
      // Total open leads
      prisma.lead.count({
        where: { status: { notIn: ["Converted", "Disqualified"] } }
      }),
      // Status breakdown
      prisma.lead.groupBy({
        by: ["status"],
        _count: { status: true }
      }),
      // Total open opportunities
      prisma.opportunity.count({
        where: { stage: { notIn: ["Won", "Lost"] } }
      }),
      // Open pipeline value
      prisma.opportunity.aggregate({
        _sum: { dealValue: true },
        where: { stage: { notIn: ["Won", "Lost"] } }
      }),
      // Won this month
      prisma.opportunity.count({
        where: {
          stage: "Won",
          updatedAt: { gte: startOfMonth }
        }
      }),
      // Lost this month
      prisma.opportunity.count({
        where: {
          stage: "Lost",
          updatedAt: { gte: startOfMonth }
        }
      }),
      // Follow-ups due
      prisma.activity.findMany({
        where: { nextFollowUpDate: { lte: endOfToday } },
        orderBy: { createdAt: "desc" }
      }),
      // Active reps
      prisma.user.findMany({
        where: { role: "rep", isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" }
      })
    ]);

    const leadsByStatus: Record<string, number> = {};
    for (const item of statusGroup) {
      leadsByStatus[item.status] = item._count.status;
    }

    const customerLatestFollowUp = new Map<number, Date>();
    for (const act of dueActivities) {
      if (!customerLatestFollowUp.has(act.customerId)) {
        if (act.nextFollowUpDate) {
          customerLatestFollowUp.set(act.customerId, act.nextFollowUpDate);
        }
      }
    }
    let followUpsDueToday = 0;
    for (const [, nextDate] of customerLatestFollowUp) {
      if (nextDate <= endOfToday) {
        followUpsDueToday++;
      }
    }

    const totalClosed = wonThisMonth + lostThisMonth;
    const conversionRate = totalClosed > 0 ? Number((wonThisMonth / totalClosed).toFixed(4)) : null;

    // Build perRep breakdown
    const perRep = await Promise.all(
      activeReps.map(async (rep) => {
        const [repOpenLeads, repValueAgg, repWonMonth] = await Promise.all([
          prisma.lead.count({
            where: { ownerId: rep.id, status: { notIn: ["Converted", "Disqualified"] } }
          }),
          prisma.opportunity.aggregate({
            _sum: { dealValue: true },
            where: { ownerId: rep.id, stage: { notIn: ["Won", "Lost"] } }
          }),
          prisma.opportunity.count({
            where: { ownerId: rep.id, stage: "Won", updatedAt: { gte: startOfMonth } }
          })
        ]);

        return {
          repId: rep.id,
          repName: rep.name,
          openLeads: repOpenLeads,
          openPipelineValue: repValueAgg._sum.dealValue || 0,
          wonThisMonth: repWonMonth
        };
      })
    );

    return {
      openLeads,
      leadsByStatus,
      openOpportunities,
      openPipelineValue: openValueAgg._sum.dealValue || 0,
      followUpsDueToday,
      wonThisMonth,
      lostThisMonth,
      conversionRate,
      perRep
    };
  }
}

export const dashboardService = new DashboardService();
