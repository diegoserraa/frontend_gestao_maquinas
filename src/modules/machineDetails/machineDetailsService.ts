import { apiGet } from "@/lib/apiClient";

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
