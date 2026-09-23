import { memo } from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Sparkline } from "./Sparkline";
import type { TelemetriaAtual } from "./monitoramentoTypes";
import type { PontoHistorico } from "./useMonitoramentoDados";
import {
  NIVEL_UI,
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
};

export const MaquinaMonitorCard = memo(function MaquinaMonitorCard({
  leitura,
  historico = [],
  onAbrir,
}: Props) {
  const semDados = leitura.atualizado_em === null;
  const aoVivo = estaAoVivo(leitura.atualizado_em);
  const estadoNivel: Nivel = semDados || !aoVivo ? "sem-dado" : nivelGeral(leitura);
  const rotulo =
    semDados || !aoVivo ? "SEM SINAL" : ROTULO_NIVEL[estadoNivel].toUpperCase();

  const tint =
    estadoNivel === "critico"
      ? "border-rose-300 bg-rose-50"
      : estadoNivel === "atencao"
      ? "border-amber-300 bg-amber-50"
      : estadoNivel === "sem-dado"
      ? "border-slate-200 bg-slate-50"
      : "border-slate-200 bg-white";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onAbrir(leitura)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onAbrir(leitura)}
      className={cn(
        "group flex cursor-pointer flex-col overflow-hidden rounded-2xl border shadow-sm transition-all",
        "hover:-translate-y-0.5 hover:shadow-md",
        tint
      )}
    >
      {/* ESTADO + NOME */}
      <div className="flex items-start justify-between gap-2 px-3.5 pt-3 pb-2">
        <div className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                NIVEL_UI[estadoNivel].ponto
              )}
            />
            <span
              className={cn(
                "text-[11px] font-bold tracking-wide",
                estadoNivel === "ok" ? "text-slate-400" : NIVEL_UI[estadoNivel].texto
              )}
            >
              {rotulo}
            </span>
          </span>
          <h3 className="mt-0.5 truncate text-sm font-semibold text-slate-900">
            {leitura.maquina_nome ?? `Máquina #${leitura.maquina_id}`}
          </h3>
        </div>
        <ChevronRight
          size={15}
          className="mt-0.5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5"
        />
      </div>

      {/* MÉTRICAS + MINI-GRÁFICOS */}
      <div className="grid grid-cols-3 border-t border-slate-100/70">
        <Metrica
          rotulo="Temp."
          valor={formatarNumero(leitura.temperatura, 1)}
          unidade="°C"
          nivel={nivelTemperatura(leitura.temperatura, leitura.limites?.temperatura)}
          serie={historico.map((p) => p.temperatura)}
        />
        <Metrica
          rotulo="Vibração"
          valor={formatarNumero(leitura.vibracao, 2)}
          unidade="mm/s"
          nivel={nivelVibracao(leitura.vibracao, leitura.limites?.vibracao)}
          serie={historico.map((p) => p.vibracao)}
        />
        <Metrica
          rotulo="Horas"
          valor={formatarNumero(leitura.horas_ligadas, 0)}
          unidade="h"
          nivel="ok"
          serie={historico.map((p) => p.horas_ligadas)}
          neutro
        />
      </div>

      {/* RODAPÉ */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-100/70 bg-white/40 px-3.5 py-2">
        <span className="text-[10px] text-slate-400">
          {tempoRelativo(leitura.atualizado_em)}
        </span>
        <span className="text-[10px] font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
          Ver histórico
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
}: {
  rotulo: string;
  valor: string;
  unidade: string;
  nivel: Nivel;
  serie: (number | null)[];
  neutro?: boolean;
}) {
  const cor = neutro ? "#0284c7" : NIVEL_UI[nivel].hex;
  return (
    <div className="flex flex-col gap-0.5 px-2.5 py-2 not-first:border-l not-first:border-slate-100/70">
      <span className="truncate text-[10px] font-medium text-slate-400">
        {rotulo}
      </span>
      <div className="flex items-baseline gap-0.5">
        <span
          className={cn(
            "text-[15px] font-semibold tabular-nums",
            neutro ? "text-slate-700" : NIVEL_UI[nivel].texto
          )}
        >
          {valor}
        </span>
        <span className="text-[9px] text-slate-400">{unidade}</span>
      </div>
      <Sparkline valores={serie} cor={cor} altura={20} className="mt-0.5" />
    </div>
  );
}
