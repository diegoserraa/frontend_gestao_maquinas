import type { MensagemRealtime } from "@/lib/realtime";
import type { Notificacao } from "./notificacaoType";

/** Eventos de notificação que o servidor empurra pelo WebSocket (só para o dono, só da própria empresa). */
export type EventoNotificacao =
  | { type: "notificacao"; data: { notificacao: Notificacao; nao_lidas: number } }
  | {
      type: "notificacao_sync";
      data: { acao: "lida" | "todas_lidas" | "excluida"; id?: number; nao_lidas: number };
    };

export function ehEventoDeNotificacao(msg: MensagemRealtime): msg is EventoNotificacao {
  if (!msg || typeof msg.data !== "object" || msg.data === null) return false;
  if (typeof msg.data.nao_lidas !== "number") return false;

  if (msg.type === "notificacao") return typeof msg.data.notificacao?.id === "number";
  return msg.type === "notificacao_sync";
}

/** Aplica o evento na lista já carregada (o contador do sino vem pronto do servidor: `nao_lidas`). */
export function aplicarEventoNaLista(lista: Notificacao[], evento: EventoNotificacao): Notificacao[] {
  if (evento.type === "notificacao") {
    const nova = evento.data.notificacao;
    if (lista.some((n) => n.id === nova.id)) return lista; // já estava (ex.: chegou pela busca também)
    return [nova, ...lista];
  }

  const { acao, id } = evento.data;

  if (acao === "todas_lidas") return lista.map((n) => (n.lida ? n : { ...n, lida: true }));
  if (acao === "lida") return lista.map((n) => (n.id === id && !n.lida ? { ...n, lida: true } : n));
  return lista.filter((n) => n.id !== id);
}

/** Título da aba com o número de não lidas: "(3) Sistema". */
export function tituloComContador(tituloBase: string, naoLidas: number): string {
  return naoLidas > 0 ? `(${naoLidas > 99 ? "99+" : naoLidas}) ${tituloBase}` : tituloBase;
}
