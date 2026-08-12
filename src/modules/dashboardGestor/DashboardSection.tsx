
import type { ReactNode } from "react";

type DashboardSectionProps = {
  title: string;
  subtitle?: string;
  className?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function DashboardSection({
  title,
  subtitle,
  className = "",
  action,
  children,
}: DashboardSectionProps) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        {action && (
          <div className="flex shrink-0 items-center gap-2">
            {action}
          </div>
        )}
      </header>

      {/* Content */}
      <div className="p-5">{children}</div>
    </section>
  );
}

type DashboardSectionEmptyStateProps = {
  label?: string;
};

export function DashboardSectionEmptyState({
  label = "Nenhum item encontrado",
}: DashboardSectionEmptyStateProps) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-6 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          className="h-5 w-5 text-slate-400"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 13V7a2 2 0 0 0-2-2h-5l-2-2H6a2 2 0 0 0-2 2v8m16 0v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4m16 0H4"
          />
        </svg>
      </div>

      <p className="text-sm font-medium text-slate-600">{label}</p>

      <p className="mt-1 text-xs text-slate-400">
        Não há dados para exibir neste momento.
      </p>
    </div>
  );
}

