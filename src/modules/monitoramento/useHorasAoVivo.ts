import { useEffect, useState } from "react";

import { estaAoVivo } from "./monitoramentoHelpers";
import type { TelemetriaAtual } from "./monitoramentoTypes";

// mesmo limiar do firmware (dashboard_provisionamento.ino, LIMIAR_RODANDO) —
// abaixo disso o ESP32 não soma horímetro, então aqui também não deve
const LIMIAR_RODANDO = 0.12;

/** Horas acumuladas + o tempo corrido desde a última leitura real, se a
 * máquina seguir rodando — só pra exibição, nunca é salvo/enviado. Evita a
 * tela ficar "parada" por até 8s (intervalo real de leitura do sensor). */
export function useHorasAoVivo(leitura: TelemetriaAtual | null): number | null {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!leitura || leitura.horas_ligadas === null) return null;

  const rodando =
    leitura.vibracao !== null &&
    leitura.vibracao >= LIMIAR_RODANDO &&
    estaAoVivo(leitura.atualizado_em);

  if (!rodando || !leitura.atualizado_em) return leitura.horas_ligadas;

  const desdeMs = agora - new Date(leitura.atualizado_em).getTime();
  return leitura.horas_ligadas + Math.max(desdeMs, 0) / 3_600_000;
}
