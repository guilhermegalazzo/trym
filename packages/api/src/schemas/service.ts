import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(100),
  subcategoryId: z.string().uuid().optional(),
  description: z.string().max(300).optional(),
  durationMinutes: z
    .number()
    .int()
    .min(5, "Duração mínima de 5 min")
    .max(480, "Duração máxima de 8h"),
  priceCents: z.number().int().min(100, "Preço mínimo R$ 1,00"),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  attributes: z.record(z.unknown()).default({}),
});

export const updateServiceSchema = createServiceSchema.partial();

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
