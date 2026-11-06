/**
 * Painel do administrador (dono do sistema): empresas clientes.
 * Só identificação e cobrança — o painel não mostra nada da operação do cliente (máquinas, O.S., usuários...).
 */

export type Plano = "BASICO" | "PROFISSIONAL" | "EMPRESARIAL";

export type EmpresaResumo = {
  id: string;
  nome: string;
  razao_social: string | null;
  /** só dígitos (14); a tela formata */
  cnpj: string | null;
  sem_cnpj: boolean;
  plano: Plano | null;
  ativo: boolean;
  criado_em: string;
  /** AAAA-MM-DD */
  inicio_contrato: string | null;
  telefone: string | null;
  email_cobranca: string | null;
  cidade: string | null;
  uf: string | null;
  inativada_em: string | null;
  motivo_inativacao: string | null;
  ultimo_acesso: string | null;
};

export type EmpresaCompleta = EmpresaResumo & { observacoes: string | null };

export type ListaEmpresas = {
  empresas: EmpresaResumo[];
};

/** Quem administra a empresa: para o dono saber com quem falar. */
export type GestorDaEmpresa = {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  ativo: boolean;
  ultimo_acesso: string | null;
};

export type DetalheEmpresa = {
  empresa: EmpresaCompleta;
  gestores: GestorDaEmpresa[];
};

/** Dados cadastrais enviados ao criar ou editar (cnpj só dígitos). */
export type DadosCadastrais = {
  nome: string;
  razao_social?: string;
  cnpj?: string;
  sem_cnpj: boolean;
  telefone?: string;
  email_cobranca?: string;
  cidade?: string;
  uf?: string;
  plano?: Plano;
  inicio_contrato?: string;
  observacoes?: string;
};

export type NovaEmpresa = DadosCadastrais & {
  gestor: { nome: string; email: string; telefone?: string };
};

export type EmpresaCriada = {
  empresa: { id: string; nome: string; ativo: boolean; criado_em: string };
  gestor: { id: number; nome: string; email: string; role: string };
  /** aparece UMA vez, só na resposta da criação */
  senha_temporaria: string;
};

export type FiltroSituacao = "todas" | "ativas" | "inativas";
