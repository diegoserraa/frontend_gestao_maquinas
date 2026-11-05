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

  // módulo "Monitoramento" independente: só aparece no dashboard quem foi
  // ativado manualmente aqui (ver pages/Monitoring/AdicionarMaquinas.tsx)
  monitoramento_ativo?: boolean;
  // preenchido só quando veio de "Vincular máquina do cliente" — cadastro
  // enxuto pra quem gerencia o próprio parque em outro sistema
  referencia_externa?: string | null;
  sistema_origem?: string | null;
  // sinal confiável de "veio desse fluxo" (referencia/sistema podem ficar em
  // branco mesmo numa máquina vinculada)
  vinculo_externo?: boolean;
};

export type NovoVinculoExterno = {
  nome: string;
  setor_id: number;
  referencia_externa?: string;
  sistema_origem?: string;
  observacao?: string;
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

export type PareamentoGerado = {
  codigo: string;
  expira_em: string;
};

export type EtiquetasResposta = {
  base_url: string;
  /** o endereço configurado é de teste (localhost, sem HTTPS...): o QR não serve para colar na máquina */
  endereco_de_teste: boolean;
  empresa: string | null;
  itens: Etiqueta[];
};
