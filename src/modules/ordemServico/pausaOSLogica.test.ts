import { describe, expect, it } from "vitest";
import {
  estaPausada,
  eventosDePausas,
  formatarCronometro,
  formatarSegundos,
  segundosDaPausaAtual,
  segundosDeReparo,
  segundosPausados,
  teveOuTemPausa,
  type PausaOS,
} from "./pausaOSLogica";

const NOW = new Date("2026-03-10T12:00:00Z").getTime();

describe("pausa em curso", () => {
  it("O.S. que não está pausada tem 0 de pausa em curso", () => {
    expect(segundosDaPausaAtual({ status: "EM_ANDAMENTO", pausa_atual_segundos: 999 }, NOW)).toBe(0);
    expect(estaPausada({ status: "EM_ANDAMENTO" })).toBe(false);
  });

  it("usa o que o servidor mediu e soma só o que passou depois de receber", () => {
    const os = { status: "PAUSADA", pausa_atual_segundos: 120 };
    expect(segundosDaPausaAtual(os, NOW)).toBe(120); // primeira leitura: marca o recebimento
    expect(segundosDaPausaAtual(os, NOW + 30_000)).toBe(150);
    expect(segundosDaPausaAtual(os, NOW + 95_000)).toBe(215);
  });

  it("uma O.S. nova (recarregada) recomeça a contagem do servidor", () => {
    const antiga = { status: "PAUSADA", pausa_atual_segundos: 10 };
    segundosDaPausaAtual(antiga, NOW);
    const nova = { status: "PAUSADA", pausa_atual_segundos: 100 };
    expect(segundosDaPausaAtual(nova, NOW + 60_000)).toBe(100);
  });

  it("não quebra sem os campos", () => {
    expect(segundosDaPausaAtual({ status: "PAUSADA" }, NOW)).toBe(0);
    expect(segundosPausados({}, NOW)).toBe(0);
  });
});

describe("tempo pausado total e reparo efetivo", () => {
  it("total = pausas encerradas + a em curso", () => {
    const os = { status: "PAUSADA", tempo_pausado_segundos: 600, pausa_atual_segundos: 60 };
    expect(segundosPausados(os, NOW)).toBe(660);
    expect(segundosPausados(os, NOW + 40_000)).toBe(700);
  });

  it("teveOuTemPausa: só aparece quando há o que mostrar", () => {
    expect(teveOuTemPausa({ status: "EM_ANDAMENTO", tempo_pausado_segundos: 0 })).toBe(false);
    expect(teveOuTemPausa({ status: "EM_ANDAMENTO", tempo_pausado_segundos: 30 })).toBe(true);
    expect(teveOuTemPausa({ status: "PAUSADA" })).toBe(true);
  });

  it("finalizada: reparo = (resolução - início) - tempo pausado", () => {
    const os = {
      status: "FINALIZADA",
      data_inicio_atendimento: "2026-03-10T08:00:00Z",
      data_resolucao: "2026-03-10T10:00:00Z",
      tempo_pausado_segundos: 1800,
    };
    expect(segundosDeReparo(os, NOW)).toBe(7200 - 1800);
  });

  it("em andamento: reparo até agora, descontando as pausas", () => {
    const os = { status: "EM_ANDAMENTO", data_inicio_atendimento: "2026-03-10T10:00:00Z", tempo_pausado_segundos: 600 };
    expect(segundosDeReparo(os, NOW)).toBe(7200 - 600);
  });

  it("pausada: o reparo fica parado (a pausa em curso é descontada)", () => {
    const os = {
      status: "PAUSADA",
      data_inicio_atendimento: "2026-03-10T10:00:00Z",
      tempo_pausado_segundos: 0,
      pausa_atual_segundos: 300,
    };
    const agora = segundosDeReparo(os, NOW);
    const depois = segundosDeReparo(os, NOW + 60_000);
    expect(agora).toBe(7200 - 300);
    expect(depois).toBe(agora); // passou 1 min, mas a pausa também cresceu 1 min
  });

  it("sem início de atendimento não há reparo; nunca fica negativo", () => {
    expect(segundosDeReparo({ status: "ABERTA" }, NOW)).toBeNull();
    const os = {
      status: "FINALIZADA",
      data_inicio_atendimento: "2026-03-10T08:00:00Z",
      data_resolucao: "2026-03-10T08:10:00Z",
      tempo_pausado_segundos: 99999,
    };
    expect(segundosDeReparo(os, NOW)).toBe(0);
  });
});

describe("formatação", () => {
  it("formatarSegundos", () => {
    expect(formatarSegundos(0)).toBe("0s");
    expect(formatarSegundos(45)).toBe("45s");
    expect(formatarSegundos(60)).toBe("1min");
    expect(formatarSegundos(59 * 60 + 59)).toBe("59min");
    expect(formatarSegundos(3600 + 5 * 60)).toBe("1h 05min");
    expect(formatarSegundos(2 * 86400 + 3 * 3600)).toBe("2d 3h");
    expect(formatarSegundos(null)).toBe("-");
    expect(formatarSegundos(-5)).toBe("0s");
  });

  it("formatarCronometro", () => {
    expect(formatarCronometro(0)).toBe("00:00:00");
    expect(formatarCronometro(65)).toBe("00:01:05");
    expect(formatarCronometro(3661)).toBe("01:01:01");
    expect(formatarCronometro(100 * 3600)).toBe("100:00:00");
  });
});

describe("eventosDePausas (linha do tempo)", () => {
  const pausas: PausaOS[] = [
    { id: 2, os_id: 1, motivo: "Almoço", pausada_em: "2026-03-10T12:00:00Z", retomada_em: null, pausada_por: 3, pausada_por_nome: "Ana", retomada_por: null, retomada_por_nome: null, duracao_segundos: null },
    { id: 1, os_id: 1, motivo: "Peça", pausada_em: "2026-03-10T09:00:00Z", retomada_em: "2026-03-10T10:30:00Z", pausada_por: 3, pausada_por_nome: "Ana", retomada_por: 3, retomada_por_nome: "Ana", duracao_segundos: 5400 },
  ];

  it("gera pausou/retomou em ordem cronológica; pausa aberta não tem retomada", () => {
    const ev = eventosDePausas(pausas);
    expect(ev.map((e) => e.tipo)).toEqual(["pausa", "retomada", "pausa"]);
    expect(ev[0].descricao).toBe("Ana pausou. Motivo: Peça");
    expect(ev[1].descricao).toBe("Ana retomou o atendimento após 1h 30min parado");
    expect(ev[2].descricao).toContain("Almoço");
  });

  it("sem nomes usa texto neutro", () => {
    const ev = eventosDePausas([{ ...pausas[1], pausada_por_nome: null, retomada_por_nome: null }]);
    expect(ev[0].descricao).toBe("Atendimento pausado. Motivo: Peça");
    expect(ev[1].descricao).toContain("Atendimento retomado");
  });

  it("lista vazia", () => {
    expect(eventosDePausas([])).toEqual([]);
  });
});
