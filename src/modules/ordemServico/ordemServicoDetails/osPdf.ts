import type { OrdemServico } from "@/modules/ordemServico/ordemServicoType";
import {
  estaPausada,
  formatarSegundos,
  segundosDeReparo,
  segundosPausados,
  teveOuTemPausa,
} from "@/modules/ordemServico/pausaOSLogica";

import { formatDateTime, formatDuration, getStatusStyle } from "./osDetailsHelpers";

/**
 * PDF da O.S. desenhado com texto/formas do próprio jsPDF (mesma técnica já usada
 * em etiquetasPdf.ts) — de propósito, NÃO usa html2canvas: ele tem um bug conhecido
 * com as cores oklch() que o Tailwind v4 usa por padrão (rasteriza errado ou quebra).
 * De quebra, texto desenhado assim sai selecionável/pesquisável no PDF, e o arquivo
 * fica bem mais leve do que uma captura de tela.
 */

const COR_TEXTO: [number, number, number] = [15, 23, 42]; // slate-900
const COR_APOIO: [number, number, number] = [100, 116, 139]; // slate-500
const COR_MARCA: [number, number, number] = [37, 99, 235]; // blue-600
const COR_LINHA: [number, number, number] = [226, 232, 240]; // slate-200

const MARGEM = 16;
const LARGURA_UTIL = 210 - MARGEM * 2; // A4 retrato, em mm

type Doc = import("jspdf").jsPDF;

function cabecalho(doc: Doc) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(...COR_MARCA);
  doc.text("MY", MARGEM, 18);
  const larguraMy = doc.getTextWidth("MY");
  doc.setFont("helvetica", "bold");
  doc.text("MAQ360", MARGEM + larguraMy, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COR_APOIO);
  doc.text(`Impresso em ${formatDateTime(new Date().toISOString())}`, MARGEM + LARGURA_UTIL, 18, { align: "right" });

  doc.setDrawColor(...COR_LINHA);
  doc.setLineWidth(0.3);
  doc.line(MARGEM, 23, MARGEM + LARGURA_UTIL, 23);
}

/** Badge com cantos arredondados, texto centralizado — usado pro status/tipo/prioridade. */
function badge(doc: Doc, texto: string, x: number, y: number, cor: [number, number, number]): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const largura = doc.getTextWidth(texto) + 6;
  doc.setDrawColor(...cor);
  doc.setTextColor(...cor);
  doc.roundedRect(x, y, largura, 6, 3, 3, "S");
  doc.text(texto, x + largura / 2, y + 4, { align: "center" });
  return largura;
}

function statusParaRgb(status?: string | null): [number, number, number] {
  const chave = String(status ?? "").toUpperCase();
  const mapa: Record<string, [number, number, number]> = {
    ABERTA: [37, 99, 235],
    ATRIBUIDA: [79, 70, 229],
    EM_ANDAMENTO: [217, 119, 6],
    PAUSADA: [234, 88, 12],
    FINALIZADA: [5, 150, 105],
    CANCELADA: [220, 38, 38],
  };
  return mapa[chave] ?? mapa.ABERTA;
}

function stat(doc: Doc, x: number, y: number, largura: number, label: string, valor: string, hint?: string) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COR_APOIO);
  doc.text(label.toUpperCase(), x, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...COR_TEXTO);
  doc.text(doc.splitTextToSize(valor, largura) as string[], x, y + 5);

  if (hint) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COR_MARCA);
    doc.text(hint, x, y + 9.5);
  }
}

function blocoDeTexto(doc: Doc, y: number, titulo: string, subtitulo: string, texto: string): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...COR_TEXTO);
  doc.text(titulo, MARGEM, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COR_APOIO);
  doc.text(subtitulo, MARGEM, y + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...COR_TEXTO);
  const linhas = doc.splitTextToSize(texto || "Nenhuma informação registrada.", LARGURA_UTIL) as string[];
  doc.text(linhas, MARGEM, y + 11, { lineHeightFactor: 1.45 });

  return y + 11 + linhas.length * 4.2;
}

export type DadosPdfOrdemServico = {
  os: OrdemServico;
  maquinaNome?: string;
  tecnicoNome?: string;
};

