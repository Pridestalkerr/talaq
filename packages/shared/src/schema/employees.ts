import { z } from "zod";

export const create = z.object({
  employeeNumber: z.string().min(3).max(50),
  firstName: z.string().min(3).max(100),
  lastName: z.string().min(3).max(100),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(3).max(20).optional(),
  skills: z.array(z.string().uuid()),
  categories: z.array(z.string().uuid()),
  primarySkill: z.string().min(3).max(255),
  secondarySkill: z.string().min(3).max(255).optional(),
  band: z.string().min(3).max(30),
  subBand: z.string().min(3).max(30),
});
