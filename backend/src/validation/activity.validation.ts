import { z } from "zod";
import { ActivityType } from "@prisma/client";

export const activityCreateSchema = z.object({
  type: z.nativeEnum(ActivityType, {
    required_error: "Activity type is required."
  }),
  notes: z
    .string({
      required_error: "Notes are required."
    })
    .min(3, "Notes must be at least 3 characters long.")
    .max(1000, "Notes cannot exceed 1000 characters"),
  nextFollowUpDate: z.string().nullable().optional(),
  opportunityId: z.number().int().optional()
});

export type ActivityCreateInput = z.infer<typeof activityCreateSchema>;
