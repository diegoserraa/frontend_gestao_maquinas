import { apiGet, apiUpload, apiDelete } from "@/lib/apiClient";
import type { Anexo } from "./attachmentTypes";

/**
 * Baixa o arquivo de verdade (não só abre em outra aba). `url_arquivo` aponta pro
 * bucket de storage (outra origem), então um <a href download> simples não é confiável
 * — o navegador só respeita o atributo `download` em link same-origin, ou quando o
 * servidor manda "Content-Disposition: attachment" (o bucket normalmente não manda).
 * Buscando como blob e criando uma URL local, o download funciona sempre.
 */
export async function baixarAnexo(anexo: Anexo): Promise<void> {
  const res = await fetch(anexo.url_arquivo);
  if (!res.ok) throw new Error("Não foi possível baixar o arquivo");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = anexo.nome_arquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // revoga só depois de um tempo: o navegador processa o download de forma assíncrona,
  // e revogar a URL logo em seguida corre o risco de apagar o blob antes dele terminar
  // de ler os bytes (download falha silenciosamente, sem nenhum erro no console)
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
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
