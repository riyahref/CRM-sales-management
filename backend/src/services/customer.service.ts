import { prisma } from "../lib/prisma.js";
import { AuthUser } from "../types/express.js";
import { ContactPersonCreateInput } from "../validation/customer.validation.js";
import { ActivityCreateInput } from "../validation/activity.validation.js";
import { NotFoundError } from "../lib/errors.js";

export class CustomerService {
  private async checkCustomerOwnershipOrThrow(user: AuthUser, customerId: number) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        convertedFromLead: { select: { ownerId: true } },
        opportunities: { select: { ownerId: true } },
        activities: { select: { ownerId: true } }
      }
    });

    if (!customer) {
      throw new NotFoundError("This record could not be found.");
    }

    if (user.role === "rep") {
      const isLeadOwner = customer.convertedFromLead?.ownerId === user.id;
      const isOppOwner = customer.opportunities.some((opp) => opp.ownerId === user.id);
      const isActivityOwner = customer.activities.some((act) => act.ownerId === user.id);

      if (!isLeadOwner && !isOppOwner && !isActivityOwner) {
        throw new NotFoundError("This record could not be found.");
      }
    }

    return customer;
  }

  public async getCustomerDetail(user: AuthUser, id: number) {
    await this.checkCustomerOwnershipOrThrow(user, id);

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        contacts: {
          orderBy: [{ isPrimary: "desc" }, { id: "asc" }]
        },
        opportunities: {
          where: user.role === "rep" ? { ownerId: user.id } : {},
          orderBy: { createdAt: "desc" }
        },
        activities: {
          orderBy: { createdAt: "desc" },
          include: {
            owner: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    return customer;
  }

  public async addContactPerson(
    user: AuthUser,
    customerId: number,
    input: ContactPersonCreateInput
  ) {
    await this.checkCustomerOwnershipOrThrow(user, customerId);

    const result = await prisma.$transaction(async (tx) => {
      // If setting as primary, un-mark existing primary contacts for this customer
      if (input.isPrimary) {
        await tx.contactPerson.updateMany({
          where: { customerId, isPrimary: true },
          data: { isPrimary: false }
        });
      }

      const newContact = await tx.contactPerson.create({
        data: {
          customerId,
          name: input.name,
          title: input.title || null,
          email: input.email,
          phone: input.phone || null,
          isPrimary: input.isPrimary
        }
      });

      return newContact;
    });

    return result;
  }

  public async logActivity(user: AuthUser, customerId: number, input: ActivityCreateInput) {
    await this.checkCustomerOwnershipOrThrow(user, customerId);

    let nextFollowUpDate: Date | null = null;
    if (input.nextFollowUpDate && input.nextFollowUpDate.trim() !== "") {
      nextFollowUpDate = new Date(input.nextFollowUpDate);
    }

    const activity = await prisma.activity.create({
      data: {
        customerId,
        opportunityId: input.opportunityId || null,
        ownerId: user.id,
        type: input.type,
        notes: input.notes,
        nextFollowUpDate
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return activity;
  }
}

export const customerService = new CustomerService();
