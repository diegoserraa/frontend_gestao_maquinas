import { apiGet, apiUpload, apiDelete } from "@/lib/apiClient";
import { baixarArquivo } from "@/lib/baixarArquivo";
import type { Anexo } from "./attachmentTypes";

/**
 * Busca os bytes de um anexo. `url_arquivo` aponta pro bucket de storage (outra
 * origem), então baixar direto por link não é confiável — o navegador só respeita
 * o atributo `download` em link same-origin, ou quando o servidor manda
 * "Content-Disposition: attachment" (o bucket normalmente não manda). Buscando
 * como blob, o download funciona sempre, e o mesmo blob serve tanto pra salvar
 * o arquivo sozinho quanto pra empacotar vários num ZIP.
 */
export async function buscarAnexoBlob(anexo: Anexo): Promise<Blob> {
  const res = await fetch(anexo.url_arquivo);
  if (!res.ok) throw new Error(`Não foi possível baixar ${anexo.nome_arquivo}`);
  return res.blob();
}

/** Baixa um único anexo de verdade (não só abre em outra aba). */
export async function baixarAnexo(anexo: Anexo): Promise<void> {
  const blob = await buscarAnexoBlob(anexo);
  baixarArquivo(blob, anexo.nome_arquivo);
}

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

export async function deleteAttachment(id: number): Promise<void> {
  try {
    await apiDelete(`/anexos/${id}`);
  } catch {
    throw new Error("Erro ao excluir anexo");
  }
}

export async function uploadMachineAttachments(machineId: number, files: File[]) {
  return Promise.all(
    files.map((file) => uploadMachineAttachment(machineId, file))
  );
}
