/**
 * Regras de exibição da pausa de O.S. — funções puras (sem React), para poder testar.
 *
 * O servidor entrega:
 *  - tempo_pausado_segundos: soma das pausas já encerradas;
 *  - pausa_atual_segundos: quanto a pausa em curso já durou (calculado pelo banco, sem depender de fuso);
 *  - pausada_em / motivo_pausa: presentes só enquanto a O.S. está pausada.
 * O relógio da tela só soma o que passou DEPOIS de receber a O.S.
 */

export type OSComPausa = {
  status?: string;
  data_inicio_atendimento?: string | null;
  data_resolucao?: string | null;
  data_cancelamento?: string | null;
  tempo_pausado_segundos?: number | null;
  pausada_em?: string | null;
  motivo_pausa?: string | null;
  pausa_atual_segundos?: number | null;
};

export type PausaOS = {
  id: number;
  os_id: number;
  motivo: string;
  pausada_em: string;
  retomada_em: string | null;
  pausada_por: number | null;
  pausada_por_nome: string | null;
  retomada_por: number | null;
  retomada_por_nome: string | null;
  duracao_segundos: number | null;
};

// quando cada objeto de O.S. foi recebido (para o cronômetro andar sem buscar de novo)
const recebidaEm = new WeakMap<object, number>();

function momentoDoRecebimento(os: object, agoraMs: number): number {
  const salvo = recebidaEm.get(os);
  if (salvo !== undefined) return salvo;
  recebidaEm.set(os, agoraMs);
  return agoraMs;
}

export const estaPausada = (os: OSComPausa): boolean => String(os.status ?? "").toUpperCase() === "PAUSADA";

/** Segundos que a pausa em curso já durou (0 se a O.S. não está pausada). */
export function segundosDaPausaAtual(os: OSComPausa, agoraMs: number = Date.now()): number {
  if (!estaPausada(os)) return 0;

  const base = Math.max(0, Number(os.pausa_atual_segundos ?? 0));
  const desde = Math.max(0, Math.floor((agoraMs - momentoDoRecebimento(os, agoraMs)) / 1000));
  return base + desde;
}

/** Tempo total pausado: pausas encerradas + a que está em curso. */
export function segundosPausados(os: OSComPausa, agoraMs: number = Date.now()): number {
  return Math.max(0, Number(os.tempo_pausado_segundos ?? 0)) + segundosDaPausaAtual(os, agoraMs);
}

/** Houve pausa nesta O.S. (mostra ou esconde o cartão "Tempo pausado"). */
export const teveOuTemPausa = (os: OSComPausa, agoraMs: number = Date.now()): boolean =>
  segundosPausados(os, agoraMs) > 0 || estaPausada(os);

/**
 * Tempo efetivo de reparo: do início do atendimento até agora (ou até o fim), MENOS o tempo pausado.
 * Devolve null se o atendimento ainda não começou.
 */
export function segundosDeReparo(os: OSComPausa, agoraMs: number = Date.now()): number | null {
  if (!os.data_inicio_atendimento) return null;

  const inicio = new Date(os.data_inicio_atendimento).getTime();
  const fimTexto = os.data_resolucao ?? os.data_cancelamento;
  const fim = fimTexto ? new Date(fimTexto).getTime() : agoraMs;

  const bruto = Math.floor((fim - inicio) / 1000);
  if (Number.isNaN(bruto) || bruto < 0) return null;

  // encerrada: o total já está fechado no servidor; em curso: soma a pausa que ainda corre
  const pausado = fimTexto ? Math.max(0, Number(os.tempo_pausado_segundos ?? 0)) : segundosPausados(os, agoraMs);
  return Math.max(0, bruto - pausado);
}

/** "45s", "12min", "1h 05min", "2d 3h" — compacto, para cartões e tabelas. */
export function formatarSegundos(total: number | null | undefined): string {
  if (total == null || Number.isNaN(total)) return "-";

  const s = Math.max(0, Math.floor(total));
  if (s < 60) return `${s}s`;

  const minutos = Math.floor(s / 60);
  if (minutos < 60) return `${minutos}min`;

  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas < 24) return `${horas}h ${String(resto).padStart(2, "0")}min`;

  const dias = Math.floor(horas / 24);
  return `${dias}d ${horas % 24}h`;
}

/** "00:12:05" — cronômetro da pausa em curso. */
export function formatarCronometro(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  return [h, m, seg].map((n) => String(n).padStart(2, "0")).join(":");
}

export type EventoDePausa = {
  chave: string;
  tipo: "pausa" | "retomada";
  data: string;
  descricao: string;
};

/** Transforma o histórico de pausas em eventos para a linha do tempo (pausou / retomou), em ordem. */
export function eventosDePausas(pausas: PausaOS[]): EventoDePausa[] {
  const eventos: EventoDePausa[] = [];

  for (const p of pausas) {
    eventos.push({
      chave: `pausa-${p.id}`,
      tipo: "pausa",
      data: p.pausada_em,
      descricao: `${p.pausada_por_nome ? `${p.pausada_por_nome} pausou` : "Atendimento pausado"}. Motivo: ${p.motivo}`,
    });

    if (p.retomada_em) {
      eventos.push({
        chave: `retomada-${p.id}`,
        tipo: "retomada",
        data: p.retomada_em,
        descricao: `${p.retomada_por_nome ? `${p.retomada_por_nome} retomou` : "Atendimento retomado"} o atendimento após ${formatarSegundos(p.duracao_segundos)} parado`,
      });
    }
  }

  return eventos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
}
