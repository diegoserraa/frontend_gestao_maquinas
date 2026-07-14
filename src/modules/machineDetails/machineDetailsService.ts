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