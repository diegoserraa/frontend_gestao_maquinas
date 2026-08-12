import {
  Eye,
  CalendarDays,
  Wrench,
  AlertTriangle,
  Flame,
  ArrowDown,
} from "lucide-react";
import type { ReactNode } from "react";

export type OrdemServicoResumo = {
  id: string | number;
  numero: string;
  status: string;
  prioridade: string;
  tipo_manutencao: string;
  data_abertura: string;
  descricao?: string;
};

type OrdemServicoCardProps = {
  ordem: OrdemServicoResumo;
  onVisualizar?: (ordem: OrdemServicoResumo) => void;
};

const STATUS_STYLES: Record<
  string,
  {
    badge: string;
    dot: string;
  }
> = {
  aberta: {
    badge: "bg-blue-50/80 text-blue-700 ring-blue-100",
    dot: "bg-blue-500",
  },
  aberto: {
    badge: "bg-blue-50/80 text-blue-700 ring-blue-100",
    dot: "bg-blue-500",
  },
  andamento: {
    badge: "bg-amber-50/80 text-amber-700 ring-amber-100",
    dot: "bg-amber-500",
  },
  em_andamento: {
    badge: "bg-amber-50/80 text-amber-700 ring-amber-100",
    dot: "bg-amber-500",
  },
  finalizada: {
    badge: "bg-emerald-50/80 text-emerald-700 ring-emerald-100",
    dot: "bg-emerald-500",
  },
  finalizado: {
    badge: "bg-emerald-50/80 text-emerald-700 ring-emerald-100",
    dot: "bg-emerald-500",
  },
  cancelada: {
    badge: "bg-slate-100 text-slate-500 ring-slate-200",
    dot: "bg-slate-400",
  },
  cancelado: {
    badge: "bg-slate-100 text-slate-500 ring-slate-200",
    dot: "bg-slate-400",
  },
};

const PRIORIDADE_STYLES: Record<
  string,
  {
    badge: string;
    icon: ReactNode;
  }
> = {
  alta: {
    badge: "bg-rose-50 text-rose-700 ring-rose-100",
    icon: <AlertTriangle size={11} strokeWidth={2} />,
  },
  urgente: {
    badge: "bg-rose-50 text-rose-700 ring-rose-100",
    icon: <Flame size={11} strokeWidth={2} />,
  },
  media: {
    badge: "bg-amber-50 text-amber-700 ring-amber-100",
    icon: <AlertTriangle size={11} strokeWidth={2} />,
  },
  média: {
    badge: "bg-amber-50 text-amber-700 ring-amber-100",
    icon: <AlertTriangle size={11} strokeWidth={2} />,
  },
  baixa: {
    badge: "bg-slate-100 text-slate-500 ring-slate-200",
    icon: <ArrowDown size={11} strokeWidth={2} />,
  },
};

export function normalizar(valor: string) {
  return valor
    ?.toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function formatarData(data: string) {
  const d = new Date(data);

  if (Number.isNaN(d.getTime())) {
    return data;
  }

  return d.toLocaleDateString("pt-BR");
}

export function OrdemServicoCard({
  ordem,
  onVisualizar,
}: OrdemServicoCardProps) {
  const statusKey = normalizar(ordem.status);
  const prioridadeKey = normalizar(ordem.prioridade);

  const status = STATUS_STYLES[statusKey] ?? {
    badge: "bg-slate-100 text-slate-500 ring-slate-200",
    dot: "bg-slate-400",
  };

  const prioridade = PRIORIDADE_STYLES[prioridadeKey] ?? {
    badge: "bg-slate-100 text-slate-500 ring-slate-200",
    icon: <AlertTriangle size={11} strokeWidth={2} />,
  };

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/70 transition-all duration-200 hover:ring-slate-300 hover:shadow-md hover:-translate-y-0.5">
      {/* Indicador de status */}
      <div
        className={`absolute left-0 top-0 h-0.5 w-full ${status.dot} opacity-70`}
      />

      <div className="flex h-full flex-col px-4 py-4">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          {/* Identificação */}
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                flex h-9 w-9 shrink-0 items-center justify-center
                rounded-lg bg-slate-50 text-slate-500
                ring-1 ring-inset ring-slate-200/70
                transition-colors group-hover:bg-slate-100
              "
            >
              <Wrench size={16} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold tracking-tight text-slate-900 tabular-nums">
                  OS #{ordem.numero}
                </span>
              </div>

              <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-[0.04em] text-slate-400">
                {ordem.tipo_manutencao}
              </p>
            </div>
          </div>

          {/* Status */}
          <div
            className={`
              inline-flex shrink-0 items-center gap-1.5
              rounded-full px-2.5 py-1
              text-[10px] font-semibold uppercase tracking-[0.03em]
              ring-1 ring-inset
              ${status.badge}
            `}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {ordem.status.replaceAll("_", " ")}
          </div>
        </div>

        {/* DESCRIÇÃO */}
        <div className="mt-4 flex-1">
          <p className="line-clamp-2 text-[12px] leading-5 text-slate-500">
            {ordem.descricao || "Nenhuma descrição informada para esta solicitação."}
          </p>
        </div>

        {/* META */}
        <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex min-w-0 items-center gap-3">
            {/* Prioridade */}
            <div
              className={`
                inline-flex shrink-0 items-center gap-1.5
                rounded-md px-2 py-1
                text-[10px] font-semibold uppercase tracking-wide
                ring-1 ring-inset
                ${prioridade.badge}
              `}
            >
              {prioridade.icon}
              {ordem.prioridade}
            </div>

            {/* Data */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <CalendarDays size={13} strokeWidth={1.8} />
              <span>{formatarData(ordem.data_abertura)}</span>
            </div>
          </div>

          {/* Visualizar */}
          <button
            type="button"
            onClick={() => onVisualizar?.(ordem)}
            className="
              inline-flex h-7 shrink-0 items-center gap-1.5
              rounded-md px-2.5
              text-[11px] font-medium text-slate-500
              transition-colors
              hover:bg-slate-50 hover:text-slate-900
              focus:outline-none focus:ring-2 focus:ring-slate-200
            "
          >
            <Eye size={13} strokeWidth={1.8} />
            Visualizar
          </button>
        </div>
      </div>
    </div>
  );
}
