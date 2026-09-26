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

/** Uma etiqueta para imprimir (o QR já vem pronto do servidor, gerado com o endereço atual do sistema). */
export type Etiqueta = {
  id: number;
  nome: string;
  setor: string | null;
  url: string;
  /** imagem PNG em data URL */
  qr: string;
};

export type EtiquetasResposta = {
  base_url: string;
  /** o endereço configurado é de teste (localhost, sem HTTPS...): o QR não serve para colar na máquina */
  endereco_de_teste: boolean;
  empresa: string | null;
  itens: Etiqueta[];
};
