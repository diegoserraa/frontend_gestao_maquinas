export type Setor = {
  id: number;
  nome: string;
};

export type Machine = {
  id: number;
  nome: string;
  modelo: string;
  fabricante: string;
  ano: number;

  status: string;

  qr_code?: string | null;

  setor_id: number;
  setor?: Setor;

  intervalo_manutencao_dias: number;

  ultima_manutencao?: string | null;
  proxima_manutencao?: string | null;
  imagem_url?: string | null;
};