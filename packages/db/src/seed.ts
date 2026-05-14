import * as dotenv from "dotenv";
import { resolve } from "path";
import { createClient } from "./index.js";
import {
  categories,
  subcategories,
  venues,
  teamMembers,
  teamMemberServices,
  teamMemberHours,
  services,
  businessHours,
  profiles,
  subscriptions,
  venueCustomers,
  products,
} from "./schema.js";

dotenv.config({ path: resolve(process.cwd(), "../../.env") });

const DATABASE_URL = process.env["DATABASE_URL"];
if (!DATABASE_URL) throw new Error("DATABASE_URL is required");

const db = createClient(DATABASE_URL);

async function main() {
  console.log("🌱 Starting TRYM seed...");

  // ─── Categories ─────────────────────────────────────────────────────────────
  const [beauty, pet, fitness] = await db
    .insert(categories)
    .values([
      { slug: "beauty", name: "Beleza", icon: "✂️", displayOrder: 0 },
      { slug: "pet", name: "Pet", icon: "🐾", displayOrder: 1 },
      { slug: "fitness", name: "Fitness", icon: "💪", displayOrder: 2 },
    ])
    .returning();

  console.log("✅ Categories created");

  // ─── Subcategories ───────────────────────────────────────────────────────────
  const subcatValues = [
    // Beauty
    { categoryId: beauty!.id, slug: "hair", name: "Cabelo", displayOrder: 0 },
    { categoryId: beauty!.id, slug: "nails", name: "Unhas", displayOrder: 1 },
    { categoryId: beauty!.id, slug: "skincare", name: "Estética", displayOrder: 2 },
    { categoryId: beauty!.id, slug: "eyebrows", name: "Sobrancelhas", displayOrder: 3 },
    // Pet
    { categoryId: pet!.id, slug: "grooming", name: "Banho e Tosa", displayOrder: 0 },
    { categoryId: pet!.id, slug: "vet", name: "Veterinário", displayOrder: 1 },
    { categoryId: pet!.id, slug: "pet-hotel", name: "Hotel Pet", displayOrder: 2 },
    // Fitness
    { categoryId: fitness!.id, slug: "personal", name: "Personal Trainer", displayOrder: 0 },
    { categoryId: fitness!.id, slug: "yoga", name: "Yoga", displayOrder: 1 },
    { categoryId: fitness!.id, slug: "pilates", name: "Pilates", displayOrder: 2 },
  ];

  const insertedSubcats = await db.insert(subcategories).values(subcatValues).returning();

  const subcat = (slug: string) => insertedSubcats.find((s) => s.slug === slug)!;

  console.log("✅ Subcategories created");

  // ─── Test Profiles ───────────────────────────────────────────────────────────
  // NOTE: In real flow these are created via Supabase Auth.
  // For seed, insert directly — requires auth.users entries to exist first.
  const [customerProfile, proProfile] = await db
    .insert(profiles)
    .values([
      {
        id: "00000000-0000-0000-0000-000000000001",
        fullName: "Ana Cliente",
        email: "cliente@trym.com.br",
        phone: "+5511999990001",
        role: "customer" as const,
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        fullName: "Carlos Pro",
        email: "pro@trym.com.br",
        phone: "+5511999990002",
        role: "professional" as const,
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log("✅ Test profiles created");

  // ─── Venues ──────────────────────────────────────────────────────────────────
  const venueRows = await db
    .insert(venues)
    .values([
      {
        ownerId: proProfile!.id,
        categoryId: beauty!.id,
        name: "Studio Camila Hair",
        slug: "studio-camila-hair",
        description:
          "Salão premium especializado em coloração e cortes femininos. 10 anos de experiência na Vila Madalena.",
        addressLine: "Rua Harmonia, 482",
        city: "São Paulo",
        state: "SP",
        postalCode: "05435-000",
        latitude: "-23.5505",
        longitude: "-46.6880",
        phone: "+5511940001001",
        whatsapp: "+5511940001001",
        acceptsInAppPayment: true,
        status: "active" as const,
        ratingAverage: "4.8",
        ratingCount: 127,
      },
      {
        ownerId: proProfile!.id,
        categoryId: beauty!.id,
        name: "Espaço Unhas & Cia",
        slug: "espaco-unhas-cia",
        description:
          "Nail design, gel e fibra de vidro. Ambiente aconchegante em Pinheiros.",
        addressLine: "Rua dos Pinheiros, 1021",
        city: "São Paulo",
        state: "SP",
        postalCode: "05422-001",
        latitude: "-23.5645",
        longitude: "-46.6820",
        phone: "+5511940002002",
        whatsapp: "+5511940002002",
        acceptsInAppPayment: false,
        status: "active" as const,
        ratingAverage: "4.6",
        ratingCount: 89,
      },
      {
        ownerId: proProfile!.id,
        categoryId: pet!.id,
        name: "PetSpa Jardins",
        slug: "petspa-jardins",
        description:
          "Banho e tosa premium para cães e gatos. Produtos naturais, atendimento personalizado.",
        addressLine: "Alameda Lorena, 800",
        city: "São Paulo",
        state: "SP",
        postalCode: "01424-001",
        latitude: "-23.5730",
        longitude: "-46.6580",
        phone: "+5511940003003",
        whatsapp: "+5511940003003",
        acceptsInAppPayment: true,
        status: "active" as const,
        ratingAverage: "4.9",
        ratingCount: 203,
      },
      {
        ownerId: proProfile!.id,
        categoryId: fitness!.id,
        name: "Move Personal Training",
        slug: "move-personal-training",
        description:
          "Personal training individualizado. Foco em hipertrofia, emagrecimento e qualidade de vida.",
        addressLine: "Rua Oscar Freire, 645",
        city: "São Paulo",
        state: "SP",
        postalCode: "01426-001",
        latitude: "-23.5620",
        longitude: "-46.6710",
        phone: "+5511940004004",
        whatsapp: "+5511940004004",
        acceptsInAppPayment: true,
        status: "active" as const,
        ratingAverage: "5.0",
        ratingCount: 44,
      },
      {
        ownerId: proProfile!.id,
        categoryId: fitness!.id,
        name: "Studio Equilíbrio Pilates",
        slug: "studio-equilibrio-pilates",
        description:
          "Pilates clínico e de reabilitação. Turmas reduzidas, atenção máxima. Bela Vista.",
        addressLine: "Rua 13 de Maio, 377",
        city: "São Paulo",
        state: "SP",
        postalCode: "01327-000",
        latitude: "-23.5590",
        longitude: "-46.6480",
        phone: "+5511940005005",
        whatsapp: "+5511940005005",
        acceptsInAppPayment: false,
        status: "active" as const,
        ratingAverage: "4.7",
        ratingCount: 62,
      },
    ])
    .returning();

  const [hairVenue, nailsVenue, petVenue, personalVenue, pilatesVenue] = venueRows;

  console.log("✅ Venues created");

  // ─── Services ─────────────────────────────────────────────────────────────────
  const serviceRows = await db
    .insert(services)
    .values([
      // Hair
      {
        venueId: hairVenue!.id,
        subcategoryId: subcat("hair").id,
        name: "Corte Feminino",
        description: "Corte + escova",
        durationMinutes: 60,
        priceCents: 8000,
        displayOrder: 0,
      },
      {
        venueId: hairVenue!.id,
        subcategoryId: subcat("hair").id,
        name: "Coloração",
        description: "Coloração completa",
        durationMinutes: 120,
        priceCents: 18000,
        displayOrder: 1,
      },
      {
        venueId: hairVenue!.id,
        subcategoryId: subcat("hair").id,
        name: "Escova Progressiva",
        description: "Alisamento formaldeído zero",
        durationMinutes: 180,
        priceCents: 25000,
        displayOrder: 2,
      },
      // Nails
      {
        venueId: nailsVenue!.id,
        subcategoryId: subcat("nails").id,
        name: "Manicure",
        description: "Esmaltação simples ou francesa",
        durationMinutes: 45,
        priceCents: 4500,
        displayOrder: 0,
      },
      {
        venueId: nailsVenue!.id,
        subcategoryId: subcat("nails").id,
        name: "Pedicure",
        description: "Completa com cutícula e esmaltação",
        durationMinutes: 60,
        priceCents: 5500,
        displayOrder: 1,
      },
      {
        venueId: nailsVenue!.id,
        subcategoryId: subcat("nails").id,
        name: "Gel Alongamento",
        description: "Alongamento em gel transparente ou colorido",
        durationMinutes: 90,
        priceCents: 12000,
        displayOrder: 2,
      },
      // Pet
      {
        venueId: petVenue!.id,
        subcategoryId: subcat("grooming").id,
        name: "Banho Pequeno Porte",
        description: "Banho, secagem e perfume",
        durationMinutes: 60,
        priceCents: 5000,
        displayOrder: 0,
      },
      {
        venueId: petVenue!.id,
        subcategoryId: subcat("grooming").id,
        name: "Banho + Tosa Pequeno Porte",
        description: "Banho completo + tosa padrão",
        durationMinutes: 90,
        priceCents: 8000,
        displayOrder: 1,
      },
      {
        venueId: petVenue!.id,
        subcategoryId: subcat("grooming").id,
        name: "Banho Médio Porte",
        description: "Banho, secagem e perfume",
        durationMinutes: 90,
        priceCents: 7000,
        displayOrder: 2,
      },
      // Personal
      {
        venueId: personalVenue!.id,
        subcategoryId: subcat("personal").id,
        name: "Treino Individual 1h",
        description: "Treino personalizado 60 min",
        durationMinutes: 60,
        priceCents: 15000,
        displayOrder: 0,
      },
      {
        venueId: personalVenue!.id,
        subcategoryId: subcat("personal").id,
        name: "Avaliação Física",
        description: "Avaliação completa + plano de treino",
        durationMinutes: 90,
        priceCents: 20000,
        displayOrder: 1,
      },
      // Pilates
      {
        venueId: pilatesVenue!.id,
        subcategoryId: subcat("pilates").id,
        name: "Aula Individual Pilates",
        description: "Aula individual 50 min",
        durationMinutes: 50,
        priceCents: 12000,
        displayOrder: 0,
      },
      {
        venueId: pilatesVenue!.id,
        subcategoryId: subcat("pilates").id,
        name: "Aula Duo Pilates",
        description: "Aula em dupla 50 min",
        durationMinutes: 50,
        priceCents: 8000,
        displayOrder: 1,
      },
    ])
    .returning();

  console.log("✅ Services created");

  // ─── Products (PDV sample) ─────────────────────────────────────────────────
  await db.insert(products).values([
    {
      venueId: hairVenue!.id,
      name: "Shampoo Hidratante 250ml",
      sku: "SH-001",
      priceCents: 4500,
      costCents: 2000,
      stockQuantity: 10,
    },
    {
      venueId: hairVenue!.id,
      name: "Máscara Capilar 300g",
      sku: "MC-001",
      priceCents: 6500,
      costCents: 3000,
      stockQuantity: 5,
    },
    {
      venueId: petVenue!.id,
      name: "Colônia Pet Premium 50ml",
      sku: "CP-001",
      priceCents: 2500,
      costCents: 1000,
      stockQuantity: 20,
    },
  ]);

  console.log("✅ Products created");

  // ─── Team Members ─────────────────────────────────────────────────────────────
  const memberRows = await db
    .insert(teamMembers)
    .values(
      venueRows.map((venue) => ({
        venueId: venue.id,
        profileId: proProfile!.id,
        displayName: "Carlos Pro",
        bio: "Especialista com mais de 5 anos de experiência.",
        commissionPercentage: "30.00",
        isActive: true,
        displayOrder: 0,
      })),
    )
    .returning();

  console.log("✅ Team members created");

  // ─── Team Member Services ──────────────────────────────────────────────────
  for (let i = 0; i < venueRows.length; i++) {
    const venueServices = serviceRows.filter((s) => s.venueId === venueRows[i]!.id);
    if (venueServices.length && memberRows[i]) {
      await db.insert(teamMemberServices).values(
        venueServices.map((s) => ({
          teamMemberId: memberRows[i]!.id,
          serviceId: s.id,
        })),
      );
    }
  }

  console.log("✅ Team member services linked");

  // ─── Business Hours (Mon–Sat 9h–19h, Sun closed) ──────────────────────────────
  for (const venue of venueRows) {
    await db.insert(businessHours).values(
      Array.from({ length: 7 }, (_, day) => ({
        venueId: venue.id,
        dayOfWeek: day,
        openTime: day === 0 ? null : "09:00:00",
        closeTime: day === 0 ? null : "19:00:00",
        isClosed: day === 0,
      })),
    );
  }

  // Team member hours mirror the venue
  for (const member of memberRows) {
    await db.insert(teamMemberHours).values(
      Array.from({ length: 7 }, (_, day) => ({
        teamMemberId: member.id,
        dayOfWeek: day,
        startTime: day === 0 ? null : "09:00:00",
        endTime: day === 0 ? null : "19:00:00",
        isOff: day === 0,
      })),
    );
  }

  console.log("✅ Business hours created");

  // ─── Venue Customers ─────────────────────────────────────────────────────────
  await db.insert(venueCustomers).values({
    venueId: hairVenue!.id,
    profileId: customerProfile!.id,
    fullName: "Ana Cliente",
    phone: "+5511999990001",
    email: "cliente@trym.com.br",
    tags: ["vip", "coloração"],
  });

  console.log("✅ Venue customers created");

  // ─── Subscriptions (trial — Pro plan during trial) ─────────────────────────
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);

  await db.insert(subscriptions).values(
    venueRows.map((venue) => ({
      venueId: venue.id,
      status: "trialing" as const,
      plan: "pro",
      trialEndsAt,
    })),
  );

  console.log("✅ Subscriptions (Pro trial) created");

  console.log("\n🎉 Seed complete!");
  console.log(`   Customer : cliente@trym.com.br`);
  console.log(`   Pro      : pro@trym.com.br`);
  console.log(`   Venues   : ${venueRows.length} in São Paulo`);
  console.log(`   Services : ${serviceRows.length} total`);

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
