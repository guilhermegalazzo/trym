import { z } from "zod";

export const createAppointmentSchema = z.object({
  venueId: z.string().uuid("Venue inválido"),
  teamMemberId: z.string().uuid().optional(),
  serviceIds: z.array(z.string().uuid()).min(1, "Selecione ao menos 1 serviço"),
  scheduledAt: z.string().datetime("Data inválida"),
  paymentMethod: z.enum(["in_app", "in_person"]),
  customerNotes: z.string().max(300).optional(),
});

export const cancelAppointmentSchema = z.object({
  cancellationReason: z.string().max(200).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
