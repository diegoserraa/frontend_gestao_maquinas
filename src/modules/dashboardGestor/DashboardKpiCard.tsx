import type { ReactNode } from "react";

type DashboardKpiCardProps = {
  label: string;
  value: string | number;
  icon: ReactNode;
  colorClass: string; // ex: "bg-blue-50 text-blue-600"
  highlight?: boolean; // ex: críticas > 0
};

export function DashboardKpiCard({
  label,
  value,
  icon,
  colorClass,
  highlight,
}: DashboardKpiCardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl border shadow-sm
        p-2.5 sm:p-4
        flex flex-col sm:flex-row
        items-center sm:items-center
        justify-center sm:justify-start
        gap-1.5 sm:gap-3
        min-h-[90px] sm:min-h-0
        transition
        ${
          highlight
            ? "border-red-200 ring-1 ring-red-100"
            : "border-slate-200"
        }
      `}
    >
      <div
        className={`
          h-8 w-8 sm:h-11 sm:w-11
          rounded-lg sm:rounded-xl
          flex items-center justify-center
          shrink-0
          ${colorClass}
        `}
      >
        {icon}
      </div>

      <div className="text-center sm:text-left min-w-0">
        <p className="text-[10px] sm:text-xs text-slate-500 truncate leading-tight">
          {label}
        </p>

        <p
          className={`
            text-lg sm:text-2xl
            font-bold leading-tight
            ${
              highlight
                ? "text-red-600"
                : "text-slate-800"
            }
          `}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
