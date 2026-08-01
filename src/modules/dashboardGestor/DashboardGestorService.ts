import type {
  DashboardKpis,
  EvolucaoPonto,
  TempoMedioResolucao,
  MaquinaParada,
  RankingTecnicoItem,
  CustosGestor,
  PreventivasVencidas,
} from "./DashboardGestorTypes";

const API_URL = import.meta.env.VITE_API_URL;

function buildQuery(dataInicio?: string, dataFim?: string): string {
  const params = new URLSearchParams();
  // o backend espera os parâmetros em camelCase (dataInicio/dataFim) —
  // antes estávamos mandando data_inicio/data_fim (snake_case), que o
  // backend não reconhecia e por isso sempre caía num período padrão
  // fixo, ignorando o filtro escolhido na tela
  if (dataInicio) params.set("dataInicio", dataInicio);
  if (dataFim) params.set("dataFim", dataFim);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function fetchJson<T>(path: string): Promise<T> {
  // cache: "no-store" garante que o navegador nunca reaproveite uma
  // resposta antiga pra essa URL — descarta de vez a hipótese de cache
  // HTTP como causa dos dados não mudarem ao trocar o período
  const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Erro ao buscar ${path}`);
  }
  return response.json();
}

export function getKpis(
  dataInicio?: string,
  dataFim?: string
): Promise<DashboardKpis> {
  return fetchJson(`/dashboard/gestor/kpis${buildQuery(dataInicio, dataFim)}`);
}

export function getEvolucao(
  dataInicio?: string,
  dataFim?: string
): Promise<EvolucaoPonto[]> {
  return fetchJson(
    `/dashboard/gestor/evolucao${buildQuery(dataInicio, dataFim)}`
  );
}

export function getTempoMedioResolucao(
  dataInicio?: string,
  dataFim?: string
): Promise<TempoMedioResolucao> {
  return fetchJson(
    `/dashboard/gestor/tempo-medio-resolucao${buildQuery(dataInicio, dataFim)}`
  );
}

export function getMaquinasParadas(
  dataInicio?: string,
  dataFim?: string
): Promise<MaquinaParada[]> {
  return fetchJson(
    `/dashboard/gestor/maquinas-paradas${buildQuery(dataInicio, dataFim)}`
  );
}

export function getPreventivasVencidas(
  dataInicio?: string,
  dataFim?: string
): Promise<PreventivasVencidas> {
  return fetchJson(
    `/dashboard/gestor/preventivas-vencidas${buildQuery(dataInicio, dataFim)}`
  );
}

export function getRankingTecnicos(
  dataInicio?: string,
  dataFim?: string
): Promise<RankingTecnicoItem[]> {
  return fetchJson(
    `/dashboard/gestor/ranking-tecnicos${buildQuery(dataInicio, dataFim)}`
  );
}

export function getCustos(
  dataInicio?: string,
  dataFim?: string
): Promise<CustosGestor> {
  return fetchJson(
    `/dashboard/gestor/custos${buildQuery(dataInicio, dataFim)}`
  );
}
