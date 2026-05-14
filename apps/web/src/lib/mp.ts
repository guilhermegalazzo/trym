import { MercadoPagoConfig } from "mercadopago";

// Lazy singleton — safe to import in any server context.
// Returns null when credentials are not set (e.g. local dev without .env).
export function getMpClient(): MercadoPagoConfig | null {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return null;
  return new MercadoPagoConfig({ accessToken: token });
}

export const MP_ENABLED = !!process.env.MERCADOPAGO_ACCESS_TOKEN;
