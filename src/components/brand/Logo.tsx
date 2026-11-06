import { MYMAQ } from "./mymaqPaths";

/**
 * Marca oficial MyMaq360 — mesma geometria usada no site institucional
 * (site-zdm). Ícone (anel 360° + ponto do sensor) e nome escrito, para
 * nunca desalinhar entre o produto e o site.
 */

type Props = {
  /** tamanho do símbolo em pixels (largura = altura) */
  size?: number;
  className?: string;
};

/** Só o símbolo (ícone com cantos arredondados, anel verde + ponto azul). */
export function LogoIcone({ size = 32, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <rect width="100" height="100" rx="24" fill="#16244A" />
      <path d={MYMAQ.ring} fill="#10A37F" />
      <circle cx="50" cy="24" r="6.5" fill="#2563EB" />
    </svg>
  );
}

/** Só o nome escrito ("My" + "Maq360", com o "360" em verde), sem o ícone. */
export function LogoNome({ className, cor = "#0f172a" }: { className?: string; cor?: string }) {
  return (
    <svg
      height="1em"
      viewBox={`0 0 ${MYMAQ.wordWidth + 4} 100`}
      aria-label="MyMaq360"
      role="img"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <g transform="translate(0 7.2)">
        <path d={MYMAQ.my} fill={cor} />
        <path d={MYMAQ.n360} fill="#10A37F" />
      </g>
    </svg>
  );
}

/** Símbolo + nome juntos — o principal, usado no cabeçalho e na tela de login. */
export function Logo({
  size = 32,
  className,
  textoClassName,
  escuro = false,
}: Props & { textoClassName?: string; escuro?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoIcone size={size} />
      <LogoNome className={textoClassName} cor={escuro ? "#ffffff" : "#0f172a"} />
    </span>
  );
}
