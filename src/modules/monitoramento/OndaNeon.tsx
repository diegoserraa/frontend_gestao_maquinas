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

  // Os rótulos de atenção/alarme são HTML sobreposto, não <text> do SVG: o
  // SVG usa preserveAspectRatio="none" (viewBox 1000 de largura esticado pra
  // caber o card, bem mais estreito que isso em pixels reais) — um <text>
  // dentro dele fica espremido/ilegível no eixo X. HTML por cima não sofre
  // essa distorção.
  const rotuloTop = (v: number) => `${(y(v) / altura) * 100}%`;
  // se os dois limites ficarem perto um do outro na tela, empurra o de
  // atenção um pouco pra cima pra não sobrepor o de alarme
  const pxAtencao = limites?.atencao != null ? y(limites.atencao) : null;
  const pxAlarme = limites?.alarme != null ? y(limites.alarme) : null;
  const colidindo = pxAtencao != null && pxAlarme != null && Math.abs(pxAtencao - pxAlarme) < altura * 0.14;

  return (
    <div style={{ position: "relative", height: altura, width: "100%" }}>
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
          <line x1={0} y1={y(limites.atencao)} x2={largura} y2={y(limites.atencao)} stroke="#fbbf24" strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="7 7" />
        )}
        {limites?.alarme != null && (
          <line x1={0} y1={y(limites.alarme)} x2={largura} y2={y(limites.alarme)} stroke="#fb7185" strokeOpacity={0.6} strokeWidth={1.5} strokeDasharray="7 7" />
        )}

        <path d={area} fill={`url(#onda-area-${id})`} />
        <path d={linha} fill="none" stroke={cor} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" filter={`url(#onda-brilho-${id})`} style={{ transition: "stroke 0.5s ease" }} />
        <path d={linha} fill="none" stroke={cor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.5s ease" }} />

        <circle cx={fx} cy={fy} r={6} fill={cor} filter={`url(#onda-brilho-${id})`} />
      </svg>

      {limites?.atencao != null && (
        <span
          className="pointer-events-none absolute right-2 whitespace-nowrap rounded bg-slate-950/60 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-amber-400"
          style={{ top: rotuloTop(limites.atencao), transform: `translateY(${colidindo ? "-120%" : "-100%"})` }}
        >
          atenção {limites.atencao}{unidade}
        </span>
      )}
      {limites?.alarme != null && (
        <span
          className="pointer-events-none absolute right-2 whitespace-nowrap rounded bg-slate-950/60 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-rose-400"
          style={{ top: rotuloTop(limites.alarme), transform: "translateY(-100%)" }}
        >
          alarme {limites.alarme}{unidade}
        </span>
      )}
    </div>
  );
}
