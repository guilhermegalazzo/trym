import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// ─── Exact brand colors from the official logo ────────────────────────────────
// Sampled directly from the PNG source provided by the brand team.
// DO NOT change these values.
export const BRAND = {
  teal:  "#056965",
  pink:  "#FC6CAC",
  dark:  "#1B2431",
} as const;

// ─── Icon mark (SVG recreation for favicon / small uses) ─────────────────────
// Used only when the PNG is too heavy or when a pure vector is needed.
export function TrymIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* Rounded square background */}
      <rect width="200" height="200" rx="42" fill={BRAND.teal} />
      {/* T crossbar */}
      <rect x="36" y="44" width="128" height="32" rx="16" fill="white" />
      {/* T stem */}
      <rect x="84" y="44" width="32" height="108" rx="16" fill="white" />
      {/* Pink accent dot */}
      <circle cx="140" cy="148" r="19" fill={BRAND.pink} />
    </svg>
  );
}

// ─── Full logo: uses the official PNG with correct proportions ────────────────
interface TrymLogoProps {
  className?: string;
  /** Visual height in px — width scales automatically from the 2.97:1 PNG ratio */
  iconSize?: number;
  showWordmark?: boolean;
}

export function TrymLogo({
  className,
  iconSize = 36,
  showWordmark = true,
}: TrymLogoProps) {
  if (!showWordmark) {
    return (
      <TrymIcon
        className={cn("flex-shrink-0", className)}
        style={{ width: iconSize, height: iconSize }}
      />
    );
  }

  // Full logo PNG (1231×414 px, transparent background)
  // Aspect ratio 2.97:1 → at iconSize height, width = iconSize * 2.97
  const naturalW = 1231;
  const naturalH = 414;
  const displayH = iconSize;
  const displayW = Math.round((displayH * naturalW) / naturalH);

  return (
    <div className={cn("flex-shrink-0 select-none", className)}>
      <Image
        src="/logo-full.png"
        alt="Trym"
        width={displayW}
        height={displayH}
        priority
        draggable={false}
        style={{ width: displayW, height: displayH, objectFit: "contain" }}
      />
    </div>
  );
}
