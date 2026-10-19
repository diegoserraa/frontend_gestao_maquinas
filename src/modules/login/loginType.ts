export type User = {
  id: number;
  nome: string;
  email: string;
  role: UserRole;
  /** conta criada pelo painel do administrador: precisa trocar a senha temporária antes de usar o sistema */
  deve_trocar_senha?: boolean;
};


export type LoginPayload = {
  email: string;
  senha: string;
};


export type LoginResponse = {
  token: string;
  user: User;
  /** o que o funcionário pode acessar e fazer (definido pelo gestor da empresa) */
  permissoes: string[];
};

export type UserRole =
  | "ADMIN"
  | "GESTOR"
  | "TECNICO"
  | "OPERADOR";