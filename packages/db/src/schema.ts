import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  time,
  date,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["customer", "professional", "admin"]);

export const venueStatusEnum = pgEnum("venue_status", ["pending", "active", "suspended"]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "read_only",
  "cancelled",
]);

// ─── Profiles ────────────────────────────────────────────────────────────────

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").notNull().default("customer"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Categories ──────────────────────────────────────────────────────────────

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon"),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
});

export const subcategories = pgTable(
  "subcategories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    displayOrder: integer("display_order").default(0),
  },
  (t) => [uniqueIndex("subcategories_category_slug_idx").on(t.categoryId, t.slug)],
);

// ─── Venues ──────────────────────────────────────────────────────────────────

export const venues = pgTable(
  "venues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    coverImageUrl: text("cover_image_url"),
    galleryUrls: text("gallery_urls").array(),
    // Address
    addressLine: text("address_line"),
    city: text("city"),
    state: text("state"),
    postalCode: text("postal_code"),
    country: text("country").default("BR"),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    // Business
    cnpj: text("cnpj"),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    // Payment
    acceptsInAppPayment: boolean("accepts_in_app_payment").default(false),
    mercadopagoAccountId: text("mercadopago_account_id"),
    // WhatsApp Business (Pro)
    whatsappBusinessConnected: boolean("whatsapp_business_connected").default(false),
    whatsappBusinessPhoneId: text("whatsapp_business_phone_id"),
    whatsappBusinessTokenEncrypted: text("whatsapp_business_token_encrypted"),
    // Nicho attributes
    attributes: jsonb("attributes").default({}),
    // Status
    status: venueStatusEnum("status").default("pending").notNull(),
    isFeatured: boolean("is_featured").default(false),
    featuredUntil: timestamp("featured_until", { withTimezone: true }),
    ratingAverage: numeric("rating_average", { precision: 2, scale: 1 }).default("0"),
    ratingCount: integer("rating_count").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("venues_owner_id_idx").on(t.ownerId),
    index("venues_category_id_idx").on(t.categoryId),
    index("venues_status_idx").on(t.status),
    index("venues_location_idx").on(t.latitude, t.longitude),
  ],
);

// ─── Team Members ─────────────────────────────────────────────────────────────

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "set null" }),
    displayName: text("display_name").notNull(),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    role: text("role"),
    commissionPercentage: numeric("commission_percentage", { precision: 5, scale: 2 }).default(
      "0",
    ),
    isActive: boolean("is_active").default(true),
    displayOrder: integer("display_order").default(0),
  },
  (t) => [index("team_members_venue_id_idx").on(t.venueId)],
);

export const teamMemberServices = pgTable(
  "team_member_services",
  {
    teamMemberId: uuid("team_member_id")
      .notNull()
      .references(() => teamMembers.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    commissionPercentageOverride: numeric("commission_percentage_override", {
      precision: 5,
      scale: 2,
    }),
  },
  (t) => [primaryKey({ columns: [t.teamMemberId, t.serviceId] })],
);

export const teamMemberHours = pgTable(
  "team_member_hours",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamMemberId: uuid("team_member_id")
      .notNull()
      .references(() => teamMembers.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: time("start_time"),
    endTime: time("end_time"),
    isOff: boolean("is_off").default(false),
  },
  (t) => [uniqueIndex("team_member_hours_member_day_idx").on(t.teamMemberId, t.dayOfWeek)],
);

// ─── Services ────────────────────────────────────────────────────────────────

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    subcategoryId: uuid("subcategory_id").references(() => subcategories.id),
    name: text("name").notNull(),
    description: text("description"),
    durationMinutes: integer("duration_minutes").notNull(),
    priceCents: integer("price_cents").notNull(),
    isActive: boolean("is_active").default(true),
    displayOrder: integer("display_order").default(0),
    attributes: jsonb("attributes").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("services_venue_id_idx").on(t.venueId)],
);

// ─── Products (PDV) ───────────────────────────────────────────────────────────

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sku: text("sku"),
    priceCents: integer("price_cents").notNull(),
    costCents: integer("cost_cents").default(0),
    stockQuantity: integer("stock_quantity").default(0),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("products_venue_id_idx").on(t.venueId)],
);

// ─── Business Hours ───────────────────────────────────────────────────────────

export const businessHours = pgTable(
  "business_hours",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    openTime: time("open_time"),
    closeTime: time("close_time"),
    isClosed: boolean("is_closed").default(false),
  },
  (t) => [uniqueIndex("business_hours_venue_day_idx").on(t.venueId, t.dayOfWeek)],
);

// ─── Schedule Blocks ──────────────────────────────────────────────────────────

export const scheduleBlocks = pgTable(
  "schedule_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    teamMemberId: uuid("team_member_id").references(() => teamMembers.id, {
      onDelete: "set null",
    }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    reason: text("reason"),
    isRecurring: boolean("is_recurring").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("schedule_blocks_venue_id_idx").on(t.venueId)],
);

// ─── Venue Customers ──────────────────────────────────────────────────────────

