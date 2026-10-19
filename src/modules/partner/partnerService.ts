import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/apiClient";
import type { Partner } from "./partnerTypes";

export async function getPartners(): Promise<Partner[]> {
  return apiGet<Partner[]>("/parceiros");
}

export async function createPartner(payload: unknown): Promise<Partner> {
  return apiPost<Partner>("/parceiros", payload);
}

export async function updatePartner(id: number, payload: unknown): Promise<Partner> {
  return apiPut<Partner>(`/parceiros/${id}`, payload);
}

export async function deletePartner(id: number): Promise<void> {
  return apiDelete(`/parceiros/${id}`);
}
