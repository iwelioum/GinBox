export const DetailSkeleton = () => (
  <div className="min-h-screen bg-[#07080f] animate-pulse">
    <div className="h-[85vh] bg-white/5" />
    <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-6">
      <div className="flex gap-8">
        <div className="w-40 h-60 rounded-xl bg-white/10 flex-shrink-0" />
        <div className="flex-1 space-y-4 pt-4">
          <div className="h-8 bg-white/10 rounded w-2/3" />
          <div className="h-4 bg-white/5 rounded w-1/3" />
          <div className="h-3 bg-white/5 rounded w-full" />
          <div className="h-3 bg-white/5 rounded w-5/6" />
        </div>
      </div>
    </div>
  </div>
);
