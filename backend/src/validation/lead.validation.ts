import { z } from "zod";
import { LeadStatus, LeadSource } from "@prisma/client";

const phoneRegex = /^[\d\s+\-()]*$/;

export const leadQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(LeadStatus).optional(),
  source: z.nativeEnum(LeadSource).optional(),
  q: z.string().optional()
});

export const leadIdParamSchema = z.object({
  id: z.coerce.number().int().min(1)
});

export const createLeadSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(100, "Company name cannot exceed 100 characters"),
  contactName: z
    .string()
    .trim()
    .min(1, "Contact name is required")
    .max(100, "Contact name cannot exceed 100 characters"),
  contactEmail: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(100, "Email cannot exceed 100 characters"),
  contactPhone: z
    .string()
    .trim()
    .regex(phoneRegex, "Phone contains invalid characters")
    .max(20, "Phone number cannot exceed 20 characters")
    .optional()
    .nullable(),
  source: z.nativeEnum(LeadSource, { errorMap: () => ({ message: "Select a valid lead source" }) }),
  ownerId: z.number().int().min(1, "Owner is required")
});

export const updateLeadSchema = z
  .object({
    companyName: z
      .string()
      .trim()
      .min(1, "Company name cannot be empty")
      .max(100, "Company name cannot exceed 100 characters")
      .optional(),
    contactName: z
      .string()
      .trim()
      .min(1, "Contact name cannot be empty")
      .max(100, "Contact name cannot exceed 100 characters")
      .optional(),
    contactEmail: z
      .string()
      .trim()
      .email("Enter a valid email address")
      .max(100, "Email cannot exceed 100 characters")
      .optional(),
    contactPhone: z
      .string()
      .trim()
      .regex(phoneRegex, "Phone contains invalid characters")
      .max(20, "Phone number cannot exceed 20 characters")
      .optional()
      .nullable(),
    source: z.nativeEnum(LeadSource).optional(),
    status: z.nativeEnum(LeadStatus).optional(),
    disqualifyReason: z
      .string()
      .trim()
      .max(500, "Disqualify reason cannot exceed 500 characters")
      .optional()
      .nullable(),
    ownerId: z.number().int().min(1).optional()
  })
  .superRefine((data, ctx) => {
    if (data.status === LeadStatus.Disqualified) {
      if (!data.disqualifyReason || data.disqualifyReason.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["disqualifyReason"],
          message: "Disqualify reason must be at least 5 characters long."
        });
      }
    }
  });

export type LeadQueryInput = z.infer<typeof leadQuerySchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
