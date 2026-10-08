export type SetorOption = {
  id: number;
  nome: string;
};

export type MaquinaOption = {
  id: number;
  nome: string;
  setor_id?: number | null;
};

export type FiltrosRelatorio = {
  dataInicial: string; // yyyy-MM-dd
  dataFinal: string; // yyyy-MM-dd
  setorId: string; // "" = todos
  maquinaId: string; // "" = todas
  // só usado no Histórico de O.S. — Indicadores por Máquina ignora
  apenasParada?: boolean;
};

export const FILTROS_VAZIOS: FiltrosRelatorio = {
  dataInicial: "",
  dataFinal: "",
  setorId: "",
  maquinaId: "",
  apenasParada: false,
};

export type OrdemServicoRelatorioItem = {
  id: number | string;
  maquina_nome: string;
  setor_nome?: string | null;
  descricao?: string | null;
  status: string;
  tipo_manutencao?: string | null;
  prioridade?: string | null;
  tecnico_nome?: string | null;
  solicitante_nome?: string | null;
  data_abertura?: string | null;
  data_atribuicao?: string | null;
  data_inicio_atendimento?: string | null;
  data_resolucao?: string | null;
  resolucao?: string | null;
  motivo_cancelamento?: string | null;
  valor_gasto?: number | string | null;
  valor_parceiro?: number | string | null;
  // soma das pausas da O.S. (o servidor já desconta isso do tempo de reparo)
  tempo_pausado_segundos?: number | string | null;
  // "máquina parada" (v1 enxuto) — respondido só na abertura, ver OrdemServicoForm
  maquina_parada?: boolean;
  motivo_parada?: string | null;
  tempo_parado_segundos?: number | string | null;
};

export type ProdutividadeTecnicoItem = {
  tecnico_id: number;
  tecnico_nome: string;

  os_finalizadas: number | string;
  os_finalizadas_prioritarias: number | string;
  tempo_medio_atendimento_segundos?: number | string | null;

  // estado ATUAL — nunca filtrado por período, é a fila de hoje
  os_em_aberto: number | string;
};

export type IndicadorMaquinaItem = {
  maquina_nome: string;
  setor_nome?: string | null;
  os_abertas: number | string;
  total_os: number | string;
  os_finalizadas: number | string;
  mttr_segundos?: number | string | null;
  mtbf_segundos?: number | string | null;
  tempo_atendimento_segundos?: number | string | null;
  corretivas: number | string;
  preventivas: number | string;
  ultima_manutencao?: string | null;
};
