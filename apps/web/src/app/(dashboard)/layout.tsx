import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

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

  const [{ data: venue }, ] = await Promise.all([
    supabase
      .from("venues")
      .select("id, name, city, state")
      .eq("owner_id", user.id)
      .maybeSingle(),
  ]);

  if (!venue) redirect("/onboarding");

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "";

  const venueLocation = [venue.city, venue.state].filter(Boolean).join(", ");

  return (
    <div className="flex h-screen bg-surface-1">
      <Sidebar
        userName={displayName}
        userRole="Owner"
        venueName={venue.name}
        venueLocation={venueLocation}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userEmail={user.email ?? ""} userName={displayName} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
