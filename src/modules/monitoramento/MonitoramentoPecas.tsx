import type { ReactNode } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Info,
  Building2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { ModoDados } from "./useMonitoramentoDados";
import type { RealtimeStatus } from "./monitoramentoTypes";
import type { Nivel } from "./monitoramentoHelpers";
import { NIVEL_UI } from "./monitoramentoHelpers";

/* ============================ KPI ============================ */

export function KpiTile({
  rotulo,
  valor,
  unidade,
  icone,
  tom = "neutro",
}: {
  rotulo: string;
  valor: string;
  unidade?: string;
  icone: ReactNode;
  tom?: "neutro" | "ok" | "atencao" | "critico" | "info";
}) {
  const tons = {
    neutro: { chip: "bg-slate-100 text-slate-500", valor: "text-slate-900", card: "border-slate-200 bg-white" },
    ok: { chip: "bg-emerald-50 text-emerald-600", valor: "text-slate-900", card: "border-slate-200 bg-white" },
    atencao: { chip: "bg-amber-100 text-amber-600", valor: "text-amber-600", card: "border-amber-200 bg-amber-50/50" },
    critico: { chip: "bg-rose-100 text-rose-600", valor: "text-rose-600", card: "border-rose-200 bg-rose-50/50" },
    info: { chip: "bg-blue-50 text-blue-600", valor: "text-slate-900", card: "border-slate-200 bg-white" },
  }[tom];

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 shadow-sm",
        tons.card
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          tons.chip
        )}
      >
        {icone}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] leading-tight text-slate-500">{rotulo}</p>
        <p className={cn("text-lg font-semibold leading-tight tabular-nums", tons.valor)}>
          {valor}
          {unidade && (
            <span className="ml-1 text-[11px] font-normal text-slate-400">
              {unidade}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

/* ==================== STATUS DO REALTIME ==================== */

export function StatusMini({ status }: { status: RealtimeStatus }) {
  const cfg = {
    online: {
      icon: <Wifi size={13} />,
      texto: "Tempo real",
      classe: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    conectando: {
      icon: <RefreshCw size={13} className="animate-spin" />,
      texto: "Conectando",
      classe: "bg-amber-50 text-amber-700 ring-amber-200",
    },
    offline: {
      icon: <WifiOff size={13} />,
      texto: "Reconectando",
      classe: "bg-rose-50 text-rose-700 ring-rose-200",
    },
  }[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1",
        cfg.classe
      )}
    >
      {cfg.icon}
      {cfg.texto}
    </span>
  );
}

/* =================== SELETOR DE MODO ==================== */

const MODOS: { valor: ModoDados; label: string }[] = [
  { valor: "auto", label: "Auto" },
  { valor: "demo", label: "Demonstração" },
  { valor: "real", label: "Real" },
];

export function SeletorModo({
  modo,
  onChange,
}: {
  modo: ModoDados;
  onChange: (m: ModoDados) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
      {MODOS.map((m) => (
        <button
          key={m.valor}
          type="button"
          onClick={() => onChange(m.valor)}
          className={cn(
            "rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors",
            modo === m.valor
              ? "bg-blue-50 text-blue-700"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

export function AvisoDemo() {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
      <Info size={14} className="shrink-0" />
      <p>
        <span className="font-medium">Dados de demonstração</span> — ainda não há
        telemetria real chegando. Cada máquina passa a mostrar o dado real assim
        que o sensor publicar.
      </p>
    </div>
  );
}

/* ============= FILTRO DE SETOR (botões) ============= */

export type OpcaoSetor = {
  id: string;
  nome: string;
  total: number;
  temAlerta: boolean;
};

export function SetorTabs({
  opcoes,
  totalGeral,
  valor,
  onChange,
}: {
  opcoes: OpcaoSetor[];
  totalGeral: number;
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <TabSetor
        ativo={valor === "all"}
        onClick={() => onChange("all")}
        rotulo="Todos os setores"
        total={totalGeral}
      />
      {opcoes.map((s) => (
        <TabSetor
          key={s.id}
          ativo={valor === s.id}
          onClick={() => onChange(s.id)}
          rotulo={s.nome}
          total={s.total}
          alerta={s.temAlerta}
        />
      ))}
    </div>
  );
}

function TabSetor({
  ativo,
  onClick,
  rotulo,
  total,
  alerta = false,
}: {
  ativo: boolean;
  onClick: () => void;
  rotulo: string;
  total: number;
  alerta?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors",
        ativo
          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
      )}
    >
      {alerta && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            ativo ? "bg-white" : "bg-rose-500"
          )}
        />
      )}
      {rotulo}
      <span
        className={cn(
          "rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
          ativo ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
        )}
      >
        {total}
      </span>
    </button>
  );
}

/* ============= CABEÇALHO DE GRUPO DE SETOR ============= */

export function GrupoSetorHeader({
  nome,
  total,
  contagem,
}: {
  nome: string;
  total: number;
  contagem: Partial<Record<Nivel, number>>;
}) {
  const ordem: Nivel[] = ["critico", "atencao", "ok", "sem-dado"];
  const rotulos: Record<Nivel, string> = {
    critico: "crítico",
    atencao: "em atenção",
    ok: "normal",
    "sem-dado": "sem sinal",
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-slate-200 pb-1.5">
      <div className="flex items-baseline gap-2">
        <div className="flex items-center gap-1.5">
          <Building2 size={14} className="text-slate-400" />
          <h2 className="text-[13px] font-semibold text-slate-800">{nome}</h2>
        </div>
        <span className="text-[11px] text-slate-400">
          {total} {total === 1 ? "máquina" : "máquinas"}
        </span>
      </div>

      <div className="flex items-center gap-2.5 text-[11px]">
        {ordem
          .filter((n) => (contagem[n] ?? 0) > 0)
          .map((n) => (
            <span key={n} className="inline-flex items-center gap-1 text-slate-500">
              <span className={cn("h-1.5 w-1.5 rounded-full", NIVEL_UI[n].ponto)} />
              {contagem[n]} {rotulos[n]}
            </span>
          ))}
      </div>
    </div>
  );
}
