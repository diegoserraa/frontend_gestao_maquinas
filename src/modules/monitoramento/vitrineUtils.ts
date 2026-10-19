import { useEffect, useRef, useState } from "react";

/**
 * Anima um número suavemente até o valor alvo (em vez de trocar de
 * uma vez) — é o que dá a sensação de "painel vivo" no modo vitrine.
 * `null` passa direto (sem animação: não tem valor anterior pra interpolar).
 */
export function useValorAnimado(alvo: number | null, duracaoMs = 700): number | null {
  const [exibido, setExibido] = useState(alvo);
  const origemRef = useRef(alvo);
  const inicioRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    if (alvo === null) {
      setExibido(null);
      origemRef.current = null;
      return;
    }

    const de = origemRef.current ?? alvo;
    origemRef.current = de;
    inicioRef.current = performance.now();

    function passo(agora: number) {
      const t = Math.min((agora - inicioRef.current) / duracaoMs, 1);
      const suavizado = 1 - (1 - t) * (1 - t); // ease-out
      const valor = de + (alvo! - de) * suavizado;
      setExibido(valor);
      origemRef.current = valor;

      if (t < 1) frameRef.current = requestAnimationFrame(passo);
    }

    frameRef.current = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alvo, duracaoMs]);

  return exibido;
}

/** Ponto na borda de um círculo, ângulo em graus (0° = direita, cresce no sentido horário). */
function pontoNoCirculo(cx: number, cy: number, r: number, anguloGraus: number) {
  const rad = (anguloGraus * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Caminho SVG de um arco entre dois ângulos (graus), sempre no sentido horário. */
export function arcoSvg(cx: number, cy: number, r: number, anguloInicial: number, anguloFinal: number): string {
  const inicio = pontoNoCirculo(cx, cy, r, anguloInicial);
  const fim = pontoNoCirculo(cx, cy, r, anguloFinal);
  const arcoGrande = anguloFinal - anguloInicial <= 180 ? 0 : 1;
  return `M ${inicio.x} ${inicio.y} A ${r} ${r} 0 ${arcoGrande} 1 ${fim.x} ${fim.y}`;
}
