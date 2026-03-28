export default function SkeletonCard() {
  return (
    <div className="card rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3 pr-8">
        <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 rounded w-3/4" />
          <div className="skeleton h-3 rounded w-1/3" />
        </div>
        <div className="skeleton h-8 w-12 rounded flex-shrink-0" />
      </div>
      <div className="skeleton h-6 rounded-full w-2/5" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton h-1.5 rounded-full" />
        ))}
      </div>
      <div className="space-y-1.5 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="skeleton h-3 rounded w-5/6" />
        <div className="skeleton h-3 rounded w-4/6" />
      </div>
      <div className="skeleton h-9 rounded-xl mt-auto" />
    </div>
  );
}
