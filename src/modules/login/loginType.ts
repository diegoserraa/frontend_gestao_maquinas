export type User = {
  id: number;
  nome: string;
  email: string;
  role: UserRole;
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