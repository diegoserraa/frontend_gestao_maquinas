import { describe, expect, it } from "vitest";
import { aplicarEventoNaLista, ehEventoDeNotificacao, tituloComContador } from "./notificacaoRealtimeLogica";
import type { Notificacao } from "./notificacaoType";

const notif = (id: number, lida = false): Notificacao => ({
  id,
  usuario_id: 1,
  titulo: `t${id}`,
  mensagem: "m",
  tipo: "OS_CRIADA",
  url: "/x",
  lida,
  created_at: "2026-01-01T00:00:00Z",
});

describe("ehEventoDeNotificacao", () => {
  it("aceita os dois formatos do servidor", () => {
    expect(ehEventoDeNotificacao({ type: "notificacao", data: { notificacao: notif(1), nao_lidas: 3 } })).toBe(true);
    expect(ehEventoDeNotificacao({ type: "notificacao_sync", data: { acao: "lida", id: 1, nao_lidas: 2 } })).toBe(true);
  });

  it("rejeita telemetria, alertas e lixo", () => {
    expect(ehEventoDeNotificacao({ type: "telemetria", data: {} })).toBe(false);
    expect(ehEventoDeNotificacao({ type: "notificacao", data: { nao_lidas: 1 } })).toBe(false);
    expect(ehEventoDeNotificacao({ type: "notificacao", data: { notificacao: notif(1) } })).toBe(false);
    expect(ehEventoDeNotificacao({ type: "notificacao", data: null })).toBe(false);
  });
});

describe("aplicarEventoNaLista", () => {
  const lista = [notif(2), notif(1, true)];

  it("nova notificação entra no topo", () => {
    const r = aplicarEventoNaLista(lista, { type: "notificacao", data: { notificacao: notif(3), nao_lidas: 2 } });
    expect(r.map((n) => n.id)).toEqual([3, 2, 1]);
  });

  it("não duplica se já existe", () => {
    const r = aplicarEventoNaLista(lista, { type: "notificacao", data: { notificacao: notif(2), nao_lidas: 1 } });
    expect(r).toBe(lista);
  });

  it("lida marca só aquela", () => {
    const r = aplicarEventoNaLista(lista, { type: "notificacao_sync", data: { acao: "lida", id: 2, nao_lidas: 0 } });
    expect(r.find((n) => n.id === 2)?.lida).toBe(true);
  });

  it("todas_lidas marca tudo", () => {
    const r = aplicarEventoNaLista(lista, { type: "notificacao_sync", data: { acao: "todas_lidas", nao_lidas: 0 } });
    expect(r.every((n) => n.lida)).toBe(true);
  });

  it("excluida remove", () => {
    const r = aplicarEventoNaLista(lista, { type: "notificacao_sync", data: { acao: "excluida", id: 1, nao_lidas: 1 } });
    expect(r.map((n) => n.id)).toEqual([2]);
  });

  it("não altera a lista original", () => {
    aplicarEventoNaLista(lista, { type: "notificacao_sync", data: { acao: "todas_lidas", nao_lidas: 0 } });
    expect(lista[0].lida).toBe(false);
  });
});

describe("tituloComContador", () => {
  it("mostra o número quando há não lidas", () => {
    expect(tituloComContador("Sistema", 0)).toBe("Sistema");
    expect(tituloComContador("Sistema", 3)).toBe("(3) Sistema");
    expect(tituloComContador("Sistema", 150)).toBe("(99+) Sistema");
  });
});
