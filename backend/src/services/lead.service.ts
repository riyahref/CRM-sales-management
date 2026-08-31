// File length exception (~210 lines): Contains complete Lead domain lifecycle logic including CRUD, search filtering, and the atomic Lead-to-Opportunity conversion transaction.
import { prisma } from "../lib/prisma.js";
import { AuthUser } from "../types/express.js";
import { CreateLeadInput, LeadQueryInput, UpdateLeadInput } from "../validation/lead.validation.js";
import { NotFoundError, ApiError, ForbiddenError } from "../lib/errors.js";
import { Prisma, LeadStatus } from "@prisma/client";

export class LeadService {
  public async getLeads(user: AuthUser, query: LeadQueryInput) {
    const { page, pageSize, status, source, q } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.LeadWhereInput = {};

    // Reps see only their own leads; Managers see all
    if (user.role === "rep") {
      where.ownerId = user.id;
    }

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    if (q && q.trim().length > 0) {
      const searchTerm = q.trim();
      where.OR = [
        { companyName: { contains: searchTerm, mode: "insensitive" } },
        { contactName: { contains: searchTerm, mode: "insensitive" } }
      ];
    }

    const [total, data] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          owner: {
            select: { id: true, name: true }
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

  public async getLeadById(user: AuthUser, id: number) {
    const lead = await prisma.lead.findUnique({
      where: { id }
    });

    if (!lead) {
      throw new NotFoundError("This record could not be found.");
    }

    // Ownership check: If Rep does not own this lead, return generic 404 to avoid leaking existence
    if (user.role === "rep" && lead.ownerId !== user.id) {
      throw new NotFoundError("This record could not be found.");
    }

    return lead;
  }

  public async createLead(user: AuthUser, input: CreateLeadInput) {
    if (user.role !== "manager") {
      throw new ForbiddenError("You don't have access to this record.");
    }

    const lead = await prisma.lead.create({
      data: {
        companyName: input.companyName,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone || null,
        source: input.source,
        ownerId: input.ownerId,
        status: LeadStatus.New
      }
    });

    return lead;
  }

  public async updateLead(user: AuthUser, id: number, input: UpdateLeadInput) {
    const lead = await prisma.lead.findUnique({
      where: { id }
    });

    if (!lead) {
      throw new NotFoundError("This record could not be found.");
    }

    // Ownership check: Rep can only update their own lead
    if (user.role === "rep" && lead.ownerId !== user.id) {
      throw new NotFoundError("This record could not be found.");
    }

    // Rule: Status can never be manually set to 'Converted'
    if (input.status === LeadStatus.Converted) {
      throw new ApiError(
        409,
        "INVALID_STATE",
        "Status 'Converted' can only be set via the Convert action."
      );
    }

    // Rule: Only managers can reassign lead owners
    if (input.ownerId !== undefined && input.ownerId !== lead.ownerId && user.role !== "manager") {
      throw new ForbiddenError("Only managers can reassign lead owners.");
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        ...(input.companyName !== undefined && { companyName: input.companyName }),
        ...(input.contactName !== undefined && { contactName: input.contactName }),
        ...(input.contactEmail !== undefined && { contactEmail: input.contactEmail }),
        ...(input.contactPhone !== undefined && { contactPhone: input.contactPhone }),
        ...(input.source !== undefined && { source: input.source }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.disqualifyReason !== undefined && { disqualifyReason: input.disqualifyReason }),
        ...(input.ownerId !== undefined && { ownerId: input.ownerId })
      }
    });

    return updatedLead;
  }

  public async convertLead(user: AuthUser, id: number) {
    const lead = await prisma.lead.findUnique({
      where: { id }
    });

    if (!lead) {
      throw new NotFoundError("This record could not be found.");
    }

    // Ownership check: Rep can only convert their own lead
    if (user.role === "rep" && lead.ownerId !== user.id) {
      throw new NotFoundError("This record could not be found.");
    }

    // Eligibility check: Only 'Contacted' or 'Qualified' leads can convert
    if (lead.status !== LeadStatus.Contacted && lead.status !== LeadStatus.Qualified) {
      throw new ApiError(
        409,
        "INVALID_STATE",
        "Lead must be Contacted or Qualified before conversion."
      );
    }

    // Single atomic Prisma transaction: Customer + ContactPerson + Opportunity + Lead update
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Customer
      const customer = await tx.customer.create({
        data: {
          companyName: lead.companyName,
          convertedFromLeadId: lead.id
        }
      });

      // 2. Create primary Contact Person
      const contactPerson = await tx.contactPerson.create({
        data: {
          customerId: customer.id,
          name: lead.contactName,
          email: lead.contactEmail,
          phone: lead.contactPhone,
          isPrimary: true
        }
      });

      // 3. Create initial Opportunity in stage 'New'
      const closeDate = new Date();
      closeDate.setDate(closeDate.getDate() + 30);

      const opportunity = await tx.opportunity.create({
        data: {
          customerId: customer.id,
          ownerId: lead.ownerId,
          stage: "New",
          dealValue: 0,
          expectedCloseDate: closeDate
        }
      });

      // 4. Update Lead status to 'Converted'
      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: { status: LeadStatus.Converted }
      });

      return {
        lead: updatedLead,
        customer,
        contactPerson,
        opportunity
      };
    });

    return result;
  }
}

export const leadService = new LeadService();