/** Monta o PDF da O.S. e devolve o arquivo. jsPDF só é carregado quando alguém baixa. */
export async function gerarPdfOrdemServico({ os, maquinaNome, tecnicoNome }: DadosPdfOrdemServico): Promise<Blob> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  doc.setProperties({ title: `Ordem de Serviço #${os.id}` });

  cabecalho(doc);

  // título + máquina
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COR_APOIO);
  doc.text("ORDEM DE SERVIÇO", MARGEM, 33);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...COR_TEXTO);
  doc.text(`OS #${os.id}`, MARGEM, 41);

  if (maquinaNome) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...COR_APOIO);
    doc.text(maquinaNome, MARGEM, 46.5);
  }

  // badges: status, tipo, prioridade, externo
  const statusStyle = getStatusStyle(os.status);
  let x = MARGEM;
  const yBadge = 51;
  x += badge(doc, statusStyle.label, x, yBadge, statusParaRgb(os.status)) + 2.5;
  if (os.tipo_manutencao) x += badge(doc, os.tipo_manutencao, x, yBadge, [37, 99, 235]) + 2.5;
  if (os.prioridade) {
    const corPrioridade: [number, number, number] =
      os.prioridade === "ALTA" || os.prioridade === "CRITICA" || os.prioridade === "URGENTE"
        ? [220, 38, 38]
        : os.prioridade === "MEDIA"
        ? [217, 119, 6]
        : [5, 150, 105];
    x += badge(doc, os.prioridade, x, yBadge, corPrioridade) + 2.5;
  }
  if (os.execucao_externa) badge(doc, "EXTERNO", x, yBadge, [100, 116, 139]);

  doc.setDrawColor(...COR_LINHA);
  doc.line(MARGEM, 61, MARGEM + LARGURA_UTIL, 61);

  // resumo — mesmos campos e mesmas contas da tela (OSSummaryCards / pausaOSLogica)
  const pausada = estaPausada(os);
  const agora = Date.now();
  const mostraPausa = teveOuTemPausa(os, agora);
  const atendimento = formatDuration(os.data_inicio_atendimento, os.data_resolucao);
  const totalResolucao = formatDuration(os.data_abertura, os.data_resolucao);
  const isExterno = os.execucao_externa === true;
  const tecnicoLabel = isExterno ? "Técnico externo" : tecnicoNome ?? (os.id_tecnico ? `#${os.id_tecnico}` : "Não atribuído");

  const campos: { label: string; valor: string; hint?: string }[] = [
    { label: "Atendimento", valor: atendimento.texto, hint: pausada ? "Pausada" : atendimento.emAndamento ? "Em andamento" : undefined },
  ];
  if (mostraPausa) {
    campos.push({ label: "Tempo pausado", valor: formatarSegundos(segundosPausados(os, agora)) });
    campos.push({ label: "Reparo efetivo", valor: formatarSegundos(segundosDeReparo(os, agora) ?? 0), hint: "sem as pausas" });
  }
  campos.push({ label: "Resolução", valor: totalResolucao.texto, hint: totalResolucao.emAndamento ? "Em aberto" : undefined });
  campos.push({ label: "Responsável", valor: tecnicoLabel });
  campos.push({ label: "Solicitante", valor: os.solicitante_nome ?? (os.id_solicitante ? `#${os.id_solicitante}` : "-") });
  campos.push({ label: "Manutenção", valor: os.tipo_manutencao ?? "-" });

  const colunas = 3;
  const larguraColuna = LARGURA_UTIL / colunas;
  let yStats = 69;
  campos.forEach((campo, i) => {
    const col = i % colunas;
    const linha = Math.floor(i / colunas);
    stat(doc, MARGEM + col * larguraColuna, yStats + linha * 15, larguraColuna - 4, campo.label, campo.valor, campo.hint);
  });
  const linhasStats = Math.ceil(campos.length / colunas);
  let y = yStats + linhasStats * 15 - 6;

  // pausa em curso — mesmo destaque do banner laranja da tela
  if (pausada) {
    doc.setDrawColor(253, 186, 116);
    doc.setFillColor(255, 247, 237);
    doc.roundedRect(MARGEM, y, LARGURA_UTIL, 12, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(194, 65, 12);
    doc.text("Atendimento pausado", MARGEM + 4, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(os.motivo_pausa ? `Motivo: ${os.motivo_pausa}` : "Sem motivo informado", MARGEM + 4, y + 9);
    y += 17;
  } else {
    y += 6;
  }

  doc.setDrawColor(...COR_LINHA);
  doc.line(MARGEM, y, MARGEM + LARGURA_UTIL, y);
  y += 9;

  y = blocoDeTexto(doc, y, "Descrição da Solicitação", "Informações registradas pelo operador", os.descricao) + 8;

  const statusUpper = String(os.status ?? "").toUpperCase();
  if (statusUpper === "CANCELADA") {
    blocoDeTexto(doc, y, "Motivo do Cancelamento", "Justificativa registrada pelo gestor", os.motivo_cancelamento ?? "");
  } else {
    blocoDeTexto(doc, y, "Resolução Aplicada", "Informações registradas pelo técnico", os.resolucao ?? "Ainda não finalizada.");
  }

  const totalPaginas = doc.getNumberOfPages();
  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COR_APOIO);
    doc.text(`Página ${p} de ${totalPaginas}`, MARGEM + LARGURA_UTIL, 289, { align: "right" });
  }

  return doc.output("blob");
}
