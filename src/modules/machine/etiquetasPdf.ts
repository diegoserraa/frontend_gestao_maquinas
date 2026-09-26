import {
  calcularGrade,
  ETIQUETA_PADRAO,
  FOLHA_A4,
  limitarLinhas,
  posicaoDaEtiqueta,
  type Medidas,
} from "./etiquetasLogica";
import type { Etiqueta, EtiquetasResposta } from "./machineTypes";

export type ModoDoPdf =
  /** várias etiquetas numa folha A4, com linha fina de corte */
  | "folha"
  /** uma etiqueta por página, do tamanho exato da etiqueta (impressora de etiquetas) */
  | "individual";

const COR_TEXTO = 30;
const COR_APOIO = 110;

/** Desenha uma etiqueta: QR à esquerda; empresa, nome, setor e a dica à direita. */
function desenharEtiqueta(doc: import("jspdf").jsPDF, e: Etiqueta, empresa: string | null, x: number, y: number, medidas: Medidas) {
  const margem = 3;
  const lado = medidas.altura - 2 * margem; // o QR é quadrado e ocupa a altura útil
  const xTexto = x + margem + lado + 2.5;
  const larguraTexto = x + medidas.largura - margem - xTexto;

  doc.addImage(e.qr, "PNG", x + margem, y + margem, lado, lado);

  if (empresa) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(COR_APOIO);
    doc.text(limitarLinhas(doc.splitTextToSize(empresa.toUpperCase(), larguraTexto) as string[], 1), xTexto, y + margem + 1.5);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(COR_TEXTO);
  const nome = limitarLinhas(doc.splitTextToSize(e.nome, larguraTexto) as string[], 3);
  doc.text(nome, xTexto, y + margem + 5.5, { lineHeightFactor: 1.1 });

  if (e.setor) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(COR_APOIO);
    doc.text(limitarLinhas(doc.splitTextToSize(e.setor, larguraTexto) as string[], 1), xTexto, y + medidas.altura - margem - 5);
  }

  // rodapé em duas linhas fixas (cada uma cabe inteira, sem quebrar)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(COR_APOIO);
  doc.text(`ID ${e.id}`, xTexto, y + medidas.altura - margem - 2.3);
  doc.text("Escaneie para abrir O.S.", xTexto, y + medidas.altura - margem);
}

/**
 * Monta o PDF das etiquetas e devolve o arquivo. A biblioteca só é carregada quando alguém exporta
 * (não pesa na abertura do sistema).
 */
export async function gerarPdfEtiquetas(dados: EtiquetasResposta, modo: ModoDoPdf, etiqueta: Medidas = ETIQUETA_PADRAO): Promise<Blob> {
  const { jsPDF } = await import("jspdf");

  const individual = modo === "individual";
  const pagina = individual ? etiqueta : FOLHA_A4;

  const doc = new jsPDF({
    unit: "mm",
    format: [Math.min(pagina.largura, pagina.altura), Math.max(pagina.largura, pagina.altura)],
    orientation: pagina.largura > pagina.altura ? "landscape" : "portrait",
    compress: true,
  });

  doc.setProperties({ title: individual ? `Etiqueta QR - ${dados.itens[0]?.nome ?? ""}` : "Etiquetas QR das máquinas" });

  const grade = calcularGrade(etiqueta, FOLHA_A4);
  let folhaAtual = 0;

  dados.itens.forEach((item, indice) => {
    if (individual) {
      if (indice > 0) doc.addPage();
      desenharEtiqueta(doc, item, dados.empresa, 0, 0, etiqueta);
      return;
    }

    const p = posicaoDaEtiqueta(indice, grade, etiqueta);

    while (folhaAtual < p.folha) {
      doc.addPage();
      folhaAtual++;
    }

    // linha fina só para orientar o corte (cinza claro, não polui a etiqueta)
    doc.setDrawColor(215);
    doc.setLineWidth(0.1);
    doc.rect(p.x, p.y, etiqueta.largura, etiqueta.altura);

    desenharEtiqueta(doc, item, dados.empresa, p.x, p.y, etiqueta);
  });

  return doc.output("blob");
}

/** Faz o navegador baixar o arquivo. */
export function baixarArquivo(blob: Blob, nome: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // dá tempo do navegador começar o download antes de liberar a memória
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
