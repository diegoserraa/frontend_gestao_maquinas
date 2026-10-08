import type { EmpresaResumo } from "./empresasTypes";

/** Empresa de mentira para os testes. */
export const empresa = (extra: Partial<EmpresaResumo> = {}): EmpresaResumo => ({
  id: "id",
  nome: "Metalúrgica Silva",
  razao_social: "Silva Indústria Metalúrgica LTDA",
  cnpj: "11222333000181",
  sem_cnpj: false,
  plano: "BASICO",
  ativo: true,
  criado_em: "2026-01-01T00:00:00Z",
  inicio_contrato: null,
  telefone: null,
  email_cobranca: null,
  cidade: "Campinas",
  uf: "SP",
  inativada_em: null,
  motivo_inativacao: null,
  ultimo_acesso: null,
  ...extra,
});
