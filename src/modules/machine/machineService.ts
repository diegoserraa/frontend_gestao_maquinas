import type { Machine } from "./machineTypes";

const API_URL = import.meta.env.VITE_API_URL;

export async function getMachines(): Promise<Machine[]> {
  const response = await fetch(`${API_URL}/maquinas`);
  return response.json();
}

export async function getSectors() {
  const response = await fetch(`${API_URL}/setores`);
  return response.json();
}

export async function createMachine(payload: any): Promise<Machine> {
  const formData = new FormData();

  formData.append("nome", payload.nome);
  formData.append("modelo", payload.modelo);
  formData.append("fabricante", payload.fabricante);
  formData.append("ano", String(payload.ano));
  formData.append("status", payload.status);
  formData.append("setor_id", String(payload.setor_id));
  formData.append("intervalo_manutencao_dias", String(payload.intervalo_manutencao_dias));

  if (payload.imagem) {
    formData.append("imagem", payload.imagem);
  }

  const res = await fetch(`${API_URL}/maquinas`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Erro ao criar máquina");

  return res.json();
}

export async function updateMachine(id: number, payload: any): Promise<Machine> {
  const formData = new FormData();

  formData.append("nome", payload.nome);
  formData.append("modelo", payload.modelo);
  formData.append("fabricante", payload.fabricante);
  formData.append("ano", String(payload.ano));
  formData.append("status", payload.status);
  formData.append("setor_id", String(payload.setor_id));
  formData.append("intervalo_manutencao_dias", String(payload.intervalo_manutencao_dias));

  if (payload.imagem) {
    formData.append("imagem", payload.imagem);
  }

  const res = await fetch(`${API_URL}/maquinas/${id}`, {
    method: "PUT",
    body: formData,
  });

  if (!res.ok) throw new Error("Erro ao atualizar máquina");

  return res.json();
}

export async function deleteMachine(id: number) {
  return fetch(`${API_URL}/maquinas/${id}`, { method: "DELETE" });
}

export async function toggleMachineStatus(id: number) {
  const response = await fetch(`${API_URL}/maquinas/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) throw new Error("Erro ao alterar status da máquina");

  return response.json();
}