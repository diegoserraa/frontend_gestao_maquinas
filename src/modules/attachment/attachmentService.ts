import { apiGet, apiUpload, apiDelete } from "@/lib/apiClient";
import type { Anexo } from "./attachmentTypes";

export async function getAttachmentById(id: number): Promise<Anexo> {
  return apiGet<Anexo>(`/anexos/${id}`);
}

export async function getMachineAttachments(machineId: number): Promise<Anexo[]> {
  return apiGet<Anexo[]>(`/anexos/maquina/${machineId}`);
}

export async function getOSAttachments(osId: number): Promise<Anexo[]> {
  return apiGet<Anexo[]>(`/anexos/os/${osId}`);
}

async function uploadAnexo(formData: FormData): Promise<Anexo> {
  try {
    return await apiUpload<Anexo>("/anexos/upload", formData);
  } catch {
    throw new Error("Erro ao enviar anexo");
  }
}

export async function uploadMachineAttachment(machineId: number, file: File): Promise<Anexo> {
  const formData = new FormData();
  formData.append("arquivo", file);
  formData.append("origem", "MAQUINA");
  formData.append("maquina_id", String(machineId));
  return uploadAnexo(formData);
}

export async function uploadOSAberturaAttachment(osId: number, file: File): Promise<Anexo> {
  const formData = new FormData();
  formData.append("arquivo", file);
  formData.append("origem", "OS_ABERTURA");
  formData.append("ordem_servico_id", String(osId));
  return uploadAnexo(formData);
}

export async function uploadOSFechamentoAttachment(osId: number, file: File): Promise<Anexo> {
  const formData = new FormData();
  formData.append("arquivo", file);
  formData.append("origem", "OS_FECHAMENTO");
  formData.append("ordem_servico_id", String(osId));
  return uploadAnexo(formData);
}

export async function deleteAttachment(id: number) {
  try {
    return await apiDelete(`/anexos/${id}`);
  } catch {
    throw new Error("Erro ao excluir anexo");
  }
}

export async function uploadMachineAttachments(machineId: number, files: File[]) {
  return Promise.all(
    files.map((file) => uploadMachineAttachment(machineId, file))
  );
}
