import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: venue } = await supabase
    .from("venues")
    .select("id, name, city, state")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!venue) redirect("/onboarding");

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "";

  const venueLocation = [venue.city, venue.state].filter(Boolean).join(", ");

  return (
    <DashboardShell
      userName={displayName}
      userEmail={user.email ?? ""}
      userRole="Owner"
      venueName={venue.name}
      venueLocation={venueLocation}
    >
      {children}
    </DashboardShell>
  );
}
