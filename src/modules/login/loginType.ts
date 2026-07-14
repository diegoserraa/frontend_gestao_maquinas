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
};

export type UserRole =
  | "ADMIN"
  | "GESTOR"
  | "TECNICO"
  | "OPERADOR";