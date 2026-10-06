import { apiGet, apiPut, apiPatch, apiPost } from "@/lib/apiClient";
import { getToken } from "@/modules/login/loginStorage";
import type {
  FaixaHistorico,
  MetricaHistorico,
  MqttStatus,
  PontoAgregado,
  TelemetriaAtual,
  TelemetriaLeitura,
} from "./monitoramentoTypes";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * URL do WebSocket de telemetria.
 * Usa VITE_WS_URL se definido; senão deriva de VITE_API_URL
 * (http -> ws, https -> wss) + /ws/telemetria.
 *
 * O backend agora exige um token válido pra aceitar a conexão (antes
 * aceitava qualquer um e mandava a telemetria de todas as empresas pra
 * todo mundo) — como o navegador não manda header customizado no
 * handshake do WebSocket, o token vai na própria query string.
 */
export function getWsUrl(): string {
  const explicito = import.meta.env.VITE_WS_URL;

  const base = explicito || (() => {
    const semBarra = (API_URL ?? "").replace(/\/$/, "");
    return semBarra.replace(/^http/, "ws") + "/ws/telemetria";
  })();

  const token = getToken();
  if (!token) return base;

  const separador = base.includes("?") ? "&" : "?";
  return `${base}${separador}token=${encodeURIComponent(token)}`;
}

async function fetchJson<T>(path: string): Promise<T> {
  try {
    return await apiGet<T>(path);
  } catch {
    throw new Error(`Erro ao buscar ${path}`);
  }
}

export function getTelemetriaAtual(): Promise<TelemetriaAtual[]> {
  return fetchJson<TelemetriaAtual[]>("/telemetria");
}

/* ================= Parâmetros de monitoramento ================= */

export type MaquinaParametro = {
  id?: number;
  maquina_id: number;
  chave: string;
  unidade: string | null;
  minimo: number | null;
  atencao: number | null;
  alarme: number | null;
  janela_seg: number;
  abrir_os_auto: boolean;
  ativo: boolean;
};

export function getParametros(maquinaId: number): Promise<MaquinaParametro[]> {
  return fetchJson<MaquinaParametro[]>(`/monitoramento/maquinas/${maquinaId}/parametros`);
}

export async function salvarParametros(
  maquinaId: number,
  lista: MaquinaParametro[]
): Promise<MaquinaParametro[]> {
  try {
    return await apiPut<MaquinaParametro[]>(`/monitoramento/maquinas/${maquinaId}/parametros`, lista);
  } catch {
    throw new Error("Erro ao salvar parâmetros");
  }
}

/* ================= Alertas ================= */

export type AlertaMonitoramento = {
  id: number;
  maquina_id: number;
  maquina_nome: string;
  setor_nome: string | null;
  chave: string;
  nivel: "atencao" | "critico" | "sem_sinal";
  valor: number | null;
  limite: number | null;
  status: "aberto" | "resolvido" | "convertido";
  ordem_servico_id: number | null;
  detalhe: string | null;
  aberto_em: string;
};

export function getAlertas(status = "ativos"): Promise<AlertaMonitoramento[]> {
  return fetchJson<AlertaMonitoramento[]>(`/monitoramento/alertas?status=${status}`);
}

/** Métricas fora do limite mas ainda dentro da janela de confirmação. */
export type PendenteMonitoramento = {
  maquina_id: number;
  maquina_nome: string;
  setor_nome: string | null;
  chave: string;
  nivel: "atencao" | "critico";
  fora_desde: string;
  janela_seg: number;
  valor: number;
  atencao: number | null;
  alarme: number | null;
};

export function getPendentes(): Promise<PendenteMonitoramento[]> {
  return fetchJson<PendenteMonitoramento[]>("/monitoramento/pendentes");
}

export async function resolverAlerta(id: number): Promise<void> {
  try {
    await apiPatch(`/monitoramento/alertas/${id}/resolver`);
  } catch {
    throw new Error("Erro ao resolver alerta");
  }
}

export async function abrirOSDoAlerta(
  id: number,
  solicitanteId?: number
): Promise<{ alerta_id: number; ordem_servico_id: number | null }> {
  try {
    return await apiPost(`/monitoramento/alertas/${id}/abrir-os`, {
      solicitante_id: solicitanteId,
    });
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Erro ao abrir O.S.");
  }
}

export function getTelemetriaStatus(): Promise<MqttStatus> {
  return fetchJson<MqttStatus>("/telemetria/status");
}

export function getTelemetriaHistorico(
  maquinaId: number,
  params: { desde?: string; limite?: number } = {}
): Promise<TelemetriaLeitura[]> {
  const qs = new URLSearchParams();

  if (params.desde) qs.set("desde", params.desde);
  if (params.limite) qs.set("limite", String(params.limite));

  const query = qs.toString();

  return fetchJson<TelemetriaLeitura[]>(
    `/telemetria/${maquinaId}/historico${query ? `?${query}` : ""}`
  );
}

/* =====================================================================
 * HISTÓRICO AGREGADO (gráfico principal, com faixa de tempo)
 *
 * Esta é a "tomada": o gráfico só conhece esta função e o tipo
 * PontoAgregado. O back agrupa com date_trunc + generate_series +
 * AVG/MIN/MAX (ver TelemetriaRepository.listarHistoricoAgregado) e
 * devolve o mesmo shape que o gráfico já espera.
 * ===================================================================== */
export function getHistoricoAgregado(
  maquinaId: number,
  faixa: FaixaHistorico,
  metrica: MetricaHistorico
): Promise<PontoAgregado[]> {
  return fetchJson<PontoAgregado[]>(
    `/telemetria/${maquinaId}/historico-agregado?faixa=${faixa}&metrica=${metrica}`
  );
}

