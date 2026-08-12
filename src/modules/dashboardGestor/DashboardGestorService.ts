import type {
  DashboardKpis,
  EvolucaoPonto,
  TempoMedioResolucao,
  MaquinaParada,
  RankingTecnicoItem,
  CustosGestor,
  PreventivasVencidas,
} from "./DashboardGestorTypes";

import type { OrdemServicoResumo } from "@/modules/dashboardGestor/OrdemServicoCard";

const API_URL = import.meta.env.VITE_API_URL;

/* =========================================================
   TIPOS
   ========================================================= */

export type ResumoOperador = {
  abertas: number;
  andamento: number;
  finalizadas: number;
};

export type ResumoTecnico = {
  total: number;
  abertas: number;
  andamento: number;
  finalizadas: number;
};

export type OrdensDashboardResponse = {
  total: number;
  ordens: OrdemServicoResumo[];
};

/* =========================================================
   HELPERS
   ========================================================= */

function buildQuery(
  dataInicio?: string,
  dataFim?: string
): string {
  const params = new URLSearchParams();

  if (dataInicio) {
    params.set("dataInicio", dataInicio);
  }

  if (dataFim) {
    params.set("dataFim", dataFim);
  }

  const qs = params.toString();

  return qs ? `?${qs}` : "";
}

async function fetchJson<T>(
  path: string
): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Erro ao buscar ${path} (${response.status})`
    );
  }

  return response.json() as Promise<T>;
}

/* =========================================================
   DASHBOARD GESTOR
   ========================================================= */

export function getKpis(
  dataInicio?: string,
  dataFim?: string
): Promise<DashboardKpis> {
  return fetchJson<DashboardKpis>(
    `/dashboard/gestor/kpis${buildQuery(
      dataInicio,
      dataFim
    )}`
  );
}

export function getEvolucao(
  dataInicio?: string,
  dataFim?: string
): Promise<EvolucaoPonto[]> {
  return fetchJson<EvolucaoPonto[]>(
    `/dashboard/gestor/evolucao${buildQuery(
      dataInicio,
      dataFim
    )}`
  );
}

export function getTempoMedioResolucao(
  dataInicio?: string,
  dataFim?: string
): Promise<TempoMedioResolucao> {
  return fetchJson<TempoMedioResolucao>(
    `/dashboard/gestor/tempo-medio-resolucao${buildQuery(
      dataInicio,
      dataFim
    )}`
  );
}

export function getMaquinasParadas(
  dataInicio?: string,
  dataFim?: string
): Promise<MaquinaParada[]> {
  return fetchJson<MaquinaParada[]>(
    `/dashboard/gestor/maquinas-paradas${buildQuery(
      dataInicio,
      dataFim
    )}`
  );
}

export function getPreventivasVencidas(
  dataInicio?: string,
  dataFim?: string
): Promise<PreventivasVencidas> {
  return fetchJson<PreventivasVencidas>(
    `/dashboard/gestor/preventivas-vencidas${buildQuery(
      dataInicio,
      dataFim
    )}`
  );
}

export function getRankingTecnicos(
  dataInicio?: string,
  dataFim?: string
): Promise<RankingTecnicoItem[]> {
  return fetchJson<RankingTecnicoItem[]>(
    `/dashboard/gestor/ranking-tecnicos${buildQuery(
      dataInicio,
      dataFim
    )}`
  );
}

export function getCustos(
  dataInicio?: string,
  dataFim?: string
): Promise<CustosGestor> {
  return fetchJson<CustosGestor>(
    `/dashboard/gestor/custos${buildQuery(
      dataInicio,
      dataFim
    )}`
  );
}

/* =========================================================
   DASHBOARD OPERADOR
   ========================================================= */

export function getResumoOperador(
  operadorId: string | number
): Promise<ResumoOperador> {
  return fetchJson<ResumoOperador>(
    `/dashboard/operador/${operadorId}/resumo`
  );
}

export function getMinhasOs(
  operadorId: string | number
): Promise<OrdemServicoResumo[]> {
  return fetchJson<OrdemServicoResumo[]>(
    `/dashboard/operador/${operadorId}/minhas-os`
  );
}

/* =========================================================
   DASHBOARD TÉCNICO
   ========================================================= */

export function getResumoTecnico(
  tecnicoId: string | number
): Promise<ResumoTecnico> {
  return fetchJson<ResumoTecnico>(
    `/dashboard/tecnico/${tecnicoId}/resumo`
  );
}

export function getOsAbertasTecnico(
  tecnicoId: string | number
): Promise<OrdensDashboardResponse> {
  return fetchJson<OrdensDashboardResponse>(
    `/dashboard/tecnico/${tecnicoId}/os-abertas`
  );
}

export function getOsAndamentoTecnico(
  tecnicoId: string | number
): Promise<OrdensDashboardResponse> {
  return fetchJson<OrdensDashboardResponse>(
    `/dashboard/tecnico/${tecnicoId}/os-andamento`
  );
}

export function getOsFinalizadasTecnico(
  tecnicoId: string | number
): Promise<OrdensDashboardResponse> {
  return fetchJson<OrdensDashboardResponse>(
    `/dashboard/tecnico/${tecnicoId}/os-finalizadas`
  );
}

