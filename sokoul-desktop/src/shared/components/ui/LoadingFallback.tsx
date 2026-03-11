/** Minimal full-screen spinner shown while lazy-loaded routes are fetched. */
export default function LoadingFallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-bg-base)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
    </div>
  );
}
