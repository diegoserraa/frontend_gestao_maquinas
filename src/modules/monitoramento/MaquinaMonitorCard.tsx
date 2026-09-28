import { memo } from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Sparkline } from "./Sparkline";
import type { TelemetriaAtual } from "./monitoramentoTypes";
import type { PontoHistorico } from "./useMonitoramentoDados";
import {
  NIVEL_UI,
  NIVEL_UI_ESCURO,
  ROTULO_NIVEL,
  estaAoVivo,
  formatarNumero,
  nivelGeral,
  nivelTemperatura,
  nivelVibracao,
  tempoRelativo,
  type Nivel,
} from "./monitoramentoHelpers";

type Props = {
  leitura: TelemetriaAtual;
  historico?: PontoHistorico[];
  onAbrir: (l: TelemetriaAtual) => void;
  /** tema escuro (pra mostrar numa tela/estande) — o tamanho do card é sempre este, grande */
  escuro?: boolean;
};

export const MaquinaMonitorCard = memo(function MaquinaMonitorCard({
  leitura,
  historico = [],
  onAbrir,
  escuro = false,
}: Props) {
  const semDados = leitura.atualizado_em === null;
  const aoVivo = estaAoVivo(leitura.atualizado_em);
  const estadoNivel: Nivel = semDados || !aoVivo ? "sem-dado" : nivelGeral(leitura);
  const rotulo =
    semDados || !aoVivo ? "SEM SINAL" : ROTULO_NIVEL[estadoNivel].toUpperCase();
  const critico = estadoNivel === "critico" && aoVivo;

  const ui = escuro ? NIVEL_UI_ESCURO[estadoNivel] : NIVEL_UI[estadoNivel];

  const cardCor = escuro
    ? cn(
        "bg-slate-900/60 backdrop-blur-xl hover:bg-slate-900/80",
        critico
          ? "border-rose-500/50 shadow-[0_0_28px_-6px_rgba(251,113,133,0.45)]"
          : `${ui.borda} shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]`
      )
    : cn(
        "bg-white hover:bg-slate-50/80",
        critico
          ? "border-rose-300 shadow-[0_0_24px_-10px_rgba(225,29,72,0.35)]"
          : `${ui.borda} shadow-sm`
      );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onAbrir(leitura)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onAbrir(leitura)}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border transition-all duration-300",
        "hover:-translate-y-1",
        cardCor
      )}
    >
      {/* pulso sutil de fundo só quando crítico — chama atenção sem gritar */}
      {critico && (
        <span
          className={cn(
            "pointer-events-none absolute inset-0 animate-pulse",
            escuro ? "bg-rose-500/5" : "bg-rose-500/3"
          )}
          aria-hidden
        />
      )}

      {/* ESTADO + NOME */}
      <div className="relative flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              {critico && (
                <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", ui.ponto)} />
              )}
              <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", ui.ponto)} />
            </span>
            <span className={cn("text-[13px] font-bold tracking-[0.15em]", ui.texto)}>
              {rotulo}
            </span>
          </span>
          <h3
            className={cn(
              "mt-1 truncate text-2xl font-bold tracking-tight",
              escuro ? "text-slate-50" : "text-slate-900"
            )}
          >
            {leitura.maquina_nome ?? `Máquina #${leitura.maquina_id}`}
          </h3>
        </div>
        <ChevronRight
          size={22}
          className={cn(
            "mt-1 shrink-0 transition-transform group-hover:translate-x-1",
            escuro ? "text-slate-600 group-hover:text-slate-400" : "text-slate-300 group-hover:text-slate-500"
          )}
        />
      </div>

      {/* MÉTRICAS + MINI-GRÁFICOS */}
      <div
        className={cn(
          "relative grid grid-cols-3 border-t",
          escuro ? "border-white/5" : "border-slate-100"
        )}
      >
        <Metrica
          rotulo="Temperatura"
          valor={formatarNumero(leitura.temperatura, 1)}
          unidade="°C"
          nivel={nivelTemperatura(leitura.temperatura, leitura.limites?.temperatura)}
          serie={historico.map((p) => p.temperatura)}
          escuro={escuro}
        />
        <Metrica
          rotulo="Vibração"
          valor={formatarNumero(leitura.vibracao, 2)}
          unidade="mm/s"
          nivel={nivelVibracao(leitura.vibracao, leitura.limites?.vibracao)}
          serie={historico.map((p) => p.vibracao)}
          escuro={escuro}
        />
        <Metrica
          rotulo="Horas"
          valor={formatarNumero(leitura.horas_ligadas, 0)}
          unidade="h"
          nivel="ok"
          serie={historico.map((p) => p.horas_ligadas)}
          neutro
          escuro={escuro}
        />
      </div>

      {/* RODAPÉ */}
      <div
        className={cn(
          "relative flex items-center justify-between gap-2 border-t px-5 py-3",
          escuro ? "border-white/5" : "border-slate-100 bg-slate-50/40"
        )}
      >
        <span className={cn("text-[12px] font-medium", escuro ? "text-slate-500" : "text-slate-400")}>
          {tempoRelativo(leitura.atualizado_em)}
        </span>
        <span
          className={cn(
            "text-[12px] font-semibold opacity-0 transition-opacity group-hover:opacity-100",
            escuro ? "text-blue-400" : "text-blue-600"
          )}
        >
          Ver histórico →
        </span>
      </div>
    </div>
  );
});

function Metrica({
  rotulo,
  valor,
  unidade,
  nivel,
  serie,
  neutro = false,
  escuro = false,
}: {
  rotulo: string;
  valor: string;
  unidade: string;
  nivel: Nivel;
  serie: (number | null)[];
  neutro?: boolean;
  escuro?: boolean;
}) {
  const ui = escuro ? NIVEL_UI_ESCURO[nivel] : NIVEL_UI[nivel];
  const corNeutra = escuro ? "#38bdf8" : "#0284c7";
  const cor = neutro ? corNeutra : ui.hex;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 overflow-hidden px-4 py-4",
        escuro ? "not-first:border-l not-first:border-white/5" : "not-first:border-l not-first:border-slate-100"
      )}
    >
      <span
        className={cn(
          "truncate text-[11px] font-semibold uppercase tracking-wide",
          escuro ? "text-slate-500" : "text-slate-400"
        )}
      >
        {rotulo}
      </span>
      <div className="flex min-w-0 items-baseline gap-1">
        <span
          className={cn(
            "truncate text-3xl font-bold tabular-nums tracking-tight",
            neutro ? (escuro ? "text-slate-200" : "text-slate-700") : ui.texto
          )}
        >
          {valor}
        </span>
        <span className={cn("shrink-0 text-xs font-medium", escuro ? "text-slate-500" : "text-slate-400")}>
          {unidade}
        </span>
      </div>
      <Sparkline valores={serie} cor={cor} altura={40} espessura={2.5} className="mt-1" />
    </div>
  );
}
