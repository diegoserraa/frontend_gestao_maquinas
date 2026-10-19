import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/apiClient";
import type { NovoPlanoManutencao, PlanoManutencao, ResultadoClonagemPlanos } from "./planoManutencaoTypes";

export const listarPlanosManutencao = (maquinaId: number) =>
  apiGet<PlanoManutencao[]>(`/maquinas/${maquinaId}/planos-manutencao`);

export const criarPlanoManutencao = (maquinaId: number, dados: NovoPlanoManutencao) =>
  apiPost<PlanoManutencao>(`/maquinas/${maquinaId}/planos-manutencao`, dados);

export const atualizarPlanoManutencao = (maquinaId: number, planoId: number, dados: NovoPlanoManutencao) =>
  apiPut<PlanoManutencao>(`/maquinas/${maquinaId}/planos-manutencao/${planoId}`, dados);

export const excluirPlanoManutencao = (maquinaId: number, planoId: number) =>
  apiDelete(`/maquinas/${maquinaId}/planos-manutencao/${planoId}`);

/** "Aproveitar plano de manutenção" — copia os planos ativos de outra máquina pra esta. */
export const clonarPlanosManutencao = (maquinaId: number, maquinaOrigemId: number) =>
  apiPost<ResultadoClonagemPlanos>(`/maquinas/${maquinaId}/planos-manutencao/clonar`, {
    maquina_origem_id: maquinaOrigemId,
  });
