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
 * PontoAgregado. Hoje devolve dados simulados.
 *
 * Para ligar no real, trocar SÓ o corpo desta função por:
 *
 *   return fetchJson<PontoAgregado[]>(
 *     `/telemetria/${maquinaId}/historico-agregado?faixa=${faixa}&metrica=${metrica}`
 *   );
 *
 * O back agrupa com date_trunc + AVG/MIN/MAX e devolve o mesmo shape.
 * ===================================================================== */
export function getHistoricoAgregado(
  maquinaId: number,
  faixa: FaixaHistorico,
  metrica: MetricaHistorico
): Promise<PontoAgregado[]> {
  return Promise.resolve(gerarHistoricoMock(maquinaId, faixa, metrica));
}

// ---------- MOCK (remover quando o endpoint real existir) ----------

// Cada faixa é a UNIDADE do ponto (não a janela toda): "Hora" = 1 ponto por
// hora, "6 horas" = 1 ponto por bloco de 6h, "Dia" = 1 ponto por dia,
// "Semana" = 1 ponto por semana, "Mês" = 1 ponto por mês. A janela exibida
// é só pontos × passo.
//
// Os buckets são ALINHADOS ao calendário (início da hora/bloco-de-6h/dia/
// semana/mês), não "agora menos N×passo" — senão o instante herda o
// minuto/segundo arbitrário de quando a página foi aberta (ex.: ticks em
// "22:07, 00:07..." em vez de "22:00, 00:00...", ou blocos de 6h que nunca
// caem em 00h/06h/12h/18h). Isso também é o que um endpoint real faria com
// date_trunc('hour'|'day'|'week'|'month', instante) — ao trocar pelo real,
// é só isso que muda.
type UnidadeBucket = "hora" | "seisHoras" | "dia" | "semana" | "mes";

const FAIXA_CFG: Record<
  FaixaHistorico,
  { pontos: number; unidade: UnidadeBucket; ondaHoras: number; spread: number }
> = {
  "1h": { pontos: 24, unidade: "hora", ondaHoras: 8, spread: 1.5 }, // 24h, 1 ponto/hora
  "6h": { pontos: 8, unidade: "seisHoras", ondaHoras: 24, spread: 1.8 }, // 2 dias, 1 ponto/6h
  "24h": { pontos: 14, unidade: "dia", ondaHoras: 72, spread: 2.5 }, // 14 dias, 1 ponto/dia
  "7d": { pontos: 10, unidade: "semana", ondaHoras: 336, spread: 3 }, // 10 semanas, 1 ponto/semana
  "30d": { pontos: 12, unidade: "mes", ondaHoras: 2160, spread: 3.5 }, // 12 meses, 1 ponto/mês
};

/** Início do bucket que contém `d` (equivalente a um date_trunc no front). */
function truncarBucket(d: Date, unidade: UnidadeBucket): Date {
  const t = new Date(d);
  if (unidade === "hora") {
    t.setMinutes(0, 0, 0);
    return t;
  }
  if (unidade === "seisHoras") {
    t.setMinutes(0, 0, 0);
    t.setHours(Math.floor(t.getHours() / 6) * 6);
    return t;
  }
  if (unidade === "dia") {
    t.setHours(0, 0, 0, 0);
    return t;
  }
  if (unidade === "semana") {
    t.setHours(0, 0, 0, 0);
    const diaSemana = t.getDay(); // 0 = domingo
    const diffParaSegunda = (diaSemana + 6) % 7;
    t.setDate(t.getDate() - diffParaSegunda);
    return t;
  }
  // mes
  t.setHours(0, 0, 0, 0);
  t.setDate(1);
  return t;
}

/** `d` deslocado em `qtd` unidades de calendário (qtd pode ser negativo). */
function somarBucket(d: Date, unidade: UnidadeBucket, qtd: number): Date {
  const t = new Date(d);
  if (unidade === "hora") {
    t.setHours(t.getHours() + qtd);
    return t;
  }
  if (unidade === "seisHoras") {
    t.setHours(t.getHours() + 6 * qtd);
    return t;
  }
  if (unidade === "dia") {
    t.setDate(t.getDate() + qtd);
    return t;
  }
  if (unidade === "semana") {
    t.setDate(t.getDate() + 7 * qtd);
    return t;
  }
  // mes: usar setMonth lida certo com meses de tamanhos diferentes
  t.setMonth(t.getMonth() + qtd);
  return t;
}

/** Últimos `pontos` buckets alinhados ao calendário, terminando no atual. */
function instantesDaFaixa(faixa: FaixaHistorico): number[] {
  const cfg = FAIXA_CFG[faixa];
  const fim = truncarBucket(new Date(), cfg.unidade);
  const lista: number[] = [];
  for (let i = cfg.pontos - 1; i >= 0; i--) {
    lista.push(somarBucket(fim, cfg.unidade, -i).getTime());
  }
  return lista;
}

function prng(...partes: Array<string | number>): () => number {
  let h = 2166136261;
  for (const parte of partes) {
    const s = String(parte);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gerarHistoricoMock(
  maquinaId: number,
  faixa: FaixaHistorico,
  metrica: MetricaHistorico
): PontoAgregado[] {
  const cfg = FAIXA_CFG[faixa];
  const rnd = prng(maquinaId, metrica, faixa);
  const instantes = instantesDaFaixa(faixa);

  // "personalidade" estável da máquina (mesma máquina => mesma cara)
  const carater = prng(maquinaId, metrica)();

  if (metrica === "horas_ligadas") {
    let acc = 400 + carater * 6000;
    const passoHoras =
      instantes.length > 1 ? (instantes[1] - instantes[0]) / 3_600_000 : 1;
    const pts: PontoAgregado[] = [];
    for (const t of instantes) {
      pts.push({
        instante: new Date(t).toISOString(),
        media: round(acc, 1),
        minimo: round(acc, 1),
        maximo: round(acc, 1),
      });
      acc += passoHoras * (0.8 + rnd() * 0.4);
    }
    return pts;
  }

  const base =
    metrica === "temperatura" ? 40 + carater * 30 : 1.3 + carater * 4.2;
  const amplitude = metrica === "temperatura" ? base * 0.14 : base * 0.28;

  const pts: PontoAgregado[] = [];
  instantes.forEach((t, i) => {
    const fase = (t / 3_600_000 / cfg.ondaHoras) * Math.PI * 2;
    const onda = Math.sin(fase) + 0.35 * Math.sin(fase * 2.7);
    const ruido = (rnd() - 0.5) * amplitude;
    const tendencia = (i / cfg.pontos - 0.5) * amplitude * 0.6;

    let media = base + onda * amplitude + ruido + tendencia;
    media =
      metrica === "temperatura"
        ? clampNum(media, 15, 120)
        : clampNum(media, 0.05, 14);

    const spread =
      cfg.spread *
      (metrica === "vibracao" ? 0.4 : 1) *
      (0.5 + rnd() * 0.9);

    pts.push({
      instante: new Date(t).toISOString(),
      media: round(media, 2),
      minimo: round(Math.max(media - spread, 0), 2),
      maximo: round(media + spread, 2),
    });
  });
  return pts;
}

function clampNum(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function round(v: number, casas: number) {
  const f = 10 ** casas;
  return Math.round(v * f) / f;
}
