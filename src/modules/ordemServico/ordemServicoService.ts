import { apiGet, apiPost, apiPatch } from "@/lib/apiClient";
import type { PausaOS } from "./pausaOSLogica";

/* =========================
   MACHINE
========================= */

export async function getMachineById(id: number) {
  return apiGet(`/maquinas/${id}`);
}

/* =========================
   ORDENS DE SERVIÇO
========================= */

export async function getOrdensByMachineId(id: number) {
  try {
    return await apiGet(`/maquinas/${id}/os`);
  } catch {
    throw new Error("Erro ao buscar ordens de serviço");
  }
}

/* =========================
   CREATE ORDEM DE SERVIÇO
========================= */

export type OrdemServicoFormData = {
  maquina_id: number;
  descricao: string;
  status: "ABERTA";
  tipo_manutencao: "CORRETIVA" | "PREVENTIVA" | "PREDITIVA";
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
  id_tecnico?: number | null;
  resolucao?: string;
};

/* =========================
   CREATE ORDEM DE SERVIÇO
========================= */

export async function createOrdemServico(data: {
  id_solicitante?: number;
  maquina_id: number;
  descricao: string;
  status: "ABERTA";
  tipo_manutencao: "CORRETIVA" | "PREVENTIVA" | "PREDITIVA";
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
  id_tecnico?: number | null;
  resolucao?: string;
}) {
  try {
    return await apiPost("/ordens-servico", data);
  } catch {
    throw new Error("Erro ao criar ordem de serviço");
  }
}

/* =========================
   ATRIBUIR TÉCNICO
   Quem atribuiu é identificado pelo backend a partir do token.
========================= */
export async function atribuirTecnicoOS(osId: number, id_tecnico: number) {
  try {
    return await apiPatch(`/ordens-servico/${osId}/atribuir`, { id_tecnico });
  } catch {
    throw new Error("Erro ao atribuir técnico");
  }
}

/* =========================
   MARCAR COMO EXECUÇÃO EXTERNA (parceiro)
   Não há técnico: a O.S. é marcada com execucao_externa no backend.
========================= */
export async function atribuirExternoOS(osId: number) {
  try {
    return await apiPatch(`/ordens-servico/${osId}/atribuir`, { externo: true });
  } catch {
    throw new Error("Erro ao definir técnico externo");
  }
}

/* =========================
   INICIAR ATENDIMENTO
========================= */
export async function iniciarAtendimentoOS(osId: number) {
  try {
    return await apiPatch(`/ordens-servico/${osId}/iniciar`);
  } catch {
    throw new Error("Erro ao iniciar atendimento");
  }
}

/* =========================
   PAUSAR / RETOMAR
   O motivo da pausa é obrigatório; o tempo parado não conta como tempo de reparo.
========================= */
export async function pausarOS(osId: number, motivo: string) {
  try {
    return await apiPatch(`/ordens-servico/${osId}/pausar`, { motivo });
  } catch {
    throw new Error("Erro ao pausar OS");
  }
}

export async function retomarOS(osId: number) {
  try {
    return await apiPatch(`/ordens-servico/${osId}/retomar`);
  } catch {
    throw new Error("Erro ao retomar OS");
  }
}

// histórico de pausas (linha do tempo)
export async function listarPausasOS(osId: number): Promise<PausaOS[]> {
  try {
    return await apiGet<PausaOS[]>(`/ordens-servico/${osId}/pausas`);
  } catch {
    throw new Error("Erro ao buscar o histórico de pausas");
  }
}

/* =========================
   FINALIZAR OS
   Quando a OS é de técnico externo, envia id_parceiro e valor_parceiro
   junto com resolução e valor_gasto.
========================= */
export async function finalizarOS(
  osId: number,
  resolucao: string,
  valorGasto?: number,
  parceiro?: { id_parceiro: number; valor_parceiro: number } | null
) {
  try {
    return await apiPatch(`/ordens-servico/${osId}/finalizar`, {
      resolucao,
      valor_gasto: valorGasto ?? null,
      ...(parceiro
        ? {
            id_parceiro: parceiro.id_parceiro,
            valor_parceiro: parceiro.valor_parceiro,
          }
        : {}),
    });
  } catch {
    throw new Error("Erro ao finalizar OS");
  }
}

/* =========================
   CANCELAR OS
========================= */
export async function cancelarOS(osId: number, motivo_cancelamento: string) {
  try {
    return await apiPatch(`/ordens-servico/${osId}/cancelar`, { motivo_cancelamento });
  } catch {
    throw new Error("Erro ao cancelar OS");
  }
}

export async function listarTecnicos() {
  try {
    return await apiGet("/usuarios/tecnicos");
  } catch {
    throw new Error("Erro ao buscar técnicos");
  }
}

export async function getOrdemServicoById(id: number) {
  try {
    return await apiGet(`/ordens-servico/${id}`);
  } catch {
    throw new Error("Erro ao buscar ordem de serviço");
  }
}