export const venueCustomers = pgTable(
  "venue_customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "set null" }),
    fullName: text("full_name").notNull(),
    phone: text("phone"),
    email: text("email"),
    birthDate: date("birth_date"),
    totalSpentCents: integer("total_spent_cents").default(0),
    visitCount: integer("visit_count").default(0),
    lastVisitAt: timestamp("last_visit_at", { withTimezone: true }),
    privateNotes: text("private_notes"),
    tags: text("tags").array().default(sql`'{}'`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("venue_customers_venue_id_idx").on(t.venueId),
    index("venue_customers_profile_id_idx").on(t.profileId),
    uniqueIndex("venue_customers_venue_profile_idx").on(t.venueId, t.profileId),
  ],
);

// ─── Appointments ─────────────────────────────────────────────────────────────

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id),
    venueCustomerId: uuid("venue_customer_id")
      .notNull()
      .references(() => venueCustomers.id),
    teamMemberId: uuid("team_member_id").references(() => teamMembers.id),
    source: text("source").notNull(), // 'marketplace' | 'manual' | 'walk_in'
    status: appointmentStatusEnum("status").default("confirmed").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    totalCents: integer("total_cents").notNull(),
    paymentMethod: text("payment_method"), // 'in_app' | 'cash' | 'pix' | 'debit' | 'credit' | 'on_credit'
    paymentStatus: text("payment_status").default("pending"),
    mercadopagoPaymentId: text("mercadopago_payment_id"),
    customerNotes: text("customer_notes"),
    internalNotes: text("internal_notes"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => profiles.id),
  },
  (t) => [
    index("appointments_venue_id_idx").on(t.venueId),
    index("appointments_venue_customer_id_idx").on(t.venueCustomerId),
    index("appointments_scheduled_at_idx").on(t.scheduledAt),
    index("appointments_status_idx").on(t.status),
  ],
);

export const appointmentItems = pgTable(
  "appointment_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").references(() => services.id),
    productId: uuid("product_id").references(() => products.id),
    description: text("description").notNull(),
    quantity: integer("quantity").default(1),
    unitPriceCents: integer("unit_price_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    teamMemberId: uuid("team_member_id").references(() => teamMembers.id),
    commissionPercentage: numeric("commission_percentage", { precision: 5, scale: 2 }),
    commissionCents: integer("commission_cents").default(0),
  },
  (t) => [
    index("appointment_items_appointment_id_idx").on(t.appointmentId),
    check(
      "appointment_items_service_or_product",
      sql`${t.serviceId} IS NOT NULL OR ${t.productId} IS NOT NULL`,
    ),
  ],
);

// ─── Cash Register ────────────────────────────────────────────────────────────

export const cashRegisterSessions = pgTable(
  "cash_register_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    openedBy: uuid("opened_by")
      .notNull()
      .references(() => profiles.id),
    openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(),
    openingAmountCents: integer("opening_amount_cents").notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    closedBy: uuid("closed_by").references(() => profiles.id),
    closingAmountCents: integer("closing_amount_cents"),
    expectedAmountCents: integer("expected_amount_cents"),
    differenceCents: integer("difference_cents"),
    notes: text("notes"),
  },
  (t) => [index("cash_sessions_venue_id_idx").on(t.venueId)],
);

export const cashTransactions = pgTable(
  "cash_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => cashRegisterSessions.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id),
    type: text("type").notNull(), // 'sale' | 'refund' | 'sangria' | 'suprimento'
    paymentMethod: text("payment_method").notNull(), // 'cash' | 'pix' | 'debit' | 'credit'
    amountCents: integer("amount_cents").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => profiles.id),
  },
  (t) => [index("cash_transactions_session_id_idx").on(t.sessionId)],
);

// ─── Commission Periods (Pro) ─────────────────────────────────────────────────

export const commissionPeriods = pgTable(
  "commission_periods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    teamMemberId: uuid("team_member_id")
      .notNull()
      .references(() => teamMembers.id, { onDelete: "cascade" }),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    totalServicesCents: integer("total_services_cents").default(0),
    totalCommissionCents: integer("total_commission_cents").default(0),
    status: text("status").default("open"), // 'open' | 'closed' | 'paid'
    closedAt: timestamp("closed_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    notes: text("notes"),
  },
  (t) => [index("commission_periods_venue_member_idx").on(t.venueId, t.teamMemberId)],
);

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .unique()
      .references(() => appointments.id),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => profiles.id),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    venueReply: text("venue_reply"),
    venueRepliedAt: timestamp("venue_replied_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("reviews_venue_id_idx").on(t.venueId),
    check("reviews_rating_check", sql`${t.rating} between 1 and 5`),
  ],
);

