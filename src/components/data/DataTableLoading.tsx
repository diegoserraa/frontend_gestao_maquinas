export function DataTableLoading() {
  return (
    <div className="animate-pulse">
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-slate-100"
          >
            <div className="h-3 bg-slate-200 rounded col-span-2"></div>
            <div className="h-3 bg-slate-200 rounded"></div>
            <div className="h-3 bg-slate-200 rounded"></div>
            <div className="h-3 bg-slate-200 rounded"></div>
            <div className="h-3 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}