import { memo } from "react";
import { ChevronRight, Thermometer, Activity, Clock } from "lucide-react";

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
  const atencao = estadoNivel === "atencao" && aoVivo;

  const ui = escuro ? NIVEL_UI_ESCURO[estadoNivel] : NIVEL_UI[estadoNivel];

  // borda neutra e discreta por padrão — só quem precisa de atenção "pesa"
  // visualmente (crítico ganha até um brilho); uma tela cheia de cards
  // gritando cor teria o efeito contrário do que se quer numa vitrine
  const cardCor = escuro
    ? cn(
        "bg-slate-900/50 backdrop-blur-xl hover:bg-slate-900/70",
        critico
          ? "border-rose-500/40 shadow-[0_0_32px_-8px_rgba(251,113,133,0.35)] hover:border-rose-500/60"
          : atencao
          ? "border-amber-400/25 hover:border-amber-400/40"
          : "border-white/[0.08] hover:border-white/20"
      )
    : cn(
        "bg-white hover:bg-slate-50/60",
        critico
          ? "border-rose-300 shadow-[0_0_24px_-10px_rgba(225,29,72,0.3)] hover:border-rose-400"
          : atencao
          ? "border-amber-200 hover:border-amber-300"
          : "border-slate-200 hover:border-slate-300"
      );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onAbrir(leitura)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onAbrir(leitura)}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border transition-all duration-300",
        "hover:-translate-y-0.5",
        cardCor
      )}
    >
      {/* sheen bem sutil no topo — só textura, não deve chamar atenção sozinho */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-24",
          escuro
            ? "bg-gradient-to-b from-white/[0.03] to-transparent"
            : "bg-gradient-to-b from-slate-900/[0.02] to-transparent"
        )}
        aria-hidden
      />

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
      <div className="relative flex items-start gap-3 px-5 pt-5 pb-4">
        {leitura.imagem_url && (
          <img
            src={leitura.imagem_url}
            alt=""
            loading="lazy"
            className={cn(
              "h-12 w-12 shrink-0 rounded-xl object-cover ring-1",
              escuro ? "ring-white/10" : "ring-slate-200"
            )}
            // se a foto falhar (link quebrado, offline etc.), some sem deixar buraco
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.1em]",
              ui.suave
            )}
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              {critico && (
                <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", ui.ponto)} />
              )}
              <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", ui.ponto)} />
            </span>
            {rotulo}
          </span>
          <h3
            className={cn(
              "mt-2.5 truncate text-xl font-semibold tracking-tight",
              escuro ? "text-slate-50" : "text-slate-900"
            )}
          >
            {leitura.maquina_nome ?? `Máquina #${leitura.maquina_id}`}
          </h3>
        </div>
        <ChevronRight
          size={18}
          className={cn(
            "mt-1.5 shrink-0 transition-transform group-hover:translate-x-0.5",
            escuro ? "text-slate-600 group-hover:text-slate-400" : "text-slate-300 group-hover:text-slate-500"
          )}
        />
      </div>

      {/* MÉTRICAS + MINI-GRÁFICOS */}
      <div
        className={cn(
          "relative grid grid-cols-3 border-t",
          escuro ? "border-white/[0.06]" : "border-slate-100"
        )}
      >
        <Metrica
          icone={Thermometer}
          rotulo="Temperatura"
          valor={formatarNumero(leitura.temperatura, 1)}
          unidade="°C"
          nivel={nivelTemperatura(leitura.temperatura, leitura.limites?.temperatura)}
          serie={historico.map((p) => p.temperatura)}
          escuro={escuro}
        />
        <Metrica
          icone={Activity}
          rotulo="Vibração"
          valor={formatarNumero(leitura.vibracao, 2)}
          unidade="mm/s"
          nivel={nivelVibracao(leitura.vibracao, leitura.limites?.vibracao)}
          serie={historico.map((p) => p.vibracao)}
          escuro={escuro}
        />
        <Metrica
          icone={Clock}
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
          escuro ? "border-white/[0.06]" : "border-slate-100 bg-slate-50/30"
        )}
      >
        <span className={cn("flex items-center gap-1.5 text-[11px] font-medium", escuro ? "text-slate-500" : "text-slate-400")}>
          <span className={cn("h-1 w-1 rounded-full", aoVivo ? ui.ponto : escuro ? "bg-slate-600" : "bg-slate-300")} />
          {tempoRelativo(leitura.atualizado_em)}
        </span>
        <span
          className={cn(
            "text-[11px] font-semibold opacity-0 transition-opacity group-hover:opacity-100",
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
  icone: Icone,
  rotulo,
  valor,
  unidade,
  nivel,
  serie,
  neutro = false,
  escuro = false,
}: {
  icone: typeof Thermometer;
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
        "flex min-w-0 flex-col gap-1.5 overflow-hidden px-4 py-4",
        escuro ? "not-first:border-l not-first:border-white/[0.06]" : "not-first:border-l not-first:border-slate-100"
      )}
    >
      <span
        className={cn(
          "flex items-center gap-1 truncate text-[10px] font-medium uppercase tracking-wide",
          escuro ? "text-slate-500" : "text-slate-400"
        )}
      >
        <Icone size={11} className="shrink-0" />
        <span className="truncate">{rotulo}</span>
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
      <Sparkline valores={serie} cor={cor} altura={36} espessura={2} className="mt-0.5 opacity-90" />
    </div>
  );
}
