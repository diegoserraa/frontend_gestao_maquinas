import { useId } from "react";

type Props = {
  valores: (number | null)[];
  cor: string;
  altura?: number;
  className?: string;
};

/**
 * Mini gráfico de linha em SVG puro (sem dependência), com preenchimento
 * em gradiente e ponto final destacado. Escala automática ao min/max.
 */
export function Sparkline({ valores, cor, altura = 26, className }: Props) {
  const id = useId();
  const largura = 100;

  const pontos = valores.filter((v): v is number => v !== null && Number.isFinite(v));

  if (pontos.length < 2) {
    return (
      <div
        className={className}
        style={{ height: altura }}
        aria-hidden
      />
    );
  }

  const min = Math.min(...pontos);
  const max = Math.max(...pontos);
  const span = max - min || 1;
  const passoX = largura / (pontos.length - 1);

  const coords = pontos.map((v, i) => {
    const x = i * passoX;
    const y = altura - ((v - min) / span) * (altura - 6) - 3;
    return [x, y] as const;
  });

  const linha = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const area = `${linha} L${largura} ${altura} L0 ${altura} Z`;
  const [fx, fy] = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${largura} ${altura}`}
      preserveAspectRatio="none"
      className={className}
      style={{ height: altura, width: "100%", display: "block" }}
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.22" />
          <stop offset="100%" stopColor={cor} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={area} fill={`url(#spark-${id})`} />
      <path
        d={linha}
        fill="none"
        stroke={cor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={fx} cy={fy} r="2" fill={cor} />
      <circle cx={fx} cy={fy} r="4" fill={cor} fillOpacity="0.16" />
    </svg>
  );
}
