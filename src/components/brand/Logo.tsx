import { useId } from "react";

/**
 * Marca do sistema: MYMAQ360 — anel 360° fechado + engrenagem + sensor ativo.
 * Um símbolo só, usado em toda parte (favicon, cabeçalho, tela de login), para nunca desalinhar.
 */

type Props = {
  /** tamanho do símbolo em pixels (largura = altura) */
  size?: number;
  className?: string;
  /** "gradiente" (padrão) usa azul→índigo; "solida" usa uma cor só (herda `currentColor`) */
  variante?: "gradiente" | "solida";
};

/** Só o símbolo (anel + engrenagem + ponto central), sem o nome ao lado. */
export function LogoIcone({ size = 32, className, variante = "gradiente" }: Props) {
  const id = useId();
  const cor = variante === "gradiente" ? `url(#${id})` : "currentColor";

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      {variante === "gradiente" && (
        <defs>
          <linearGradient id={id} x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#2563eb" />
            <stop offset="1" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
      )}
      <circle cx="32" cy="32" r="28" stroke={cor} strokeWidth="3.2" />
      <path d="M7.75 18.00 A28 28 0 0 1 31.02 4.02" stroke={cor} strokeWidth="5.2" strokeLinecap="round" />
      <path
        d="M28.24 17.48 L28.45 10.09 L35.55 10.09 L35.76 17.48 A15 15 0 0 1 42.70 21.49 L49.20 17.97 L52.75 24.12 L46.45 27.99 A15 15 0 0 1 46.45 36.01 L52.75 39.88 L49.20 46.03 L42.70 42.51 A15 15 0 0 1 35.76 46.52 L35.55 53.91 L28.45 53.91 L28.24 46.52 A15 15 0 0 1 21.30 42.51 L14.80 46.03 L11.25 39.88 L17.55 36.01 A15 15 0 0 1 17.55 27.99 L11.25 24.12 L14.80 17.97 L21.30 21.49 A15 15 0 0 1 28.24 17.48 Z"
        stroke={cor}
        strokeWidth="3.2"
        strokeLinejoin="miter"
      />
      <circle cx="32" cy="32" r="4.4" fill={cor} />
    </svg>
  );
}

/** Nome da marca escrito ("MY" mais leve + "MAQ360" em negrito), sem o símbolo. */
export function LogoNome({ className, cor }: { className?: string; cor?: string }) {
  return (
    <span className={className} style={{ color: cor }}>
      <span style={{ fontWeight: 400 }}>MY</span>
      <span style={{ fontWeight: 700 }}>MAQ360</span>
    </span>
  );
}

/** Símbolo + nome juntos — o principal, usado no cabeçalho e na tela de login. */
export function Logo({ size = 32, className, textoClassName, escuro = false }: Props & { textoClassName?: string; escuro?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoIcone size={size} />
      <LogoNome className={textoClassName} cor={escuro ? "#ffffff" : "#0f172a"} />
    </span>
  );
}
