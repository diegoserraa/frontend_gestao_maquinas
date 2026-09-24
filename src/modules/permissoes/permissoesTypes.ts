export type TipoFuncionario = "GESTOR" | "TECNICO" | "OPERADOR";

export type AcaoCatalogo = {
  permissao: string;
  rotulo: string;
  descricao: string;
  /** precisam estar ligadas junto (todas) */
  requer: string[];
  /** basta uma delas ligada */
  requerUmDe: string[];
};

export type ModuloCatalogo = {
  chave: string;
  rotulo: string;
  descricao: string;
  /** permissão que representa "acessar a tela" */
  acesso: string;
  acoes: AcaoCatalogo[];
};

export type Catalogo = {
  modulos: ModuloCatalogo[];
  padroes: Record<TipoFuncionario, string[]>;
};

export type PermissoesDoUsuario = {
  usuario: { id: number; nome: string; email: string; role: string; ativo: boolean };
  permissoes: string[];
  /** o que quem está editando pode ligar/desligar (o que ele mesmo possui) */
  concedivel: string[];
  padrao: string[];
};

export type ResultadoSalvar = {
  permissoes: string[];
  adicionadasPorDependencia: string[];
};

export type RegistroAuditoria = {
  id: number;
  acao: "definir" | "restaurar_padrao" | "criacao" | "mudanca_de_tipo" | string;
  alterado_por: number | null;
  alterado_por_nome: string | null;
  usuario_alvo: number | null;
  usuario_alvo_nome: string | null;
  antes: string[];
  depois: string[];
  criado_em: string;
};

export type MinhasPermissoes = {
  usuario: { id: number; role: string };
  permissoes: string[];
};

/** Quais ações de uma linha (editar/excluir/ativar) devem aparecer nos botões. Sem a chave = aparece. */
export type AcoesPermitidas = {
  editar?: boolean;
  excluir?: boolean;
  alternar?: boolean;
};
