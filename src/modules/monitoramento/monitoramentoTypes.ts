export type LimiteMetrica = {
  atencao: number | null;
  alarme: number | null;
  minimo: number | null;
};

export type TelemetriaAtual = {
  maquina_id: number;
  maquina_nome: string | null;
  imagem_url?: string | null;
  setor_id: number | null;
  setor_nome: string | null;
  status: string | null;

  temperatura: number | null;
  vibracao: number | null;
  horas_ligadas: number | null;

  atualizado_em: string | null;

  // limites configurados na tela da máquina (aba Parâmetros)
  limites?: Record<string, LimiteMetrica>;
};

export type TelemetriaLeitura = {
  id: number;
  maquina_id: number;
  temperatura: number | null;
  vibracao: number | null;
  horas_ligadas: number | null;
  recebido_em: string;
};

export type MqttStatus = {
  configurado: boolean;
  conectado: boolean;
  topico: string;
  ultimaMensagemEm: string | null;
};

/* Mensagens recebidas pelo WebSocket */
export type WsMensagem =
  | { type: "snapshot"; data: TelemetriaAtual[] }
  | { type: "telemetria"; data: TelemetriaAtual };

export type RealtimeStatus = "conectando" | "online" | "offline";

/* ================= Histórico agregado (gráfico principal) ================= */

export type FaixaHistorico = "1h" | "6h" | "24h" | "7d" | "30d";

export type MetricaHistorico = "temperatura" | "vibracao" | "horas_ligadas";

/**
 * Ponto já agregado por "balde" de tempo. É este o formato que o gráfico
 * consome — hoje vindo de mock, amanhã do banco (date_trunc + AVG/MIN/MAX).
 * Não mudar este shape sem mexer no gráfico.
 */
export type PontoAgregado = {
  instante: string; // ISO — início do balde
  media: number | null;
  minimo: number | null;
  maximo: number | null;
};

/* ================= Relatório (tela "Relatórios" do módulo) ================= */

export type TelemetriaLeituraComMaquina = TelemetriaLeitura & {
  maquina_nome: string | null;
  // limites configurados da máquina dessa leitura — usado pra colorir
  // atenção/crítico na tabela do relatório, mesma régua do resto do sistema
  limites?: Record<string, LimiteMetrica>;
};

export type FaixaMetrica = {
  media: number | null;
  minimo: number | null;
  maximo: number | null;
};

export type ResumoRelatorioTelemetria = {
  total_leituras: number;
  periodo_desde: string | null;
  periodo_ate: string | null;
  temperatura: FaixaMetrica;
  vibracao: FaixaMetrica;
  // só vem preenchido quando o filtro é de uma máquina só
  horas: { inicio: number | null; fim: number | null; trabalhadas: number | null } | null;
};

export type PontoRelatorioDiario = {
  dia: string; // ISO (meia-noite do dia, America/Sao_Paulo)
  leituras: number;
  temperatura: number | null;
  vibracao: number | null;
};

export type RelatorioTelemetria = {
  leituras: TelemetriaLeituraComMaquina[];
  resumo: ResumoRelatorioTelemetria;
  // tendência diária — sempre do período inteiro (nunca cortada pelo limite)
  porDia: PontoRelatorioDiario[];
  // true = tinha mais leitura no período do que o limite trouxe (resumo
  // continua certo; só a lista crua vem cortada)
  truncado: boolean;
};
