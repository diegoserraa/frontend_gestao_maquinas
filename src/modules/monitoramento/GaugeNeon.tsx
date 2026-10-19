import { useId } from "react";
import { arcoSvg, useValorAnimado } from "./vitrineUtils";
import type { Nivel } from "./monitoramentoHelpers";

const ANGULO_INICIO = 135;
const ANGULO_FIM = 405; // 270° de varredura, vão de 90° embaixo

const CORES: Record<Nivel, { linha: string; texto: string; brilho: string }> = {
  ok: { linha: "#22d3ee", texto: "text-cyan-300", brilho: "rgba(34,211,238,0.55)" },
  atencao: { linha: "#fbbf24", texto: "text-amber-300", brilho: "rgba(251,191,36,0.55)" },
  critico: { linha: "#fb7185", texto: "text-rose-300", brilho: "rgba(251,113,133,0.6)" },
  "sem-dado": { linha: "#475569", texto: "text-slate-500", brilho: "rgba(71,85,105,0.3)" },
};

type Props = {
  rotulo: string;
  valor: number | null;
  unidade: string;
  min: number;
  max: number;
  atencao?: number | null;
  alarme?: number | null;
  nivel: Nivel;
  tamanho?: number;
  casasDecimais?: number;
};

export function GaugeNeon({
  rotulo,
  valor,
  unidade,
  min,
  max,
  atencao,
  alarme,
  nivel,
  tamanho = 280,
  casasDecimais = 1,
}: Props) {
  const id = useId();
  const cor = CORES[nivel];
  const exibido = useValorAnimado(valor);

  const r = tamanho / 2 - 18;
  const cx = tamanho / 2;
  const cy = tamanho / 2;

  const fracao = (v: number) => Math.min(Math.max((v - min) / (max - min), 0), 1);
  const anguloDe = (v: number) => ANGULO_INICIO + (ANGULO_FIM - ANGULO_INICIO) * fracao(v);

  const anguloValor = exibido !== null ? anguloDe(exibido) : ANGULO_INICIO;
  const trilhoD = arcoSvg(cx, cy, r, ANGULO_INICIO, ANGULO_FIM);
  const valorD = arcoSvg(cx, cy, r, ANGULO_INICIO, Math.max(anguloValor, ANGULO_INICIO + 0.01));

  return (
    <div className="relative flex flex-col items-center" style={{ width: tamanho }}>
      <svg width={tamanho} height={tamanho} className="overflow-visible">
        <defs>
          <filter id={`brilho-${id}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="6" result="desfoque" />
            <feMerge>
              <feMergeNode in="desfoque" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* trilho de fundo */}
        <path d={trilhoD} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={10} strokeLinecap="round" />

        {/* marcas de atenção/alarme no trilho */}
        {atencao != null && atencao >= min && atencao <= max && (
          <Marca cx={cx} cy={cy} r={r} angulo={anguloDe(atencao)} cor="#fbbf24" />
        )}
        {alarme != null && alarme >= min && alarme <= max && (
          <Marca cx={cx} cy={cy} r={r} angulo={anguloDe(alarme)} cor="#fb7185" />
        )}

        {/* arco de valor, com brilho neon (desenhado 2x: halo desfocado + linha nítida) */}
        <path
          d={valorD}
          fill="none"
          stroke={cor.linha}
          strokeWidth={10}
          strokeLinecap="round"
          filter={`url(#brilho-${id})`}
          style={{ transition: "stroke 0.5s ease" }}
        />
        <path
          d={valorD}
          fill="none"
          stroke={cor.linha}
          strokeWidth={3}
          strokeLinecap="round"
          style={{ transition: "stroke 0.5s ease" }}
        />

        {/* ponteiro na ponta do arco */}
        {exibido !== null && (
          <PontaDoArco cx={cx} cy={cy} r={r} angulo={anguloValor} cor={cor.linha} filtroId={`brilho-${id}`} />
        )}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-mono text-5xl font-bold tabular-nums ${cor.texto} drop-shadow-[0_0_18px_currentColor]`}
        >
          {exibido !== null ? exibido.toFixed(casasDecimais) : "--"}
        </span>
        <span className="mt-0.5 text-sm font-medium tracking-wide text-slate-400">{unidade}</span>
        <span className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{rotulo}</span>
      </div>
    </div>
  );
}

function Marca({ cx, cy, r, angulo, cor }: { cx: number; cy: number; r: number; angulo: number; cor: string }) {
  const rad = (angulo * Math.PI) / 180;
  const x1 = cx + (r - 9) * Math.cos(rad);
  const y1 = cy + (r - 9) * Math.sin(rad);
  const x2 = cx + (r + 9) * Math.cos(rad);
  const y2 = cy + (r + 9) * Math.sin(rad);
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={cor} strokeWidth={3} strokeLinecap="round" opacity={0.85} />;
}

function PontaDoArco({
  cx, cy, r, angulo, cor, filtroId,
}: { cx: number; cy: number; r: number; angulo: number; cor: string; filtroId: string }) {
  const rad = (angulo * Math.PI) / 180;
  const x = cx + r * Math.cos(rad);
  const y = cy + r * Math.sin(rad);
  return <circle cx={x} cy={y} r={7} fill={cor} filter={`url(#${filtroId})`} />;
}
