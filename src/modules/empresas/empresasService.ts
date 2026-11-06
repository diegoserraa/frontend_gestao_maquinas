import { apiGet, apiPatch, apiPost } from "@/lib/apiClient";
import type { DadosCadastrais, DetalheEmpresa, EmpresaCriada, ListaEmpresas, NovaEmpresa } from "./empresasTypes";

/** Painel do administrador. O servidor só responde a quem é o dono do sistema. */

export const listarEmpresas = (): Promise<ListaEmpresas> => apiGet<ListaEmpresas>("/admin/empresas");

export const detalharEmpresa = (id: string): Promise<DetalheEmpresa> =>
  apiGet<DetalheEmpresa>(`/admin/empresas/${id}`);

export const criarEmpresa = (dados: NovaEmpresa): Promise<EmpresaCriada> =>
  apiPost<EmpresaCriada>("/admin/empresas", dados);

export const editarEmpresa = (id: string, dados: DadosCadastrais): Promise<DetalheEmpresa> =>
  apiPatch<DetalheEmpresa>(`/admin/empresas/${id}`, dados);

export const definirSituacaoEmpresa = (id: string, ativo: boolean, motivo?: string): Promise<DetalheEmpresa> =>
  apiPatch<DetalheEmpresa>(`/admin/empresas/${id}/situacao`, { ativo, motivo: motivo?.trim() || undefined });
