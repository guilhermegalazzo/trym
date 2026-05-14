export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-12"
      style={{ background: "var(--color-surface-1)" }}
    >
      {/* Ambient glow — verde-água */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(ellipse, rgba(127,209,193,0.18) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(ellipse, rgba(127,209,193,0.08) 0%, transparent 70%)" }}
      />
      <div className="relative z-10 w-full max-w-lg">
        {children}
      </div>
    </div>
  );
}
