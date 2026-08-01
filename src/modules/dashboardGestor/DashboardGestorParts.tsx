import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  RotateCcw,
  Search,
  CalendarIcon,
} from "lucide-react";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";


// ── helpers de número/formatação ──────────────────────────
export function toNumber(v: string | number | undefined | null): number {
  if (v === undefined || v === null) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
}

export function formatCurrency(v: string | number): string {
  return toNumber(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatCompactNumber(v: string | number): string {
  return toNumber(v).toLocaleString("pt-BR");
}

// "2026-07-23T03:00:00.000Z" -> "23/07"
export function formatDiaCurto(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// "2026-07" -> "jul/26"
export function formatMesCurto(mes: string): string {
  const [ano, m] = mes.split("-");
  const d = new Date(Number(ano), Number(m) - 1, 1);
  const label = d.toLocaleDateString("pt-BR", { month: "short" });
  return `${label.replace(".", "")}/${ano.slice(2)}`;
}

// intervalo padrão: últimos 30 dias, formato YYYY-MM-DD (input date)
export function getDefaultPeriodo() {
  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 30);

  const toInput = (d: Date) => d.toISOString().slice(0, 10);

  return { dataInicio: toInput(inicio), dataFim: toInput(fim) };
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
  colorClass: string; // ex: "bg-blue-50 text-blue-600"
  highlight?: boolean; // ex: críticas > 0
};

export function KpiCard({ label, value, icon, colorClass, highlight }: KpiCardProps) {
  return (
    <div
      className={`
        bg-white rounded-2xl border shadow-sm p-4 sm:p-5
        flex items-center gap-3 sm:gap-4
        transition
        ${highlight ? "border-red-200 ring-1 ring-red-100" : "border-slate-200"}
      `}
    >
      <div
        className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-slate-500 truncate">{label}</p>
        <p
          className={`text-xl sm:text-2xl font-bold ${
            highlight ? "text-red-600" : "text-slate-800"
          }`}
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
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 ${className}`}
    >
      <div className="mb-3 sm:mb-4">
        <h3 className="font-semibold text-sm sm:text-base text-slate-800">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}


export function DashboardSkeleton() {
  return (
    <div className="space-y-5">

      {/* efeito de brilho */}
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
      <div className="
        grid
        grid-cols-2
        sm:grid-cols-5
        gap-3
      ">
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
      <div className="
        grid
        grid-cols-1
        lg:grid-cols-2
        gap-4
      ">

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

export function DashboardErrorState({ onRetry }: { onRetry: () => void }) {
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
        className="flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
      >
        <RotateCcw size={14} />
        Tentar de novo
      </button>
    </div>
  );
}

export function ChartEmptyState({ label = "Sem dados no período" }: { label?: string }) {
  return (
    <div className="h-full min-h-[180px] flex items-center justify-center">
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}

// ── filtro de período ──────────────────────────────────────
// Usa <input type="date"> nativo de propósito: em mobile/PWA isso
// abre o seletor de data nativo do sistema (muito melhor UX do que
// um calendar picker customizado), e evita depender de mais um
// componente shadcn (Popover+Calendar) numa área onde já tivemos
// dor de cabeça com CSS de outros componentes do projeto.
//
// Importante: os inputs trabalham sobre um estado LOCAL (rascunho),
// separado do período que de fato é aplicado (prop `dataInicio`/
// `dataFim`). Antes, cada input chamava `onChange` direto, então ao
// preencher "De" já dispararia uma busca com a data "Até" ainda
// antiga/incompleta — daí a sensação de "não deixa eu terminar de
// preencher". Agora só aplica (e busca) quando o usuário confirma
// clicando em "Buscar" ou aperta Enter em algum dos campos.
export function PeriodoFilter({
  dataInicio,
  dataFim,
  onChange,
}: {
  dataInicio: string;
  dataFim: string;
  onChange: (periodo: { dataInicio: string; dataFim: string }) => void;
}) {
  const [inicio, setInicio] = useState<Date | undefined>();
  const [fim, setFim] = useState<Date | undefined>();

  useEffect(() => {
    if (dataInicio) {
      setInicio(new Date(`${dataInicio}T00:00:00`));
    }
  }, [dataInicio]);

  useEffect(() => {
    if (dataFim) {
      setFim(new Date(`${dataFim}T00:00:00`));
    }
  }, [dataFim]);

  const alterado =
    inicio &&
    fim &&
    (
      format(inicio, "yyyy-MM-dd") !== dataInicio ||
      format(fim, "yyyy-MM-dd") !== dataFim
    );

  function aplicar() {
    if (!inicio || !fim) return;

    onChange({
      dataInicio: format(inicio, "yyyy-MM-dd"),
      dataFim: format(fim, "yyyy-MM-dd"),
    });
  }

  return (
  <div
    className="
      flex flex-col
      lg:flex-row
      lg:items-center
      lg:justify-end
      gap-2
      w-full
    "
  >
    {/* DATA INICIAL */}
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="
            w-full
            lg:w-[180px]
            h-11
            justify-between
            bg-white
            border-slate-200
            text-slate-700
            hover:bg-slate-50
          "
        >
          {inicio
            ? format(inicio, "dd/MM/yyyy")
            : "Data inicial"}

          <CalendarIcon size={16} className="text-slate-400" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="
          w-auto
          p-3
          bg-white
          !border-slate-200
          border
          rounded-2xl
          shadow-lg
          outline-none
          ring-0
        "
      >
        <Calendar
          mode="single"
          locale={ptBR}
          selected={inicio}
          onSelect={setInicio}
        />
      </PopoverContent>
    </Popover>


    {/* DATA FINAL */}
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="
            w-full
            lg:w-[180px]
            h-11
            justify-between
            bg-white
            border-slate-200
            text-slate-700
            hover:bg-slate-50
          "
        >
          {fim
            ? format(fim, "dd/MM/yyyy")
            : "Data final"}

          <CalendarIcon size={16} className="text-slate-400" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="
          w-auto
          p-3
          bg-white
          !border-slate-200
          border
          rounded-2xl
          shadow-lg
          outline-none
          ring-0
        "
      >
        <Calendar
          mode="single"
          locale={ptBR}
          selected={fim}
          onSelect={setFim}
        />
      </PopoverContent>
    </Popover>


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
