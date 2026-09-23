import { apiGet, apiPost, apiPatch } from "@/lib/apiClient";

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
   UPDATE STATUS OS
========================= */

export async function updateOSStatus(id: number, status: string) {
  try {
    return await apiPatch(`/ordens-servico/${id}/status`, { status });
  } catch {
    throw new Error("Erro ao atualizar status da OS");
  }
}

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
   Usado tanto pra técnico interno quanto pra marcar "técnico externo"
   (nesse caso, id_tecnico = ID_TECNICO_EXTERNO, ver ordemServicoConstants.ts)
========================= */
export async function atribuirTecnicoOS(
  osId: number,
  id_tecnico: number,
  id_atribuido_por: number
) {
  try {
    return await apiPatch(`/ordens-servico/${osId}/atribuir`, { id_tecnico, id_atribuido_por });
  } catch {
    throw new Error("Erro ao atribuir técnico");
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
