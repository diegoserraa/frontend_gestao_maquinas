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
  /** permissões que o tipo NÃO pode ter (ex.: gestor não assume/inicia/pausa O.S.): a tela esconde essas opções */
  vedadas?: Partial<Record<TipoFuncionario, string[]>>;
};

export type PermissoesDoUsuario = {
  usuario: { id: number; nome: string; email: string; role: string; ativo: boolean };
  permissoes: string[];
  /** true = ajuste individual: as alterações em grupo não mexem neste funcionário */
  personalizado: boolean;
  /** o que quem está editando pode ligar/desligar (o que ele mesmo possui) */
  concedivel: string[];
  padrao: string[];
};

export type ResultadoSalvar = {
  permissoes: string[];
  adicionadasPorDependencia: string[];
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

/* ---------- permissões em grupo ---------- */

export type AcaoEmGrupo = "dar" | "retirar";

export type AlvoEmGrupo = { tipo: TipoFuncionario } | { usuarios: number[] };

export type PedidoEmGrupo = {
  acao: AcaoEmGrupo;
  permissoes: string[];
  alvo: AlvoEmGrupo;
};

export type MotivoIgnorado = "ajuste_individual" | "sem_mudanca" | "fora_do_seu_limite";

export type ResultadoEmGrupo = {
  simulado: boolean;
  total: number;
  alterados: { id: number; nome: string }[];
  ignorados: { id: number; nome: string; motivo: MotivoIgnorado }[];
};
