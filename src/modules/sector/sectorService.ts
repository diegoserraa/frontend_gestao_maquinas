const API_URL = import.meta.env.VITE_API_URL;

export async function getSectors() {
  const res = await fetch(`${API_URL}/setores`);
  return res.json();
}

export async function createSector(payload: unknown) {
  return fetch(`${API_URL}/setores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateSector(id: number, payload: unknown) {
  return fetch(`${API_URL}/setores/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteSector(id: number) {
  return fetch(`${API_URL}/setores/${id}`, {
    method: "DELETE" as const,
  });
}