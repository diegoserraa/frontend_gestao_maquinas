import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  RotateCcw,
  Search,
} from "lucide-react";

import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";

// ── helpers de número/formatação ──────────────────────────

export function toNumber(
  v: string | number | undefined | null
): number {
  if (v === undefined || v === null) return 0;

  const n = typeof v === "number" ? v : parseFloat(v);

  return Number.isNaN(n) ? 0 : n;
}

export function formatCurrency(
  v: string | number
): string {
  return toNumber(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatCompactNumber(
  v: string | number
): string {
  return toNumber(v).toLocaleString("pt-BR");
}

// "2026-07-23T03:00:00.000Z" -> "23/07"
export function formatDiaCurto(iso: string): string {
  const d = new Date(iso);

  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

// "2026-07" -> "jul/26"
export function formatMesCurto(mes: string): string {
  const [ano, m] = mes.split("-");

  const d = new Date(
    Number(ano),
    Number(m) - 1,
    1
  );

  const label = d.toLocaleDateString("pt-BR", {
    month: "short",
  });

  return `${label.replace(".", "")}/${ano.slice(2)}`;
}

// intervalo padrão: últimos 30 dias
export function getDefaultPeriodo() {
  const fim = new Date();
  const inicio = new Date();

  inicio.setDate(inicio.getDate() - 30);

  const toInput = (d: Date) =>
    d.toISOString().slice(0, 10);

  return {
    dataInicio: toInput(inicio),
    dataFim: toInput(fim),
  };
}

// ── paleta consistente pros gráficos ──────────────────────

export const CHART_COLORS = {
  azul: "#2563eb",
  verde: "#10b981",
  ambar: "#f59e0b",
  vermelho: "#ef4444",
  violeta: "#8b5cf6",
  slate: "#94a3b8",
};

// ── card de KPI ────────────────────────────────────────────

type KpiCardProps = {
  label: string;
  value: string | number;
  icon: ReactNode;
  colorClass: string;
  highlight?: boolean;
};

export function KpiCard({
  label,
  value,
  icon,
  colorClass,
  highlight,
}: KpiCardProps) {
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

// ── wrapper padrão pras seções com gráfico ───────────────

export function SectionCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        bg-white
        rounded-2xl
        border
        border-slate-200
        shadow-sm
        p-4
        sm:p-5
        ${className}
      `}
    >
      <div className="mb-3 sm:mb-4">
        <h3 className="font-semibold text-sm sm:text-base text-slate-800">
          {title}
        </h3>

        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}

// ── skeleton do dashboard ─────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <style>
        {`
          @keyframes shimmer {
            100% {
              transform: translateX(100%);
            }
          }

          .skeleton {
            position: relative;
            overflow: hidden;
            background: #e2e8f0;
          }

          .skeleton::after {
            content: "";
            position: absolute;
            inset: 0;
            transform: translateX(-100%);
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,0.7),
              transparent
            );
            animation: shimmer 1.6s infinite;
          }
        `}
      </style>

      {/* HEADER */}

      <div className="space-y-2">
        <div className="skeleton h-7 w-40 rounded-lg" />
        <div className="skeleton h-4 w-64 rounded-lg" />
      </div>

      {/* BOTÃO QR */}

      <div className="skeleton h-12 w-full rounded-xl" />

      {/* KPIS */}

      <div
        className="
          grid
          grid-cols-2
          sm:grid-cols-5
          gap-3
        "
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="
              skeleton
              h-24
              rounded-2xl
            "
          />
        ))}
      </div>

      {/* GRÁFICOS */}

      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-2
          gap-4
        "
      >
        <div
          className="
            skeleton
            h-72
            rounded-2xl
          "
        />

        <div
          className="
            skeleton
            h-72
            rounded-2xl
          "
        />
      </div>

      {/* LISTA */}

      <div
        className="
          skeleton
          h-56
          rounded-2xl
        "
      />
    </div>
  );
}

// ── estado de erro ────────────────────────────────────────

export function DashboardErrorState({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
        <AlertTriangle size={26} />
      </div>

      <div>
        <p className="font-medium text-slate-700">
          Não deu pra carregar o dashboard agora
        </p>

        <p className="text-sm text-slate-400 mt-1">
          Verifique sua conexão e tente novamente
        </p>
      </div>

      <button
        onClick={onRetry}
        className="
          flex
          items-center
          gap-2
          mt-2
          px-4
          py-2
          rounded-lg
          bg-blue-600
          text-white
          text-sm
          font-medium
          hover:bg-blue-700
          transition
        "
      >
        <RotateCcw size={14} />
        Tentar de novo
      </button>
    </div>
  );
}

// ── estado vazio de gráfico ───────────────────────────────

export function ChartEmptyState({
  label = "Sem dados no período",
}: {
  label?: string;
}) {
  return (
    <div className="h-full min-h-[180px] flex items-center justify-center">
      <p className="text-sm text-slate-400">
        {label}
      </p>
    </div>
  );
}

// ── filtro de período ─────────────────────────────────────
//
// O DateInput agora é um componente genérico reutilizável.
// Ele permite:
// - digitar a data manualmente
// - selecionar pelo calendário
// - limpar a data
//
// Este componente mantém um rascunho local.
// O período só é aplicado quando o usuário clicar em Buscar.

export function PeriodoFilter({
  dataInicio,
  dataFim,
  onChange,
}: {
  dataInicio: string;
  dataFim: string;
  onChange: (periodo: {
    dataInicio: string;
    dataFim: string;
  }) => void;
}) {
  const [inicio, setInicio] = useState<
    string
  >(dataInicio);

  const [fim, setFim] = useState<string>(
    dataFim
  );

  // Sincroniza quando o período externo mudar
  useEffect(() => {
    setInicio(dataInicio);
  }, [dataInicio]);

  useEffect(() => {
    setFim(dataFim);
  }, [dataFim]);

  const alterado =
    inicio !== dataInicio ||
    fim !== dataFim;

  function aplicar() {
    if (!inicio || !fim) return;

    onChange({
      dataInicio: inicio,
      dataFim: fim,
    });
  }

  return (
    <div
      className="
        flex
        flex-col
        lg:flex-row
        lg:items-center
        lg:justify-end
        gap-2
        w-full
      "
    >
      {/* DATA INICIAL */}

      <div className="w-full lg:w-[220px]">
        <DateInput
          value={inicio}
          onChange={setInicio}
          placeholder="Data inicial"
        />
      </div>

      {/* DATA FINAL */}

      <div className="w-full lg:w-[220px]">
        <DateInput
          value={fim}
          onChange={setFim}
          placeholder="Data final"
        />
      </div>

      {/* BUSCAR */}

      <Button
        type="button"
        onClick={aplicar}
        disabled={!inicio || !fim}
        className="
          w-full
          lg:w-[140px]
          h-11
          gap-2
          bg-blue-600
          hover:bg-blue-700
          text-white
          font-semibold
          shadow-sm
        "
      >
        <Search size={16} />
        Buscar
      </Button>
    </div>
  );
}