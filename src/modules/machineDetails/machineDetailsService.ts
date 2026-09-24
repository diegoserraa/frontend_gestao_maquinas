import { apiGet } from "@/lib/apiClient";

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

export interface IndicadoresPorMaquina {
  osAbertas: number;
  mttrSegundos: number | null;
  mtbfSegundos: number | null;
  tempoAtendimentoSegundos: number | null;
  // soma das pausas de todas as O.S. da máquina e quantas estão pausadas agora
  tempoPausadoSegundos: number;
  osPausadas: number;
}

export async function getIndicadoresPorMaquina(
  maquinaId: number
): Promise<IndicadoresPorMaquina> {
  return apiGet<IndicadoresPorMaquina>(`/ordens-servico/maquina/${maquinaId}/indicadores`);
}
