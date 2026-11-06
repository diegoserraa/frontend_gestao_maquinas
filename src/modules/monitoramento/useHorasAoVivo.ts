import { useEffect, useState } from "react";

import { LIMIAR_VIBRACAO_RODANDO, estaAoVivo } from "./monitoramentoHelpers";
import type { TelemetriaAtual } from "./monitoramentoTypes";

/** Horas acumuladas + o tempo corrido desde a última leitura real — só pra
 * exibição, nunca é salvo/enviado. Evita a tela ficar "parada" por até 8s
 * (intervalo real de leitura do sensor).
 *
 * "horas_ligadas" é horas de MÁQUINA RODANDO, não de ESP32 energizado — o
 * firmware só soma quando a vibração cruza LIMIAR_RODANDO (senão o sensor
 * sozinho, ligado numa máquina parada, inflava o horímetro sem a máquina
 * ter trabalhado nada). Aqui só extrapola ao vivo (entre uma leitura MQTT e
 * a próxima) se a ÚLTIMA leitura também indicava "rodando" — senão mostra
 * o valor parado mesmo, igual o firmware faria.
 */
export function useHorasAoVivo(leitura: TelemetriaAtual | null): number | null {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!leitura || leitura.horas_ligadas === null) return null;

  const rodando = leitura.vibracao !== null && leitura.vibracao >= LIMIAR_VIBRACAO_RODANDO;

  if (!rodando || !estaAoVivo(leitura.atualizado_em) || !leitura.atualizado_em) {
    return leitura.horas_ligadas;
  }

  const desdeMs = agora - new Date(leitura.atualizado_em).getTime();
  return leitura.horas_ligadas + Math.max(desdeMs, 0) / 3_600_000;
}
