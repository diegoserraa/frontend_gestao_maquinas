const API_URL = import.meta.env.VITE_API_URL;

/* =========================
   MACHINE
========================= */

export async function getMachineById(id: number) {
  const res = await fetch(`${API_URL}/maquinas/${id}`);
  return res.json();
}

/* =========================
   ORDENS DE SERVIÇO
========================= */

export async function getOrdensByMachineId(id: number) {
  const res = await fetch(`${API_URL}/maquinas/${id}/os`);

  if (!res.ok) {
    throw new Error("Erro ao buscar ordens de serviço");
  }

  return res.json();
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
  const res = await fetch(`${API_URL}/ordens-servico/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error("Erro ao atualizar status da OS");
  }

  return res.json();
}

/* =========================
   CREATE ORDEM DE SERVIÇO
========================= */

export async function createOrdemServico(data: {
  maquina_id: number;
  descricao: string;
  status: "ABERTA";
  tipo_manutencao: "CORRETIVA" | "PREVENTIVA" | "PREDITIVA";
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
  id_tecnico?: number | null;
  resolucao?: string;
}) {
  const res = await fetch(`${API_URL}/ordens-servico`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Erro ao criar ordem de serviço");
  }

  return res.json();
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
  const res = await fetch(`${API_URL}/ordens-servico/${osId}/atribuir`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_tecnico, id_atribuido_por }),
  });

  if (!res.ok) throw new Error("Erro ao atribuir técnico");
  return res.json();
}

/* =========================
   INICIAR ATENDIMENTO
========================= */
export async function iniciarAtendimentoOS(osId: number) {
  const res = await fetch(`${API_URL}/ordens-servico/${osId}/iniciar`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error("Erro ao iniciar atendimento");
  return res.json();
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
  const res = await fetch(`${API_URL}/ordens-servico/${osId}/finalizar`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resolucao,
      valor_gasto: valorGasto ?? null,
      ...(parceiro
        ? {
            id_parceiro: parceiro.id_parceiro,
            valor_parceiro: parceiro.valor_parceiro,
          }
        : {}),
    }),
  });

  if (!res.ok) throw new Error("Erro ao finalizar OS");
  return res.json();
}

/* =========================
   CANCELAR OS
========================= */
export async function cancelarOS(osId: number, motivo_cancelamento: string) {
  const res = await fetch(`${API_URL}/ordens-servico/${osId}/cancelar`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motivo_cancelamento }),
  });

  if (!res.ok) throw new Error("Erro ao cancelar OS");
  return res.json();
}

export async function listarTecnicos() {
  const res = await fetch(`${API_URL}/usuarios/tecnicos`);
  if (!res.ok) {
    throw new Error("Erro ao buscar técnicos");
  }
  return res.json();
}
