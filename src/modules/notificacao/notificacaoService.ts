import { apiGet, apiPatch, apiDelete } from "@/lib/apiClient";
import type { Notificacao } from "./notificacaoType";

/* =========================
   NOTIFICAÇÕES
========================= */

/*
   Buscar notificações do usuário
*/
export async function getNotificacoes(usuario_id: number): Promise<Notificacao[]> {
  try {
    return await apiGet<Notificacao[]>(`/notificacoes?usuario_id=${usuario_id}`);
  } catch {
    throw new Error("Erro ao buscar notificações");
  }
}

/*
   Buscar contador do sino
*/
export async function getContadorNotificacoes(usuario_id: number): Promise<{ total: number }> {
  try {
    return await apiGet<{ total: number }>(`/notificacoes/contador?usuario_id=${usuario_id}`);
  } catch {
    throw new Error("Erro ao buscar contador de notificações");
  }
}

/*
   Marcar notificação como lida
*/
export async function marcarNotificacaoComoLida(id: number): Promise<void> {
  try {
    await apiPatch(`/notificacoes/${id}/lida`);
  } catch {
    throw new Error("Erro ao marcar notificação como lida");
  }
}

/*
   Marcar todas como lidas
*/
export async function marcarTodasNotificacoesComoLidas(usuario_id: number): Promise<void> {
  try {
    await apiPatch("/notificacoes/marcar-todas", { usuario_id });
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
