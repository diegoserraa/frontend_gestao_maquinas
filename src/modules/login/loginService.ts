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
  } catch {
    throw new Error("Usuário ou senha inválidos");
  }
}
