import { useEffect, useState } from "react";

import { estaAoVivo } from "./monitoramentoHelpers";
import type { TelemetriaAtual } from "./monitoramentoTypes";

/** Horas acumuladas + o tempo corrido desde a última leitura real — só pra
 * exibição, nunca é salvo/enviado. Evita a tela ficar "parada" por até 8s
 * (intervalo real de leitura do sensor). "horas_ligadas" é tempo real
 * ligado (espelha o firmware, que não depende mais de cruzar um limiar de
 * vibração): só não soma se a máquina estiver offline (sem leitura recente,
 * senão um sensor desligado há dias pareceria continuar contando). */
export function useHorasAoVivo(leitura: TelemetriaAtual | null): number | null {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!leitura || leitura.horas_ligadas === null) return null;

  if (!estaAoVivo(leitura.atualizado_em) || !leitura.atualizado_em) {
    return leitura.horas_ligadas;
  }

  const desdeMs = agora - new Date(leitura.atualizado_em).getTime();
  return leitura.horas_ligadas + Math.max(desdeMs, 0) / 3_600_000;
}
