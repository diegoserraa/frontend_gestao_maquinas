import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/apiClient";

export async function getPartners() {
  return apiGet("/parceiros");
}

export async function createPartner(payload: unknown) {
  return apiPost("/parceiros", payload);
}

export async function updatePartner(id: number, payload: unknown) {
  return apiPut(`/parceiros/${id}`, payload);
}

export async function deletePartner(id: number) {
  return apiDelete(`/parceiros/${id}`);
}
