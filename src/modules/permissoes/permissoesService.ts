import { apiGet, apiPost, apiPut } from "@/lib/apiClient";
import type {
  Catalogo,
  MinhasPermissoes,
  PermissoesDoUsuario,
  RegistroAuditoria,
  ResultadoSalvar,
} from "./permissoesTypes";

export const getMinhasPermissoes = () => apiGet<MinhasPermissoes>("/permissoes/eu");

export const getCatalogo = () => apiGet<Catalogo>("/permissoes/catalogo");

export const getPermissoesDoUsuario = (usuarioId: number) =>
  apiGet<PermissoesDoUsuario>(`/permissoes/usuarios/${usuarioId}`);

export const salvarPermissoesDoUsuario = (usuarioId: number, permissoes: string[]) =>
  apiPut<ResultadoSalvar>(`/permissoes/usuarios/${usuarioId}`, { permissoes });

export const restaurarPadraoDoUsuario = (usuarioId: number) =>
  apiPost<ResultadoSalvar>(`/permissoes/usuarios/${usuarioId}/restaurar-padrao`);

export const getAuditoriaDoUsuario = (usuarioId: number, limite = 30) =>
  apiGet<RegistroAuditoria[]>(`/permissoes/auditoria?usuario=${usuarioId}&limite=${limite}`);
