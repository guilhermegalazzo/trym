export type UserRole = "customer" | "professional" | "admin";
export type VenueStatus = "pending" | "active" | "suspended";
export type AppointmentStatus = "confirmed" | "completed" | "cancelled" | "no_show";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "cancelled";
export type PaymentMethod = "in_app" | "in_person";
export type PaymentStatus = "pending" | "paid" | "refunded";

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface SearchVenuesParams extends PaginationParams {
  categorySlug?: string;
  subcategorySlug?: string;
  query?: string;
  city?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "rating" | "distance" | "recent";
  acceptsInAppPayment?: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiErrorResponse {
  data: null;
  error: ApiError;
}
