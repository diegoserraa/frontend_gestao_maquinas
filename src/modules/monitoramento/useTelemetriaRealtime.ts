import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { assinarRealtime, observarStatusRealtime } from "@/lib/realtime";
import { getTelemetriaAtual } from "./monitoramentoService";
import type {
  RealtimeStatus,
  TelemetriaAtual,
} from "./monitoramentoTypes";

type MapaTelemetria = Record<number, TelemetriaAtual>;

/**
 * Mantém o painel de monitoramento atualizado em tempo real.
 *
 * - Carrega o estado inicial via REST (/telemetria).
 * - Ouve a conexão de tempo real compartilhada do app (src/lib/realtime.ts) e mescla cada leitura
 *   nova. A reconexão automática mora lá.
 */
export function useTelemetriaRealtime() {
  const [dados, setDados] = useState<MapaTelemetria>({});
  const [status, setStatus] = useState<RealtimeStatus>("conectando");
  const [carregando, setCarregando] = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  const desmontadoRef = useRef(false);

  const mesclar = useCallback((leituras: TelemetriaAtual[]) => {
    setDados((atual) => {
      const novo = { ...atual };
      for (const l of leituras) {
        novo[l.maquina_id] = l;
      }
      return novo;
    });
    setUltimaAtualizacao(new Date());
  }, []);

  useEffect(() => {
    desmontadoRef.current = false;

    // estado inicial via REST
    getTelemetriaAtual()
      .then((lista) => {
        if (!desmontadoRef.current) mesclar(lista);
      })
      .catch(() => {
        /* o WebSocket ainda pode trazer o snapshot */
      })
      .finally(() => {
        if (!desmontadoRef.current) setCarregando(false);
      });

    const cancelarStatus = observarStatusRealtime(setStatus);

    const cancelarMensagens = assinarRealtime((msg) => {
      if (msg.type === "snapshot") {
        mesclar(msg.data);
      } else if (msg.type === "telemetria") {
        mesclar([msg.data]);
      }
    });

    return () => {
      desmontadoRef.current = true;
      cancelarStatus();
      cancelarMensagens();
    };
  }, [mesclar]);

  const leituras = useMemo(
    () =>
      Object.values(dados).sort((a, b) =>
        (a.maquina_nome ?? "").localeCompare(b.maquina_nome ?? "")
      ),
    [dados]
  );

  return {
    leituras,
    status,
    carregando,
    ultimaAtualizacao,
  };
}
