import { z } from "zod";

const phoneRegex = /^[\d\s+\-()]*$/;

export const contactPersonCreateSchema = z.object({
  name: z
    .string({
      required_error: "Contact name is required."
    })
    .min(1, "Contact name is required.")
    .max(100, "Contact name cannot exceed 100 characters"),
  title: z.string().max(100, "Title cannot exceed 100 characters").optional(),
  email: z
    .string({
      required_error: "Contact email is required."
    })
    .email("Enter a valid email address")
    .max(100, "Email cannot exceed 100 characters"),
  phone: z
    .string()
    .regex(phoneRegex, "Phone contains invalid characters")
    .max(20, "Phone number cannot exceed 20 characters")
    .optional(),
  isPrimary: z.boolean().default(false)
});

export type ContactPersonCreateInput = z.infer<typeof contactPersonCreateSchema>;
