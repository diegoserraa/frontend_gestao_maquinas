import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getTelemetriaAtual,
  getWsUrl,
} from "./monitoramentoService";
import type {
  RealtimeStatus,
  TelemetriaAtual,
  WsMensagem,
} from "./monitoramentoTypes";

type MapaTelemetria = Record<number, TelemetriaAtual>;

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 15000;

/**
 * Mantém o painel de monitoramento atualizado em tempo real.
 *
 * - Carrega o estado inicial via REST (/telemetria).
 * - Abre um WebSocket em /ws/telemetria e mescla cada leitura nova.
 * - Reconecta sozinho com backoff exponencial.
 */
export function useTelemetriaRealtime() {
  const [dados, setDados] = useState<MapaTelemetria>({});
  const [status, setStatus] = useState<RealtimeStatus>("conectando");
  const [carregando, setCarregando] = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tentativasRef = useRef(0);
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

  const conectar = useCallback(() => {
    if (desmontadoRef.current) return;

    let ws: WebSocket;

    try {
      ws = new WebSocket(getWsUrl());
    } catch {
      agendarReconexao();
      return;
    }

    wsRef.current = ws;
    setStatus((s) => (s === "online" ? s : "conectando"));

    ws.onopen = () => {
      tentativasRef.current = 0;
      setStatus("online");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsMensagem;

        if (msg.type === "snapshot") {
          mesclar(msg.data);
        } else if (msg.type === "telemetria") {
          mesclar([msg.data]);
        }
      } catch {
        /* mensagem malformada — ignora */
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (desmontadoRef.current) return;
      setStatus("offline");
      agendarReconexao();
    };

    function agendarReconexao() {
      if (desmontadoRef.current || reconnectRef.current) return;

      const atraso = Math.min(
        RECONNECT_BASE_MS * 2 ** tentativasRef.current,
        RECONNECT_MAX_MS
      );

      tentativasRef.current += 1;

      reconnectRef.current = setTimeout(() => {
        reconnectRef.current = null;
        conectar();
      }, atraso);
    }
  }, [mesclar]);

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

    conectar();

    return () => {
      desmontadoRef.current = true;

      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }

      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [conectar, mesclar]);

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
