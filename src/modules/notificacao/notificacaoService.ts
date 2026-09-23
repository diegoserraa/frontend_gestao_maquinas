import { apiGet, apiPatch, apiDelete } from "@/lib/apiClient";

/* =========================
   NOTIFICAÇÕES
========================= */

/*
   Buscar notificações do usuário
*/
export async function getNotificacoes(usuario_id: number) {
  try {
    return await apiGet(`/notificacoes?usuario_id=${usuario_id}`);
  } catch {
    throw new Error("Erro ao buscar notificações");
  }
}

/*
   Buscar apenas notificações não lidas
*/
export async function getNotificacoesNaoLidas(usuario_id: number) {
  try {
    return await apiGet(`/notificacoes/nao-lidas?usuario_id=${usuario_id}`);
  } catch {
    throw new Error("Erro ao buscar notificações não lidas");
  }
}

/*
   Buscar contador do sino
*/
export async function getContadorNotificacoes(usuario_id: number) {
  try {
    return await apiGet(`/notificacoes/contador?usuario_id=${usuario_id}`);
  } catch {
    throw new Error("Erro ao buscar contador de notificações");
  }
}

/*
   Marcar notificação como lida
*/
export async function marcarNotificacaoComoLida(id: number) {
  try {
    return await apiPatch(`/notificacoes/${id}/lida`);
  } catch {
    throw new Error("Erro ao marcar notificação como lida");
  }
}

/*
   Marcar todas como lidas
*/
export async function marcarTodasNotificacoesComoLidas(usuario_id: number) {
  try {
    return await apiPatch("/notificacoes/marcar-todas", { usuario_id });
  } catch {
    throw new Error("Erro ao marcar notificações como lidas");
  }
}

/*
   Excluir notificação
*/
export async function excluirNotificacao(id: number) {
  try {
    await apiDelete(`/notificacoes/${id}`);
    return true;
  } catch {
    throw new Error("Erro ao excluir notificação");
  }
}
