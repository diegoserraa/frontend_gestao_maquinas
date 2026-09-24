import { apiPost } from "@/lib/apiClient";
import type {
  LoginPayload,
  LoginResponse,
} from "./loginType";

export async function login(
  payload: LoginPayload
): Promise<LoginResponse> {
  try {
    return await apiPost<LoginResponse>("/auth/login", payload);
  } catch (erro) {
    // usuário desativado pelo gestor: a mensagem do servidor é útil, as outras ficam genéricas
    if (erro instanceof Error && /inativo/i.test(erro.message)) throw erro;

    throw new Error("Usuário ou senha inválidos");
  }
}
