/* Formatação, faixas de alerta e paleta (tema claro, igual ao resto do app). */

import type { LimiteMetrica, TelemetriaAtual } from "./monitoramentoTypes";

export type Nivel = "ok" | "atencao" | "critico" | "sem-dado";

// usados só quando a máquina não tem parâmetro configurado
export const LIMITES_PADRAO: Record<string, LimiteMetrica> = {
  temperatura: { atencao: 60, alarme: 80, minimo: null },
  vibracao: { atencao: 4.5, alarme: 7, minimo: null },
};

/**
 * Nível de uma métrica conforme o limite configurado da máquina.
 * Se `limite` não vier, usa o padrão da métrica.
 */
export function nivelPorLimite(
  valor: number | null,
  limite: LimiteMetrica | undefined,
  padrao?: LimiteMetrica
): Nivel {
  if (valor === null) return "sem-dado";

  const lim = {
    atencao: limite?.atencao ?? padrao?.atencao ?? null,
    alarme: limite?.alarme ?? padrao?.alarme ?? null,
    minimo: limite?.minimo ?? padrao?.minimo ?? null,
  };

  if (lim.alarme !== null && valor >= lim.alarme) return "critico";
  if (lim.atencao !== null && valor >= lim.atencao) return "atencao";
  if (lim.minimo !== null && valor < lim.minimo) return "atencao";
  return "ok";
}

export function nivelTemperatura(
  valor: number | null,
  limite?: LimiteMetrica
): Nivel {
  return nivelPorLimite(valor, limite, LIMITES_PADRAO.temperatura);
}

export function nivelVibracao(
  valor: number | null,
  limite?: LimiteMetrica
): Nivel {
  return nivelPorLimite(valor, limite, LIMITES_PADRAO.vibracao);
}

/** Nível "pior" entre temperatura e vibração — respeita os limites da máquina. */
export function nivelGeral(
  l: Pick<TelemetriaAtual, "temperatura" | "vibracao" | "limites">
): Nivel {
  const ordem: Nivel[] = ["sem-dado", "ok", "atencao", "critico"];
  const a = nivelTemperatura(l.temperatura, l.limites?.temperatura);
  const b = nivelVibracao(l.vibracao, l.limites?.vibracao);
  return ordem.indexOf(a) >= ordem.indexOf(b) ? a : b;
}

export const ROTULO_NIVEL: Record<Nivel, string> = {
  ok: "Normal",
  atencao: "Atenção",
  critico: "Crítico",
  "sem-dado": "Sem sinal",
};

type UiNivel = {
  texto: string;
  suave: string;
  borda: string;
  ponto: string;
  hex: string;
};

export const NIVEL_UI: Record<Nivel, UiNivel> = {
  ok: {
    texto: "text-emerald-600",
    suave: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    borda: "border-slate-200",
    ponto: "bg-emerald-500",
    hex: "#059669",
  },
  atencao: {
    texto: "text-amber-600",
    suave: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    borda: "border-amber-300",
    ponto: "bg-amber-500",
    hex: "#d97706",
  },
  critico: {
    texto: "text-rose-600",
    suave: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    borda: "border-rose-300",
    ponto: "bg-rose-500",
    hex: "#e11d48",
  },
  "sem-dado": {
    texto: "text-slate-400",
    suave: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
    borda: "border-slate-200",
    ponto: "bg-slate-300",
    hex: "#94a3b8",
  },
};

export function formatarNumero(valor: number | null, casas = 1): string {
  if (valor === null || !Number.isFinite(valor)) return "--";
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

/** Considera a leitura "ao vivo" se chegou nos últimos N segundos. */
export function estaAoVivo(atualizadoEm: string | null, janelaSegundos = 90): boolean {
  if (!atualizadoEm) return false;
  const t = new Date(atualizadoEm).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= janelaSegundos * 1000;
}

export function tempoRelativo(iso: string | null): string {
  if (!iso) return "sem leitura";

  const data = new Date(iso);
  const diffSeg = Math.floor((Date.now() - data.getTime()) / 1000);

  if (Number.isNaN(diffSeg)) return "sem leitura";
  if (diffSeg < 10) return "agora mesmo";
  if (diffSeg < 60) return `há ${diffSeg}s`;

  const min = Math.floor(diffSeg / 60);
  if (min < 60) return `há ${min} min`;

  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;

  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

export function media(valores: (number | null)[]): number | null {
  const nums = valores.filter((v): v is number => v !== null && Number.isFinite(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Direção recente da série: 1 subindo, -1 descendo, 0 estável. */
export function tendencia(serie: (number | null)[]): -1 | 0 | 1 {
  const nums = serie.filter((v): v is number => v !== null && Number.isFinite(v));
  if (nums.length < 4) return 0;

  const atual = nums[nums.length - 1];
  const anteriores = nums.slice(-6, -1);
  const base = anteriores.reduce((a, b) => a + b, 0) / anteriores.length;
  const escala = Math.max(Math.abs(base), 1);
  const variacao = (atual - base) / escala;

  if (variacao > 0.02) return 1;
  if (variacao < -0.02) return -1;
  return 0;
}
