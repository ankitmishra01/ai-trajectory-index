export default function SkeletonCard() {
  return (
    <div className="bg-[#0f1628] border border-[#1c2847] rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-start gap-3 pr-8">
        <div className="w-8 h-8 rounded-full bg-[#1c2847]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#1c2847] rounded w-3/4" />
          <div className="h-3 bg-[#1c2847] rounded w-1/3" />
        </div>
        <div className="h-8 w-12 bg-[#1c2847] rounded" />
      </div>
      <div className="h-5 bg-[#1c2847] rounded w-1/2" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-1.5 bg-[#1c2847] rounded-full" />
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="h-3 bg-[#1c2847] rounded w-5/6" />
        <div className="h-3 bg-[#1c2847] rounded w-4/6" />
      </div>
      <div className="h-9 bg-[#1c2847] rounded-xl mt-auto" />
    </div>
  );
}
