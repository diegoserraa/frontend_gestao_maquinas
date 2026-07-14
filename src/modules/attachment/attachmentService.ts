import type { Anexo } from "./attachmentTypes";

const API_URL = import.meta.env.VITE_API_URL;

export async function getAttachmentById(
  id: number
): Promise<Anexo> {
  const response = await fetch(
    `${API_URL}/anexos/${id}`
  );

  return response.json();
}

export async function getMachineAttachments(
  machineId: number
): Promise<Anexo[]> {
  const response = await fetch(
    `${API_URL}/anexos/maquina/${machineId}`
  );

  return response.json();
}

export async function getOSAttachments(
  osId: number
): Promise<Anexo[]> {
  const response = await fetch(
    `${API_URL}/anexos/os/${osId}`
  );

  return response.json();
}

export async function uploadMachineAttachment(
  machineId: number,
  file: File
): Promise<Anexo> {
  const formData = new FormData();

  formData.append(
    "arquivo",
    file
  );

  formData.append(
    "origem",
    "MAQUINA"
  );

  formData.append(
    "maquina_id",
    String(machineId)
  );

  const response = await fetch(
    `${API_URL}/anexos/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(
      "Erro ao enviar anexo"
    );
  }

  return response.json();
}

export async function uploadOSAberturaAttachment(
  osId: number,
  file: File
): Promise<Anexo> {
  const formData = new FormData();

  formData.append(
    "arquivo",
    file
  );

  formData.append(
    "origem",
    "OS_ABERTURA"
  );

  formData.append(
    "ordem_servico_id",
    String(osId)
  );

  const response = await fetch(
    `${API_URL}/anexos/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(
      "Erro ao enviar anexo"
    );
  }

  return response.json();
}

export async function uploadOSFechamentoAttachment(
  osId: number,
  file: File
): Promise<Anexo> {
  const formData = new FormData();

  formData.append(
    "arquivo",
    file
  );

  formData.append(
    "origem",
    "OS_FECHAMENTO"
  );

  formData.append(
    "ordem_servico_id",
    String(osId)
  );

  const response = await fetch(
    `${API_URL}/anexos/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(
      "Erro ao enviar anexo"
    );
  }

  return response.json();
}

export async function deleteAttachment(
  id: number
) {
  const response = await fetch(
    `${API_URL}/anexos/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Erro ao excluir anexo"
    );
  }
}

export async function uploadMachineAttachments(
  machineId: number,
  files: File[]
) {
  return Promise.all(
    files.map((file) =>
      uploadMachineAttachment(
        machineId,
        file
      )
    )
  );
}