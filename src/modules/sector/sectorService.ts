import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/apiClient";

export async function getSectors() {
  return apiGet("/setores");
}

export async function createSector(payload: unknown) {
  return apiPost("/setores", payload);
}

export async function updateSector(id: number, payload: unknown) {
  return apiPut(`/setores/${id}`, payload);
}

export async function deleteSector(id: number) {
  return apiDelete(`/setores/${id}`);
}
