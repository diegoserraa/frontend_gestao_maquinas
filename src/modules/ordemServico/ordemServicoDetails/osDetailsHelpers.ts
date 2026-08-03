import {
  ClipboardList,
  UserCheck,
  Wrench,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// duração entre duas datas — se "fim" não existir ainda, calcula até
// agora e sinaliza que está em andamento
export function formatDuration(
  inicio?: string | null,
  fim?: string | null
): { texto: string; emAndamento: boolean } {
  if (!inicio) return { texto: "-", emAndamento: false };

  const inicioMs = new Date(inicio).getTime();
  const fimMs = fim ? new Date(fim).getTime() : Date.now();
  const diff = fimMs - inicioMs;

  if (diff < 0) return { texto: "-", emAndamento: false };

  const minutos = Math.floor(diff / 60000);
  const emAndamento = !fim;

  if (minutos < 60) {
    return { texto: `${minutos}min`, emAndamento };
  }

  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;

  if (horas < 24) {
    return { texto: `${horas}h ${mins}min`, emAndamento };
  }

  const dias = Math.floor(horas / 24);
  const restoHoras = horas % 24;
  return { texto: `${dias}d ${restoHoras}h`, emAndamento };
}

export function formatCurrencyBRL(value?: number | string | null): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  const safe = typeof n === "number" && !Number.isNaN(n) ? n : 0;
  return safe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ── status da OS ───────────────────────────────────────────
// Essa é a ÚNICA cor "forte" da tela — o status é a informação que
// precisa saltar aos olhos primeiro. Cada entrada carrega variações
// pro mesmo tom (badge cheio pro header, accent pra bordas laterais,
// tint bem sutil pra área de ações) em vez de espalhar cores
// diferentes e desconectadas pela tela inteira.
export const STATUS_STYLES = {
  ABERTA: {
    label: "Aberta",
    icon: ClipboardList,
    text: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
    accent: "border-l-blue-500",
    tint: "bg-blue-50/60",
    // mantido por compatibilidade com outros pontos do sistema que já
    // consomem esse formato de badge pronto
    badge: "bg-blue-50 text-blue-600 border-blue-100",
  },
  ATRIBUIDA: {
    label: "Atribuída",
    icon: UserCheck,
    text: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
    accent: "border-l-indigo-500",
    tint: "bg-indigo-50/60",
    badge: "bg-indigo-50 text-indigo-600 border-indigo-100",
  },
  EM_ANDAMENTO: {
    label: "Em andamento",
    icon: Wrench,
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    accent: "border-l-amber-500",
    tint: "bg-amber-50/60",
    badge: "bg-amber-50 text-amber-600 border-amber-100",
  },
  FINALIZADA: {
    label: "Finalizada",
    icon: CheckCircle2,
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    accent: "border-l-emerald-500",
    tint: "bg-emerald-50/60",
    badge: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  CANCELADA: {
    label: "Cancelada",
    icon: XCircle,
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-400",
    accent: "border-l-red-400",
    tint: "bg-red-50/60",
    badge: "bg-red-50 text-red-600 border-red-100",
  },
} as const;

export function getStatusStyle(status?: string | null) {
  const key = String(status ?? "").toUpperCase() as keyof typeof STATUS_STYLES;
  return STATUS_STYLES[key] ?? STATUS_STYLES.ABERTA;
}

// ── prioridade ───────────────────────────────────────────
// Deixa de ser um badge pastel do mesmo peso visual do status.
// Por padrão é só texto neutro; só ganha cor (e um pouco de peso)
// quando é urgente/crítica/alta — que é quando essa informação é
// de fato acionável, não decorativa.
export function getPrioridadeAccent(prioridade?: string | null): {
  text: string;
  icon: string;
} {
  const key = String(prioridade ?? "").toUpperCase();

  if (key === "URGENTE" || key === "CRITICA") {
    return { text: "text-red-600 font-medium", icon: "text-red-500" };
  }
  if (key === "ALTA") {
    return { text: "text-amber-600 font-medium", icon: "text-amber-500" };
  }
  return { text: "text-slate-500", icon: "text-slate-400" };
}

// mantido por compatibilidade com outros pontos do sistema que ainda
// usem o badge completo de prioridade (ex: tabelas/listas de OS)
const PRIORIDADE_STYLES: Record<string, string> = {
  BAIXA: "bg-slate-50 text-slate-600 border-slate-200",
  MEDIA: "bg-blue-50 text-blue-600 border-blue-100",
  ALTA: "bg-amber-50 text-amber-600 border-amber-100",
  URGENTE: "bg-red-50 text-red-600 border-red-100",
  CRITICA: "bg-red-50 text-red-600 border-red-100",
};

export function getPrioridadeStyle(prioridade?: string | null): string {
  const key = String(prioridade ?? "").toUpperCase();
  return PRIORIDADE_STYLES[key] ?? "bg-slate-50 text-slate-600 border-slate-200";
}
