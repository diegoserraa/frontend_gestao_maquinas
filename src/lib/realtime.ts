import { getToken } from "@/modules/login/loginStorage";
import { getWsUrl } from "@/modules/monitoramento/monitoramentoService";

/**
 * Conexão única de tempo real (WebSocket) compartilhada pelo app inteiro.
 *
 * - O sino de notificações e o monitoramento assinam a MESMA conexão (uma só por aba).
 * - Só fica conectado enquanto alguém está ouvindo (sem assinantes, fecha).
 * - Reconecta sozinho com espera crescente; ao voltar para a aba ou à internet, tenta na hora.
 * - Se o servidor fechar com "permissões mudaram" (4001), reconecta quase imediatamente.
 */

export type MensagemRealtime = { type: string; data: any };
export type StatusRealtime = "conectando" | "online" | "offline";

const ESPERA_BASE_MS = 1000;
const ESPERA_MAX_MS = 15000;
const ESPERA_REAVALIAR_MS = 300;
const CODIGO_REAVALIAR = 4001;

type Ouvinte = (mensagem: MensagemRealtime) => void;
type ObservadorStatus = (status: StatusRealtime) => void;

const ouvintes = new Set<Ouvinte>();
const observadores = new Set<ObservadorStatus>();

let socket: WebSocket | null = null;
let status: StatusRealtime = "offline";
let tentativas = 0;
let temporizador: ReturnType<typeof setTimeout> | null = null;
let ativo = false;
let ganchosGlobais = false;

function definirStatus(novo: StatusRealtime): void {
  if (novo === status) return;
  status = novo;
  observadores.forEach((cb) => cb(novo));
}

function limparTemporizador(): void {
  if (temporizador) {
    clearTimeout(temporizador);
    temporizador = null;
  }
}

function agendar(espera: number): void {
  if (!ativo || temporizador) return;

  temporizador = setTimeout(() => {
    temporizador = null;
    conectar();
  }, espera);
}

function conectar(): void {
  if (!ativo || socket) return;

  // sem login não há o que ouvir (o servidor recusaria)
  if (!getToken()) {
    definirStatus("offline");
    return;
  }

  let ws: WebSocket;

  try {
    ws = new WebSocket(getWsUrl());
  } catch {
    definirStatus("offline");
    agendar(ESPERA_BASE_MS);
    return;
  }

  socket = ws;
  if (status !== "online") definirStatus("conectando");

  ws.onopen = () => {
    tentativas = 0;
    definirStatus("online");
  };

  ws.onmessage = (evento) => {
    let mensagem: MensagemRealtime;

    try {
      mensagem = JSON.parse(evento.data as string);
    } catch {
      return; // mensagem malformada
    }

    if (!mensagem || typeof mensagem.type !== "string") return;
    ouvintes.forEach((ouvinte) => ouvinte(mensagem));
  };

  ws.onerror = () => {
    ws.close();
  };

  ws.onclose = (evento) => {
    if (socket === ws) socket = null;
    if (!ativo) return;

    definirStatus("offline");

    if (evento.code === CODIGO_REAVALIAR) {
      agendar(ESPERA_REAVALIAR_MS);
      return;
    }

    const espera = Math.min(ESPERA_BASE_MS * 2 ** tentativas, ESPERA_MAX_MS);
    tentativas += 1;
    agendar(espera);
  };
}

/** Tenta reconectar já (aba voltou a ficar visível, internet voltou). */
export function reconectarAgora(): void {
  if (!ativo || socket) return;
  limparTemporizador();
  tentativas = 0;
  conectar();
}

function instalarGanchosGlobais(): void {
  if (ganchosGlobais || typeof window === "undefined") return;
  ganchosGlobais = true;

  window.addEventListener("online", reconectarAgora);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") reconectarAgora();
  });
}

function iniciar(): void {
  if (ativo) return;
  ativo = true;
  instalarGanchosGlobais();
  conectar();
}

function pararSeOcioso(): void {
  if (ouvintes.size > 0 || observadores.size > 0) return;

  ativo = false;
  limparTemporizador();
  tentativas = 0;

  const ws = socket;
  socket = null;
  status = "offline";
  ws?.close();
}

/** Recebe todas as mensagens do servidor. Devolve a função que cancela a assinatura. */
export function assinarRealtime(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  iniciar();

  return () => {
    ouvintes.delete(ouvinte);
    pararSeOcioso();
  };
}

/** Acompanha o estado da conexão (chama já com o estado atual). Devolve a função que cancela. */
export function observarStatusRealtime(cb: ObservadorStatus): () => void {
  observadores.add(cb);
  cb(status);
  iniciar();

  return () => {
    observadores.delete(cb);
    pararSeOcioso();
  };
}

export const statusRealtimeAtual = (): StatusRealtime => status;

/** Só para testes: volta tudo ao estado inicial. */
export function __resetarRealtime(): void {
  ouvintes.clear();
  observadores.clear();
  ativo = false;
  limparTemporizador();
  socket?.close();
  socket = null;
  status = "offline";
  tentativas = 0;
}
