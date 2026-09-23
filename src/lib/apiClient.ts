/**
 * Cliente HTTP único da API. Antes, cada um dos módulos em src/modules/*
 * fazia fetch() por conta própria, com pequenas diferenças de headers e
 * tratamento de erro entre eles — um lugar só facilita manutenção e
 * mantém o comportamento consistente (parse de erro, JSON, etc.).
 *
 * O header Authorization é anexado automaticamente por src/lib/authFetch.ts
 * (que substitui o window.fetch global), então não precisa ser tratado
 * aqui — este cliente só cuida de montar a URL, o corpo da requisição e
 * interpretar a resposta.
 */

const API_URL = import.meta.env.VITE_API_URL;

async function tratarResposta<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let mensagem = `Erro ${res.status}`;

    try {
      const corpo = await res.json();
      mensagem = corpo?.message || corpo?.error || mensagem;
    } catch {
      // resposta sem corpo JSON (ex.: página de erro em HTML) — mantém a mensagem genérica
    }

    throw new Error(mensagem);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

function montarUrl(path: string): string {
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(montarUrl(path));
  return tratarResposta<T>(res);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(montarUrl(path), {
    method: "POST",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return tratarResposta<T>(res);
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(montarUrl(path), {
    method: "PUT",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return tratarResposta<T>(res);
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(montarUrl(path), {
    method: "PATCH",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return tratarResposta<T>(res);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(montarUrl(path), { method: "DELETE" });
  return tratarResposta<T>(res);
}

/** Upload multipart — nunca define Content-Type manualmente (o browser
 * precisa gerar o boundary do multipart sozinho). */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  method: "POST" | "PUT" = "POST"
): Promise<T> {
  const res = await fetch(montarUrl(path), { method, body: formData });
  return tratarResposta<T>(res);
}
