import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

type PaginationProps = {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function Pagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const canPrev = page > 1;
  const canNext = page < totalPages;

  function goTo(p: number) {
    if (p < 1 || p > totalPages) return;
    onPageChange(p);
  }

  const pages = useMemo(() => {
    const res: (number | "...")[] = [];

    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    res.push(1);

    if (page > 3) res.push("...");

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      res.push(i);
    }

    if (page < totalPages - 2) res.push("...");

    res.push(totalPages);

    return res;
  }, [page, totalPages]);

  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-3 py-3 border-t border-slate-100 bg-white">
      
      {/* LEFT INFO */}
      <div className="text-xs text-slate-500">
        Mostrando{" "}
        <span className="font-medium text-slate-800">
          {startItem}
        </span>{" "}
        -{" "}
        <span className="font-medium text-slate-800">
          {endItem}
        </span>{" "}
        de{" "}
        <span className="font-medium text-slate-800">
          {totalItems}
        </span>
      </div>

      {/* RIGHT CONTROLS */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* PAGE SIZE SELECT (AGORA COM 5) */}
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-600 hover:border-slate-300 transition"
        >
          <option value={5}>5 / pág</option>
          <option value={10}>10 / pág</option>
          <option value={25}>25 / pág</option>
          <option value={50}>50 / pág</option>
          <option value={100}>100 / pág</option>
        </select>

        {/* PREV */}
        <button
          onClick={() => goTo(page - 1)}
          disabled={!canPrev}
          className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={16} />
        </button>

        {/* PAGES */}
        <div className="flex items-center gap-1">
          {pages.map((p, i) =>
            p === "..." ? (
              <span key={i} className="px-2 text-slate-400 text-xs">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => goTo(p)}
                className={`w-8 h-8 text-xs rounded-md transition font-medium ${
                  p === page
                    ? "bg-slate-900 text-white shadow-sm"
                    : "hover:bg-slate-100 text-slate-600"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* NEXT */}
        <button
          onClick={() => goTo(page + 1)}
          disabled={!canNext}
          className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}