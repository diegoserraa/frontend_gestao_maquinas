export type User = {
  id: number;
  nome: string;
  email: string;
  role: "ADMIN" | "GESTOR" | "TECNICO" | "OPERADOR";
  ativo: boolean;
  created_at: string;
};

/** O que quem está logado pode fazer com um funcionário específico da lista. */
export type AcoesDaLinhaUsuario = {
  editar: boolean;
  alternar: boolean;
  excluir: boolean;
  permissoes: boolean;
};
