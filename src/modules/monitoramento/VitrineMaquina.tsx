import { ChevronLeft, Radio, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { GaugeNeon } from "./GaugeNeon";
import { OndaNeon } from "./OndaNeon";
import { useHorasAoVivo } from "./useHorasAoVivo";
import type { PontoHistorico } from "./useMonitoramentoDados";
import type { TelemetriaAtual } from "./monitoramentoTypes";
import {
  LIMITES_PADRAO,
  estaAoVivo,
  nivelGeral,
  nivelTemperatura,
  nivelVibracao,
  type Nivel,
} from "./monitoramentoHelpers";

type Props = {
  leitura: TelemetriaAtual;
  historico: PontoHistorico[];
  onSair: () => void;
};

const COR_HEX: Record<Nivel, string> = {
  ok: "#22d3ee",
  atencao: "#fbbf24",
  critico: "#fb7185",
  "sem-dado": "#64748b",
};

export function VitrineMaquina({ leitura, historico, onSair }: Props) {
  const aoVivo = estaAoVivo(leitura.atualizado_em);
  const nivel: Nivel = !aoVivo ? "sem-dado" : nivelGeral(leitura);
  const critico = nivel === "critico" && aoVivo;

  const limiteTemp = leitura.limites?.temperatura ?? LIMITES_PADRAO.temperatura;
  const limiteVib = leitura.limites?.vibracao ?? LIMITES_PADRAO.vibracao;
  const nivelTemp = nivelTemperatura(leitura.temperatura, leitura.limites?.temperatura);
  const nivelVib = nivelVibracao(leitura.vibracao, leitura.limites?.vibracao);

  const horas = useHorasAoVivo(leitura);

  const maxTemp = Math.max((limiteTemp.alarme ?? 80) * 1.25, 40);
  const maxVib = Math.max((limiteVib.alarme ?? 7) * 1.25, 2);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      {/* fundo: grade animada + glows respirando + scanline */}
      <div className="vitrine-fundo-grade pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div
        className={cn(
          "pointer-events-none absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full blur-3xl animate-vitrine-respirar",
          critico ? "bg-rose-600/20" : "bg-cyan-500/15"
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute -bottom-40 -right-40 h-[36rem] w-[36rem] rounded-full blur-3xl animate-vitrine-respirar",
          critico ? "bg-rose-600/15" : "bg-indigo-600/15"
        )}
        style={{ animationDelay: "1.6s" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 h-24 animate-vitrine-scan bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent"
        aria-hidden
      />

      {/* borda pulsante quando crítico — a tela inteira "grita" sozinha */}
      {critico && (
        <div className="pointer-events-none absolute inset-0 ring-[6px] ring-rose-500/50 animate-vitrine-respirar" aria-hidden />
      )}

      <button
        type="button"
        onClick={onSair}
        className="group absolute left-5 top-5 z-10 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 backdrop-blur transition-colors hover:border-white/20 hover:text-slate-100"
      >
        <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
        Sair da vitrine
      </button>

      <div className="relative z-[1] mx-auto flex min-h-screen max-w-[1400px] flex-col items-center justify-center gap-10 px-6 py-16">
        {/* CABEÇALHO */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] backdrop-blur",
              aoVivo ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-slate-600/40 bg-slate-800/40 text-slate-500"
            )}
          >
            <Radio size={13} className={aoVivo ? "animate-vitrine-piscar-vivo" : ""} />
            {aoVivo ? "Ao vivo" : "Sem sinal"}
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-50 drop-shadow-[0_0_30px_rgba(34,211,238,0.25)] sm:text-6xl">
            {leitura.maquina_nome ?? `Máquina #${leitura.maquina_id}`}
          </h1>
          {leitura.setor_nome && (
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">{leitura.setor_nome}</p>
          )}

          {critico && (
            <div className="mt-2 flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-1.5 text-sm font-bold text-rose-300">
              <TriangleAlert size={16} />
              Atenção necessária
            </div>
          )}
        </div>

        {/* GAUGES */}
        <div className="flex flex-wrap items-center justify-center gap-14">
          <GaugeNeon
            rotulo="Temperatura"
            valor={leitura.temperatura}
            unidade="°C"
            min={0}
            max={maxTemp}
            atencao={limiteTemp.atencao}
            alarme={limiteTemp.alarme}
            nivel={aoVivo ? nivelTemp : "sem-dado"}
            tamanho={300}
            casasDecimais={1}
          />
          <GaugeNeon
            rotulo="Vibração"
            valor={leitura.vibracao}
            unidade="m/s²"
            min={0}
            max={maxVib}
            atencao={limiteVib.atencao}
            alarme={limiteVib.alarme}
            nivel={aoVivo ? nivelVib : "sem-dado"}
            tamanho={300}
            casasDecimais={2}
          />

          <div className="flex flex-col items-center gap-1 rounded-3xl border border-white/10 bg-white/[0.03] px-10 py-8 backdrop-blur">
            <span className="font-mono text-5xl font-bold tabular-nums text-cyan-300 drop-shadow-[0_0_18px_rgba(34,211,238,0.5)]">
              {horas !== null ? horas.toFixed(2) : "--"}
            </span>
            <span className="text-sm font-medium text-slate-400">horas</span>
            <span className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Horímetro
            </span>
          </div>
        </div>

        {/* ONDA AO VIVO (vibração) */}
        <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Vibração em tempo real
          </p>
          <OndaNeon valores={historico.map((p) => p.vibracao)} cor={COR_HEX[aoVivo ? nivelVib : "sem-dado"]} altura={140} />
        </div>
      </div>
    </div>
  );
}
