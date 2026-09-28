import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Search,
} from "lucide-react";

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
//
// Paleta central: cada card recebe um "accent" (não mais uma classe de cor
// solta) e daqui saem, sempre coordenados, a barrinha colorida no topo, o
// selo do ícone (gradiente suave) e a cor do "Ver ordens" — evita o antigo
// jeito de cada card montar sua própria combinação de classes na mão.

const KPI_ACCENTS = {
  blue: {
    bar: "bg-blue-500",
    badge: "from-blue-50 to-blue-100 text-blue-600",
    cta: "text-blue-600 group-hover:text-blue-700",
  },
  amber: {
    bar: "bg-amber-500",
    badge: "from-amber-50 to-amber-100 text-amber-600",
    cta: "text-amber-600 group-hover:text-amber-700",
  },
  orange: {
    bar: "bg-orange-500",
    badge: "from-orange-50 to-orange-100 text-orange-600",
    cta: "text-orange-600 group-hover:text-orange-700",
  },
  cyan: {
    bar: "bg-cyan-500",
    badge: "from-cyan-50 to-sky-100 text-cyan-700",
    cta: "text-cyan-700 group-hover:text-cyan-800",
  },
  emerald: {
    bar: "bg-emerald-500",
    badge: "from-emerald-50 to-emerald-100 text-emerald-600",
    cta: "text-emerald-600 group-hover:text-emerald-700",
  },
  violet: {
    bar: "bg-violet-500",
    badge: "from-violet-50 to-violet-100 text-violet-600",
    cta: "text-violet-600 group-hover:text-violet-700",
  },
  rose: {
    bar: "bg-rose-500",
    badge: "from-rose-50 to-rose-100 text-rose-600",
    cta: "text-rose-600 group-hover:text-rose-700",
  },
  slate: {
    bar: "bg-slate-400",
    badge: "from-slate-100 to-slate-200 text-slate-500",
    cta: "text-slate-500 group-hover:text-slate-600",
  },
} as const;

export type KpiAccent = keyof typeof KPI_ACCENTS;

type KpiCardProps = {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent: KpiAccent;
  highlight?: boolean;
  /** o card vira botão: clicar mostra as ordens de serviço por trás desse número */
  onClick?: () => void;
};

export function KpiCard({
  label,
  value,
  icon,
  accent,
  highlight,
  onClick,
}: KpiCardProps) {
  const Tag = onClick ? "button" : "div";
  const cor = KPI_ACCENTS[accent];

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={onClick ? `Ver ordens de serviço: ${label}` : undefined}
      className={`
        group relative overflow-hidden text-left w-full
        bg-white rounded-2xl border shadow-sm
        transition-all duration-200
        ${
          onClick
            ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            : ""
        }
        ${highlight ? "border-red-200 ring-1 ring-red-100" : "border-slate-200"}
      `}
    >
      {/* acento colorido no topo — a mesma cor do selo do ícone e do "Ver ordens" */}
      <span className={`absolute inset-x-0 top-0 h-1 ${cor.bar}`} aria-hidden="true" />

      <div className="p-3 sm:p-4">
        <div className="flex items-center sm:items-start gap-2.5 sm:gap-3">
          <div
            className={`
              flex h-9 w-9 sm:h-11 sm:w-11 shrink-0
              items-center justify-center
              rounded-xl sm:rounded-2xl
              bg-gradient-to-br shadow-sm
              ${cor.badge}
            `}
          >
            {icon}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] sm:text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {label}
            </p>

            <p
              className={`
                text-xl sm:text-2xl font-bold leading-tight
                ${highlight ? "text-red-600" : "text-slate-800"}
              `}
            >
              {value}
            </p>
          </div>
        </div>

        {/* CTA sempre visível (não só no hover) — deixa claro, sem precisar adivinhar, que o card é clicável */}
        {onClick && (
          <div
            className={`
              mt-2.5 sm:mt-3
              flex items-center gap-1
              border-t border-slate-100 pt-2
              text-[11px] font-semibold
              transition-colors
              ${cor.cta}
            `}
          >
            Ver ordens
            <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </div>
        )}
      </div>
    </Tag>
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