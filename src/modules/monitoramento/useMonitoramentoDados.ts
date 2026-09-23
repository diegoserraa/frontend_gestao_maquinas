import { useEffect, useMemo, useRef, useState } from "react";

import { useTelemetriaRealtime } from "./useTelemetriaRealtime";
import { criarMotorMock } from "./mockTelemetria";
import { media, nivelGeral } from "./monitoramentoHelpers";
import type { TelemetriaAtual } from "./monitoramentoTypes";

const INTERVALO_DEMO_MS = 4000;
const MAX_PONTOS = 48;
const MAX_FEED = 14;

export type PontoHistorico = {
  t: number;
  temperatura: number | null;
  vibracao: number | null;
  horas_ligadas: number | null;
};

export type ItemFeed = {
  id: string;
  maquina_id: number;
  maquina_nome: string;
  temperatura: number | null;
  vibracao: number | null;
  em: number;
};

export type ModoDados = "auto" | "demo" | "real";

export type ResumoMonitoramento = {
  total: number;
  online: number;
  emAlerta: number;
  offline: number;
  tempMedia: number | null;
  vibMedia: number | null;
};

export function useMonitoramentoDados() {
  const real = useTelemetriaRealtime();

  const [modo, setModo] = useState<ModoDados>("auto");
  const [demoLeituras, setDemoLeituras] = useState<TelemetriaAtual[]>([]);
  const [historico, setHistorico] = useState<Record<number, PontoHistorico[]>>({});
  const [feed, setFeed] = useState<ItemFeed[]>([]);
  const [ultimaEm, setUltimaEm] = useState<number | null>(null);

  const ultimoFeedRef = useRef(0);

  const semSinalReal =
    real.leituras.length === 0 ||
    real.leituras.every((l) => l.atualizado_em === null);

  const demoAtivo =
    modo === "demo" || (modo === "auto" && !real.carregando && semSinalReal);

  function registrar(lista: TelemetriaAtual[]) {
    const agora = Date.now();

    if (lista.some((l) => l.temperatura !== null || l.vibracao !== null)) {
      setUltimaEm(agora);
    }

    setHistorico((prev) => {
      const next: Record<number, PontoHistorico[]> = { ...prev };

      for (const l of lista) {
        if (
          l.temperatura === null &&
          l.vibracao === null &&
          l.horas_ligadas === null
        ) {
          continue;
        }

        const arr = next[l.maquina_id] ? next[l.maquina_id].slice() : [];
        arr.push({
          t: agora,
          temperatura: l.temperatura,
          vibracao: l.vibracao,
          horas_ligadas: l.horas_ligadas,
        });
        if (arr.length > MAX_PONTOS) arr.shift();
        next[l.maquina_id] = arr;
      }

      return next;
    });

    // alimenta o "live feed" com no máximo 1 item a cada 900ms
    if (agora - ultimoFeedRef.current >= 900) {
      const candidatos = lista.filter(
        (l) => l.temperatura !== null || l.vibracao !== null
      );
      if (candidatos.length > 0) {
        const l = candidatos[Math.floor(Math.random() * candidatos.length)];
        ultimoFeedRef.current = agora;
        setFeed((prev) =>
          [
            {
              id: `${l.maquina_id}-${agora}`,
              maquina_id: l.maquina_id,
              maquina_nome: l.maquina_nome ?? `Máquina #${l.maquina_id}`,
              temperatura: l.temperatura,
              vibracao: l.vibracao,
              em: agora,
            },
            ...prev,
          ].slice(0, MAX_FEED)
        );
      }
    }
  }

  // histórico das leituras REAIS
  useEffect(() => {
    if (demoAtivo) return;
    if (real.leituras.length === 0) return;
    registrar(real.leituras);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [real.leituras, demoAtivo]);

  // loop do modo DEMO
  useEffect(() => {
    if (!demoAtivo) {
      setDemoLeituras([]);
      return;
    }

    const motor = criarMotorMock(
      real.leituras.length > 0
        ? real.leituras.map((l) => ({
            maquina_id: l.maquina_id,
            maquina_nome: l.maquina_nome ?? `Máquina #${l.maquina_id}`,
            setor_id: l.setor_id,
            setor_nome: l.setor_nome,
          }))
        : undefined
    );

    const emitir = () => {
      const snap = motor.tick();
      setDemoLeituras(snap);
      registrar(snap);
    };

    emitir();
    const id = setInterval(emitir, INTERVALO_DEMO_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoAtivo, real.leituras.length]);

  const leituras = demoAtivo ? demoLeituras : real.leituras;

  const resumo = useMemo<ResumoMonitoramento>(() => {
    let online = 0;
    let emAlerta = 0;
    let offline = 0;

    for (const l of leituras) {
      const temSinal =
        l.temperatura !== null || l.vibracao !== null || l.horas_ligadas !== null;

      if (!temSinal) {
        offline += 1;
        continue;
      }

      const recente =
        l.atualizado_em !== null &&
        Date.now() - new Date(l.atualizado_em).getTime() <= 90_000;

      if (recente) online += 1;
      else offline += 1;

      if (nivelGeral(l) !== "ok") emAlerta += 1;
    }

    return {
      total: leituras.length,
      online,
      emAlerta,
      offline,
      tempMedia: media(leituras.map((l) => l.temperatura)),
      vibMedia: media(leituras.map((l) => l.vibracao)),
    };
  }, [leituras]);

  return {
    leituras,
    historico,
    feed,
    resumo,
    status: real.status,
    carregando: real.carregando && !demoAtivo,
    ultimaAtualizacao: ultimaEm ? new Date(ultimaEm) : real.ultimaAtualizacao,
    demoAtivo,
    modo,
    setModo,
  };
}
