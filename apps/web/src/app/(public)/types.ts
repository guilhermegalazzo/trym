export type PublicVenue = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  state: string | null;
  address_line: string | null;
  phone: string | null;
  category_id: string | null;
  cover_image_url: string | null;
  categories: { name: string; slug: string } | null;
};

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
};