// ─── Favorites ────────────────────────────────────────────────────────────────

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("favorites_customer_venue_idx").on(t.customerId, t.venueId)],
);

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  venueId: uuid("venue_id")
    .notNull()
    .unique()
    .references(() => venues.id, { onDelete: "cascade" }),
  status: subscriptionStatusEnum("status").notNull(),
  plan: text("plan").notNull().default("basic"), // 'basic' | 'pro'
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  mercadopagoPreapprovalId: text("mercadopago_preapproval_id"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptionInvoices = pgTable("subscription_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  status: text("status"), // 'paid' | 'failed' | 'pending'
  paidAt: timestamp("paid_at", { withTimezone: true }),
  mercadopagoPaymentId: text("mercadopago_payment_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    data: jsonb("data"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("notifications_user_id_idx").on(t.userId)],
);

export const pushTokens = pgTable(
  "push_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    expoPushToken: text("expo_push_token").notNull(),
    deviceId: text("device_id"),
    platform: text("platform"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("push_tokens_user_token_idx").on(t.userId, t.expoPushToken)],
);

// ─── WhatsApp (Pro) ───────────────────────────────────────────────────────────

export const whatsappMessages = pgTable(
  "whatsapp_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    venueCustomerId: uuid("venue_customer_id")
      .notNull()
      .references(() => venueCustomers.id),
    appointmentId: uuid("appointment_id").references(() => appointments.id),
    direction: text("direction").notNull(), // 'outbound' | 'inbound'
    templateName: text("template_name"),
    body: text("body"),
    status: text("status"), // 'queued' | 'sent' | 'delivered' | 'read' | 'failed'
    externalId: text("external_id"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("whatsapp_messages_venue_id_idx").on(t.venueId),
    index("whatsapp_messages_customer_id_idx").on(t.venueCustomerId),
  ],
);

export const whatsappTemplates = pgTable("whatsapp_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  venueId: uuid("venue_id")
    .notNull()
    .references(() => venues.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category"), // 'reminder' | 'confirmation' | 'marketing'
  body: text("body").notNull(),
  variables: text("variables").array().default(sql`'{}'`),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ many }) => ({
  venues: many(venues),
  venueCustomers: many(venueCustomers),
  notifications: many(notifications),
  pushTokens: many(pushTokens),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  subcategories: many(subcategories),
  venues: many(venues),
}));

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
  category: one(categories, { fields: [subcategories.categoryId], references: [categories.id] }),
  services: many(services),
}));

export const venuesRelations = relations(venues, ({ one, many }) => ({
  owner: one(profiles, { fields: [venues.ownerId], references: [profiles.id] }),
  category: one(categories, { fields: [venues.categoryId], references: [categories.id] }),
  teamMembers: many(teamMembers),
  services: many(services),
  products: many(products),
  businessHours: many(businessHours),
  scheduleBlocks: many(scheduleBlocks),
  venueCustomers: many(venueCustomers),
  appointments: many(appointments),
  reviews: many(reviews),
  favorites: many(favorites),
  subscription: one(subscriptions),
  cashRegisterSessions: many(cashRegisterSessions),
  commissionPeriods: many(commissionPeriods),
  whatsappMessages: many(whatsappMessages),
  whatsappTemplates: many(whatsappTemplates),
}));

export const teamMembersRelations = relations(teamMembers, ({ one, many }) => ({
  venue: one(venues, { fields: [teamMembers.venueId], references: [venues.id] }),
  profile: one(profiles, { fields: [teamMembers.profileId], references: [profiles.id] }),
  teamMemberServices: many(teamMemberServices),
  teamMemberHours: many(teamMemberHours),
  scheduleBlocks: many(scheduleBlocks),
  appointments: many(appointments),
  commissionPeriods: many(commissionPeriods),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  venue: one(venues, { fields: [services.venueId], references: [venues.id] }),
  subcategory: one(subcategories, {
    fields: [services.subcategoryId],
    references: [subcategories.id],
  }),
  teamMemberServices: many(teamMemberServices),
}));

export const venueCustomersRelations = relations(venueCustomers, ({ one, many }) => ({
  venue: one(venues, { fields: [venueCustomers.venueId], references: [venues.id] }),
  profile: one(profiles, { fields: [venueCustomers.profileId], references: [profiles.id] }),
  appointments: many(appointments),
  whatsappMessages: many(whatsappMessages),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  venue: one(venues, { fields: [appointments.venueId], references: [venues.id] }),
  venueCustomer: one(venueCustomers, {
    fields: [appointments.venueCustomerId],
    references: [venueCustomers.id],
  }),
  teamMember: one(teamMembers, {
    fields: [appointments.teamMemberId],
    references: [teamMembers.id],
  }),
  createdByProfile: one(profiles, {
    fields: [appointments.createdBy],
    references: [profiles.id],
  }),
  items: many(appointmentItems),
  review: one(reviews),
  cashTransactions: many(cashTransactions),
  whatsappMessages: many(whatsappMessages),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  venue: one(venues, { fields: [subscriptions.venueId], references: [venues.id] }),
  invoices: many(subscriptionInvoices),
}));

export const cashRegisterSessionsRelations = relations(cashRegisterSessions, ({ one, many }) => ({
  venue: one(venues, { fields: [cashRegisterSessions.venueId], references: [venues.id] }),
  openedByProfile: one(profiles, {
    fields: [cashRegisterSessions.openedBy],
    references: [profiles.id],
  }),
  transactions: many(cashTransactions),
}));
