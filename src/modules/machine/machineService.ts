import { apiGet, apiUpload, apiDelete, apiPatch } from "@/lib/apiClient";
import type { Machine } from "./machineTypes";

export async function getMachines(): Promise<Machine[]> {
  return apiGet<Machine[]>("/maquinas");
}

export async function getSectors() {
  return apiGet("/setores");
}

function montarFormData(payload: any): FormData {
  const formData = new FormData();

  formData.append("nome", payload.nome);
  formData.append("modelo", payload.modelo);
  formData.append("fabricante", payload.fabricante);
  formData.append("ano", String(payload.ano));
  formData.append("status", payload.status);
  formData.append("setor_id", String(payload.setor_id));
  formData.append("intervalo_manutencao_dias", String(payload.intervalo_manutencao_dias));
  formData.append("ultima_manutencao", payload.ultima_manutencao);

  if (payload.imagem) {
    formData.append("imagem", payload.imagem);
  }

  return formData;
}

export async function createMachine(payload: any): Promise<Machine> {
  try {
    return await apiUpload<Machine>("/maquinas", montarFormData(payload), "POST");
  } catch {
    throw new Error("Erro ao criar máquina");
  }
}

export async function updateMachine(id: number, payload: any): Promise<Machine> {
  try {
    return await apiUpload<Machine>(`/maquinas/${id}`, montarFormData(payload), "PUT");
  } catch {
    throw new Error("Erro ao atualizar máquina");
  }
}

export async function deleteMachine(id: number) {
  return apiDelete(`/maquinas/${id}`);
}

export async function toggleMachineStatus(id: number) {
  try {
    return await apiPatch(`/maquinas/${id}/status`);
  } catch {
    throw new Error("Erro ao alterar status da máquina");
  }
}
