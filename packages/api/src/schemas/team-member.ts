import { z } from "zod";

export const createTeamMemberSchema = z.object({
  displayName: z.string().min(2).max(100),
  bio: z.string().max(300).optional(),
  role: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export const updateTeamMemberSchema = createTeamMemberSchema.partial();

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
