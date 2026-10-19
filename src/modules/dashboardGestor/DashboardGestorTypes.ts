// Tipagem das respostas das rotas /dashboard/gestor/*.
// A maioria dos números vem como STRING da API (ex: "15", "5060.00"),
// exceto disponibilidade, que já vem como number. Os componentes usam
// o helper toNumber() (em dashboardGestorParts.tsx) antes de qualquer
// conta ou gráfico.

export interface DashboardKpis {
  os_abertas: string;
  os_andamento: string;
  os_pausadas?: string;
  os_atribuidas: string;
  os_finalizadas: string;
  os_canceladas?: string;
  /** já vem sem contar as canceladas (ver DashboardRepository.obterKPIs) */
  preventivas: string;
  /** já vem sem contar as canceladas (ver DashboardRepository.obterKPIs) */
  corretivas: string;
}

export interface EvolucaoPonto {
  dia: string; // ISO datetime
  total: string;
}

export interface TempoMedioResolucao {
  resumo: {
    segundos: number;
    formatado: string;
  };

  evolucao: {
    dia: string;
    segundos: number;
    horas: number;
    formatado: string;
  }[];
}

export interface MaquinaParada {
  id: number;
  nome: string;
  total: string;
}

export interface MaquinaParadaAgora {
  osId: number;
  maquinaId: number;
  maquinaNome: string;
  motivoParada: string | null;
  dataAbertura: string;
}

/** Não confundir com MaquinaParada acima (esse é ranking por Nº de
 * chamados). Este é o estado ATUAL de máquinas paradas — v1 enxuto,
 * sem timeline histórica ainda. Sem período: "horas paradas no período"
 * somando máquinas diferentes foi tentado e não fez sentido pro gestor
 * (feedback real de uso), então cada máquina mostra o próprio tempo
 * parado (ver o card "Máquinas Paradas" no Dashboard), não um agregado. */
export interface ResumoParadas {
  paradasAgora: number;
  maquinas: MaquinaParadaAgora[];
}

export interface PreventivaVencida {
  maquina_id: number;
  nome: string;
  proxima_manutencao: string;
  dias_atraso: number;
  /** "preventiva atrasada" é uma O.S. de preventiva atrasada: a lista parte
   * das O.S. abertas, não das máquinas — sempre tem uma O.S. de verdade aqui. */
  os_id: number;
}

export interface PreventivasVencidas {
  resumo: {
    total: number;
  };
  maquinas: PreventivaVencida[];
}

export interface RankingTecnicoItem {
  id: number;
  nome: string;
  total: string;
}

export interface CustoResumo {
  material: string;
  terceirizado: string;
  total: string;
}

export interface CustoMaquina {
  nome: string;
  material: string;
  terceirizado: string;
  total: string;
}

export interface CustoTipoManutencao {
  tipo: string;
  total: string;
}

export interface CustoEvolucaoPonto {
  mes: string; // "2026-07"
  total: string;
}

export interface CustosGestor {
  resumo: CustoResumo;
  maquinas: CustoMaquina[];
  tipos_manutencao: CustoTipoManutencao[];
  evolucao: CustoEvolucaoPonto[];
}

export interface FiltroPeriodo {
  dataInicio: string; // "YYYY-MM-DD"
  dataFim: string; // "YYYY-MM-DD"
}
