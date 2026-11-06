import { useEffect, useState } from "react";

/**
 * Devolve o "agora" em milissegundos e o atualiza a cada `intervaloMs` (padrão 1s), só enquanto `ativo`.
 * Usado para o cronômetro da pausa em curso: sem pausa não há timer rodando.
 */
export function useAgora(ativo: boolean, intervaloMs = 1000): number {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (!ativo) return;

    setAgora(Date.now());
    const timer = window.setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => window.clearInterval(timer);
  }, [ativo, intervaloMs]);

  return agora;
}
