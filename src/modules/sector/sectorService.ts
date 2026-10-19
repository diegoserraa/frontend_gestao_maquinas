import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/apiClient";
import type { Sector } from "./setorTypes";

export async function getSectors(): Promise<Sector[]> {
  return apiGet<Sector[]>("/setores");
}

export async function createSector(payload: unknown): Promise<Sector> {
  return apiPost<Sector>("/setores", payload);
}

export async function updateSector(id: number, payload: unknown): Promise<Sector> {
  return apiPut<Sector>(`/setores/${id}`, payload);
}

export async function deleteSector(id: number): Promise<void> {
  return apiDelete(`/setores/${id}`);
}
