import { z } from "zod";

export const updateUserStatusSchema = z.object({
  isActive: z.boolean({
    required_error: "isActive is required."
  })
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
