import { z } from "zod";
import { OpportunityStage } from "@prisma/client";

export const opportunityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  stage: z.nativeEnum(OpportunityStage).optional(),
  mine: z.preprocess((val) => {
    if (typeof val === "string") {
      if (val === "true") return true;
      if (val === "false") return false;
    }
    return val;
  }, z.boolean().default(true))
});

export type OpportunityQueryInput = z.infer<typeof opportunityQuerySchema>;

export const stageTransitionSchema = z
  .object({
    toStage: z.nativeEnum(OpportunityStage, {
      required_error: "toStage is required."
    }),
    lostReason: z.string().optional()
  })
  .refine(
    (data) => {
      if (data.toStage === OpportunityStage.Lost) {
        return !!data.lostReason && data.lostReason.trim().length >= 3;
      }
      return true;
    },
    {
      message: "Lost reason must be at least 3 characters when marking opportunity as Lost.",
      path: ["lostReason"]
    }
  );

export type StageTransitionInput = z.infer<typeof stageTransitionSchema>;
