import { prisma } from "../lib/prisma.js";
import { AuthUser } from "../types/express.js";
import {
  OpportunityQueryInput,
  StageTransitionInput
} from "../validation/opportunity.validation.js";
import { NotFoundError, ApiError } from "../lib/errors.js";
import { Prisma, OpportunityStage } from "@prisma/client";

const STAGE_ORDER: OpportunityStage[] = [
  OpportunityStage.New,
  OpportunityStage.Contacted,
  OpportunityStage.Qualified,
  OpportunityStage.Proposal,
  OpportunityStage.Negotiation,
  OpportunityStage.Won
];

/**
 * Pure validation function for stage transitions (unit testable, no side effects).
 */
export function assertValidTransition(
  currentStage: OpportunityStage,
  toStage: OpportunityStage,
  lostReason?: string
): void {
  // 1. Terminal stage check
  if (currentStage === OpportunityStage.Won || currentStage === OpportunityStage.Lost) {
    throw new ApiError(
      409,
      "INVALID_TRANSITION",
      `Opportunity is already terminal ('${currentStage}') and cannot be changed.`
    );
  }

  // 2. Transitioning to Lost
  if (toStage === OpportunityStage.Lost) {
    if (!lostReason || lostReason.trim().length < 3) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Lost reason must be at least 3 characters when marking opportunity as Lost."
      );
    }
    return;
  }

  // 3. Sequential forward transition check
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const toIndex = STAGE_ORDER.indexOf(toStage);

  if (currentIndex === -1 || toIndex === -1 || toIndex !== currentIndex + 1) {
    throw new ApiError(
      409,
      "INVALID_TRANSITION",
      `Cannot move from '${currentStage}' to '${toStage}' directly.`
    );
  }
}

export class OpportunityService {
  public async getOpportunities(user: AuthUser, query: OpportunityQueryInput) {
    const { page, pageSize, stage, mine } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.OpportunityWhereInput = {};

    // Reps only see their own; Managers see their own if mine=true, or all if mine=false
    if (user.role === "rep" || mine) {
      where.ownerId = user.id;
    }

    if (stage) {
      where.stage = stage;
    }

    const [total, data] = await Promise.all([
      prisma.opportunity.count({ where }),
      prisma.opportunity.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: {
              id: true,
              companyName: true
            }
          }
        }
      })
    ]);

    return {
      page,
      pageSize,
      total,
      data
    };
  }

  public async getOpportunityById(user: AuthUser, id: number) {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        customer: true,
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!opportunity) {
      throw new NotFoundError("This record could not be found.");
    }

    // Ownership check: Rep can only see their own opportunity
    if (user.role === "rep" && opportunity.ownerId !== user.id) {
      throw new NotFoundError("This record could not be found.");
    }

    return opportunity;
  }

  public async transitionStage(user: AuthUser, id: number, input: StageTransitionInput) {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id }
    });

    if (!opportunity) {
      throw new NotFoundError("This record could not be found.");
    }

    // Ownership check: Rep can only transition their own opportunity
    if (user.role === "rep" && opportunity.ownerId !== user.id) {
      throw new NotFoundError("This record could not be found.");
    }

    // Validate transition rule
    assertValidTransition(opportunity.stage, input.toStage, input.lostReason);

    const updatedOpportunity = await prisma.opportunity.update({
      where: { id },
      data: {
        stage: input.toStage,
        lostReason: input.toStage === OpportunityStage.Lost ? input.lostReason : null,
        updatedAt: new Date()
      },
      include: {
        customer: true
      }
    });

    return updatedOpportunity;
  }
}

export const opportunityService = new OpportunityService();
