import { useId } from "react";

type Limites = { atencao?: number | null; alarme?: number | null };

type Props = {
  valores: (number | null)[];
  cor: string;
  altura?: number;
  /** Linhas tracejadas de referência — mesmos limites configurados em Parâmetros da máquina. */
  limites?: Limites;
  unidade?: string;
};

/** Onda tipo osciloscópio — versão grande/brilhante do Sparkline, pro modo vitrine. */
export function OndaNeon({ valores, cor, altura = 160, limites, unidade = "" }: Props) {
  const id = useId();
  const largura = 1000;

  const pontos = valores.filter((v): v is number => v !== null && Number.isFinite(v));

  if (pontos.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-xs tracking-wide text-slate-600"
        style={{ height: altura }}
      >
        aguardando sinal...
      </div>
    );
  }

  const candidatos = [...pontos];
  if (limites?.atencao != null) candidatos.push(limites.atencao);
  if (limites?.alarme != null) candidatos.push(limites.alarme);

  const min = Math.min(...candidatos);
  const max = Math.max(...candidatos);
  const span = max - min || 1;
  const passoX = largura / (pontos.length - 1);
  const margem = altura * 0.12;
  const y = (v: number) => altura - margem - ((v - min) / span) * (altura - margem * 2);

  const coords = pontos.map((v, i) => [i * passoX, y(v)] as const);

  const linha = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${linha} L${largura} ${altura} L0 ${altura} Z`;
  const [fx, fy] = coords[coords.length - 1];

  return (
    <svg viewBox={`0 0 ${largura} ${altura}`} preserveAspectRatio="none" style={{ height: altura, width: "100%" }}>
      <defs>
        <linearGradient id={`onda-area-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={cor} stopOpacity="0" />
        </linearGradient>
        <filter id={`onda-brilho-${id}`} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="5" result="desfoque" />
          <feMerge>
            <feMergeNode in="desfoque" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* linhas de grade horizontais, clima "osciloscópio" */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={0} y1={altura * f} x2={largura} y2={altura * f} stroke="rgba(148,163,184,0.12)" strokeWidth={1} />
      ))}

      {/* limites reais configurados em Parâmetros — mesma faixa que abre alerta/OS */}
      {limites?.atencao != null && (
        <g>
          <line x1={0} y1={y(limites.atencao)} x2={largura} y2={y(limites.atencao)} stroke="#fbbf24" strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="7 7" />
          <text x={largura - 6} y={y(limites.atencao) - 8} textAnchor="end" fontSize={20} fill="#fbbf24" fillOpacity={0.85} fontFamily="monospace">
            atenção {limites.atencao}{unidade}
          </text>
        </g>
      )}
      {limites?.alarme != null && (
        <g>
          <line x1={0} y1={y(limites.alarme)} x2={largura} y2={y(limites.alarme)} stroke="#fb7185" strokeOpacity={0.6} strokeWidth={1.5} strokeDasharray="7 7" />
          <text x={largura - 6} y={y(limites.alarme) - 8} textAnchor="end" fontSize={20} fill="#fb7185" fillOpacity={0.85} fontFamily="monospace">
            alarme {limites.alarme}{unidade}
          </text>
        </g>
      )}

      <path d={area} fill={`url(#onda-area-${id})`} />
      <path d={linha} fill="none" stroke={cor} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" filter={`url(#onda-brilho-${id})`} style={{ transition: "stroke 0.5s ease" }} />
      <path d={linha} fill="none" stroke={cor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.5s ease" }} />

      <circle cx={fx} cy={fy} r={6} fill={cor} filter={`url(#onda-brilho-${id})`} />
    </svg>
  );
}
