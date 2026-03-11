/** Branded full-screen loader shown while lazy-loaded routes are fetched. */
export default function LoadingFallback() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-[var(--color-bg-base)]">
      <img
        src="/Sokoul_Logo.svg"
        alt="Sokoul"
        className="w-24 h-auto opacity-80"
      />
      <div className="w-32 h-1 rounded-full bg-[var(--color-bg-elevated)] overflow-hidden">
        <div className="h-full w-1/3 rounded-full bg-[var(--color-accent)] skeleton-shimmer" />
      </div>
    </div>
  );
}
