import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";

export type Venue = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  address_line: string | null;
};

export function useVenue() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["venue", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venues")
        .select("id, name, city, state, phone, address_line")
        .eq("owner_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Venue | null;
    },
  });
}
