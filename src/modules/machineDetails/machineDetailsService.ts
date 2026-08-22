const API_URL = import.meta.env.VITE_API_URL;

/* MACHINE */
export async function getMachineById(id: number) {
  const res = await fetch(`${API_URL}/maquinas/${id}`);
  return res.json();
}

/* OS */
export async function getOrdensByMachineId(id: number) {
  const res = await fetch(
    `${API_URL}/maquinas/${id}/os`
  );

  if (!res.ok) {
    throw new Error("Erro ao buscar ordens de serviço");
  }

  return res.json();
}

export async function updateOSStatus(id: number, status: string) {
  return fetch(`${API_URL}/ordens-servico/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
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
  const response = await fetch(
    `${API_URL}/ordens-servico/maquina/${maquinaId}/indicadores`
  );

  return response.json();
}