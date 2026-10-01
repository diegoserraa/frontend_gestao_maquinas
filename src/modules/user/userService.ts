import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/apiClient";
import type { User } from "./userType";

export async function getUsers(): Promise<User[]> {
  return apiGet<User[]>("/usuarios");
}

export async function createUser(payload: unknown): Promise<User> {
  return apiPost<User>("/usuarios", payload);
}

export async function updateUser(id: number, payload: unknown): Promise<User> {
  return apiPut<User>(`/usuarios/${id}`, payload);
}

export async function toggleUserStatus(id: number): Promise<User> {
  return apiPatch<User>(`/usuarios/${id}/toggle-status`);
}

export async function deleteUser(id: number): Promise<void> {
  return apiDelete(`/usuarios/${id}`);
}
