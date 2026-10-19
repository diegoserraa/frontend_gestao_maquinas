import { apiGet, apiPost, apiPut } from "@/lib/apiClient";
import type {
  Catalogo,
  MinhasPermissoes,
  PedidoEmGrupo,
  PermissoesDoUsuario,
  ResultadoEmGrupo,
  ResultadoSalvar,
} from "./permissoesTypes";

export const getMinhasPermissoes = () => apiGet<MinhasPermissoes>("/permissoes/eu");

export const getCatalogo = () => apiGet<Catalogo>("/permissoes/catalogo");

export const getPermissoesDoUsuario = (usuarioId: number) =>
  apiGet<PermissoesDoUsuario>(`/permissoes/usuarios/${usuarioId}`);

export const salvarPermissoesDoUsuario = (usuarioId: number, permissoes: string[]) =>
  apiPut<ResultadoSalvar>(`/permissoes/usuarios/${usuarioId}`, { permissoes });

/** Volta o funcionário ao padrão do tipo e a seguir o grupo (remove o ajuste individual). */
export const restaurarPadraoDoUsuario = (usuarioId: number) =>
  apiPost<ResultadoSalvar>(`/permissoes/usuarios/${usuarioId}/restaurar-padrao`);

/** Dar ou retirar permissões de vários funcionários; com `simular` só mostra o que aconteceria. */
export const aplicarPermissoesEmGrupo = (pedido: PedidoEmGrupo, simular = false) =>
  apiPost<ResultadoEmGrupo>("/permissoes/em-grupo", { ...pedido, simular });
