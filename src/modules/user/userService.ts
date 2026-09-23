import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/apiClient";

export async function getUsers() {
  return apiGet("/usuarios");
}

export async function createUser(payload: unknown) {
  return apiPost("/usuarios", payload);
}

export async function updateUser(id: number, payload: unknown) {
  return apiPut(`/usuarios/${id}`, payload);
}

export async function toggleUserStatus(id: number) {
  return apiPatch(`/usuarios/${id}/toggle-status`);
}

export async function deleteUser(id: number) {
  return apiDelete(`/usuarios/${id}`);
}
