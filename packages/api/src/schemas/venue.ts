import { z } from "zod";

export const createVenueSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(100),
  categoryId: z.string().uuid("Categoria inválida"),
  description: z.string().max(500).optional(),
  addressLine: z.string().min(5, "Endereço é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().length(2, "UF inválida"),
  postalCode: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  cnpj: z.string().regex(/^\d{14}$/, "CNPJ inválido").optional(),
  acceptsInAppPayment: z.boolean().default(false),
});

export const updateVenueSchema = createVenueSchema.partial();

export const venueSlugSchema = z.object({
  slug: z.string().min(1),
});

export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
