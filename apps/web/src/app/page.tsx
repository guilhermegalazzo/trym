// Types used by the marketplace homepage and marketplace-client.
// The actual route handler for "/" lives in app/(public)/page.tsx.

export type PublicVenue = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  state: string | null;
  address_line: string | null;
  phone: string | null;
  category_id: string | null;
  categories: { name: string; slug: string } | null;
};

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
};
