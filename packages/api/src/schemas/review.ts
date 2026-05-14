import { z } from "zod";

export const createReviewSchema = z.object({
  appointmentId: z.string().uuid("Agendamento inválido"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const replyReviewSchema = z.object({
  venueReply: z.string().min(1).max(500),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ReplyReviewInput = z.infer<typeof replyReviewSchema>;
