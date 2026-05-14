"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface DashboardShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  userRole: string;
  venueName: string;
  venueLocation: string;
  plan?: "basic" | "pro";
}

export function DashboardShell({
  children,
  userName,
  userEmail,
  userRole,
  venueName,
  venueLocation,
  plan = "basic",
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex h-screen bg-surface-1">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — always visible on lg, drawer on mobile */}
      <div className={`
        fixed inset-y-0 left-0 z-40 lg:relative lg:z-auto lg:flex
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <Sidebar
          userName={userName}
          userRole={userRole}
          venueName={venueName}
          venueLocation={venueLocation}
          plan={plan}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          userEmail={userEmail}
          userName={userName}
          onMenuToggle={() => setSidebarOpen(v => !v)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
