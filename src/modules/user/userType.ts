export type User = {
  id: number;
  nome: string;
  email: string;
  role: "ADMIN" | "GESTOR" | "TECNICO" | "OPERADOR";
  ativo: boolean;
  created_at: string;
};