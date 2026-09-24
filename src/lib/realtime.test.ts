import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/login/loginStorage", () => ({ getToken: vi.fn(() => "token-de-teste") }));
vi.mock("@/modules/monitoramento/monitoramentoService", () => ({ getWsUrl: () => "ws://teste/ws/telemetria?token=x" }));

import { getToken } from "@/modules/login/loginStorage";
import { __resetarRealtime, assinarRealtime, observarStatusRealtime, statusRealtimeAtual } from "./realtime";

class FakeWS {
  static todas: FakeWS[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;
  fechado = false;
  url: string;
  constructor(url: string) {
    this.url = url;
    FakeWS.todas.push(this);
  }
  close() {
    this.fechado = true;
  }
  abrir() {
    this.onopen?.();
  }
  receber(obj: unknown) {
    this.onmessage?.({ data: typeof obj === "string" ? obj : JSON.stringify(obj) });
  }
  cair(code = 1006) {
    this.onclose?.({ code });
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeWS.todas = [];
  (globalThis as any).WebSocket = FakeWS;
  vi.mocked(getToken).mockReturnValue("token-de-teste");
});

afterEach(() => {
  __resetarRealtime();
  vi.useRealTimers();
});

describe("realtime (conexão única compartilhada)", () => {
  it("não conecta sem assinantes; o primeiro assinante abre UMA conexão para todos", () => {
    expect(FakeWS.todas).toHaveLength(0);

    const a = vi.fn();
    const b = vi.fn();
    assinarRealtime(a);
    assinarRealtime(b);
    expect(FakeWS.todas).toHaveLength(1);

    FakeWS.todas[0].abrir();
    FakeWS.todas[0].receber({ type: "notificacao", data: { x: 1 } });
    expect(a).toHaveBeenCalledWith({ type: "notificacao", data: { x: 1 } });
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("ignora mensagens malformadas sem quebrar", () => {
    const a = vi.fn();
    assinarRealtime(a);
    FakeWS.todas[0].abrir();
    FakeWS.todas[0].receber("isso-nao-e-json");
    FakeWS.todas[0].receber({ semTipo: true });
    expect(a).not.toHaveBeenCalled();
  });

  it("informa o status: conectando → online → offline", () => {
    const estados: string[] = [];
    observarStatusRealtime((s) => estados.push(s));
    FakeWS.todas[0].abrir();
    FakeWS.todas[0].cair();
    expect(estados).toEqual(["offline", "conectando", "online", "offline"]);
  });

  it("reconecta sozinho com espera crescente e volta ao normal quando conecta", () => {
    assinarRealtime(() => {});
    FakeWS.todas[0].cair(); // 1ª queda: espera 1s
    expect(FakeWS.todas).toHaveLength(1);
    vi.advanceTimersByTime(999);
    expect(FakeWS.todas).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(FakeWS.todas).toHaveLength(2);

    FakeWS.todas[1].cair(); // 2ª queda: espera 2s
    vi.advanceTimersByTime(1999);
    expect(FakeWS.todas).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(FakeWS.todas).toHaveLength(3);

    FakeWS.todas[2].abrir(); // conectou: zera a espera
    FakeWS.todas[2].cair();
    vi.advanceTimersByTime(1000);
    expect(FakeWS.todas).toHaveLength(4);
  });

  it("'permissões mudaram' (4001) reconecta quase na hora", () => {
    assinarRealtime(() => {});
    FakeWS.todas[0].abrir();
    FakeWS.todas[0].cair(4001);
    vi.advanceTimersByTime(300);
    expect(FakeWS.todas).toHaveLength(2);
  });

  it("sem assinantes fecha a conexão e para de reconectar", () => {
    const cancelar = assinarRealtime(() => {});
    const ws = FakeWS.todas[0];
    cancelar();
    expect(ws.fechado).toBe(true);
    ws.cair();
    vi.advanceTimersByTime(60_000);
    expect(FakeWS.todas).toHaveLength(1);
    expect(statusRealtimeAtual()).toBe("offline");
  });

  it("um assinante saindo não derruba a conexão dos outros", () => {
    const cancelarA = assinarRealtime(() => {});
    const b = vi.fn();
    assinarRealtime(b);
    cancelarA();
    expect(FakeWS.todas[0].fechado).toBe(false);
    FakeWS.todas[0].abrir();
    FakeWS.todas[0].receber({ type: "alerta", data: {} });
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("sem login (sem token) não tenta conectar", () => {
    vi.mocked(getToken).mockReturnValue(null as any);
    assinarRealtime(() => {});
    expect(FakeWS.todas).toHaveLength(0);
  });
});
