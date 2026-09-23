import { apiGet, apiPatch } from "@/lib/apiClient";

/* MACHINE */
export async function getMachineById(id: number) {
  return apiGet(`/maquinas/${id}`);
}

/* OS */
export async function getOrdensByMachineId(id: number) {
  try {
    return await apiGet(`/maquinas/${id}/os`);
  } catch {
    throw new Error("Erro ao buscar ordens de serviço");
  }
}

export async function updateOSStatus(id: number, status: string) {
  return apiPatch(`/ordens-servico/${id}/status`, { status });
}

export interface IndicadoresPorMaquina {
  osAbertas: number;
  mttrSegundos: number | null;
  mtbfSegundos: number | null;
  tempoAtendimentoSegundos: number | null;
}

export async function getIndicadoresPorMaquina(
  maquinaId: number
): Promise<IndicadoresPorMaquina> {
  return apiGet<IndicadoresPorMaquina>(`/ordens-servico/maquina/${maquinaId}/indicadores`);
}
