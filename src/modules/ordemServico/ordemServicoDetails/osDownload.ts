import type { OrdemServico } from "@/modules/ordemServico/ordemServicoType";
import { getOSAttachments, buscarAnexoBlob } from "@/modules/attachment/attachmentService";
import { baixarArquivo } from "@/lib/baixarArquivo";

import { gerarPdfOrdemServico } from "./osPdf";

/** Evita nomes repetidos dentro do zip (duas fotos podem ter vindo com o mesmo nome). */
function nomeUnicoNoZip(nome: string, usados: Set<string>): string {
  if (!usados.has(nome)) {
    usados.add(nome);
    return nome;
  }
  const ponto = nome.lastIndexOf(".");
  const base = ponto === -1 ? nome : nome.slice(0, ponto);
  const ext = ponto === -1 ? "" : nome.slice(ponto);
  let i = 2;
  let candidato = `${base} (${i})${ext}`;
  while (usados.has(candidato)) {
    i++;
    candidato = `${base} (${i})${ext}`;
  }
  usados.add(candidato);
  return candidato;
}

type Params = {
  os: OrdemServico;
  maquinaNome?: string;
  tecnicoNome?: string;
};

/**
 * Baixa a O.S. completa: gera o PDF sempre; se houver fotos anexadas, empacota o PDF
 * junto com elas num único .zip (mais profissional que obrigar vários downloads
 * separados). Sem anexo nenhum, baixa só o PDF — não faz sentido gerar um zip de um
 * arquivo só.
 */
export async function baixarOrdemServicoCompleta({ os, maquinaNome, tecnicoNome }: Params): Promise<void> {
  const [pdfBlob, anexos] = await Promise.all([
    gerarPdfOrdemServico({ os, maquinaNome, tecnicoNome }),
    getOSAttachments(os.id).catch(() => []), // sem anexo (ou erro ao listar) não deve impedir o PDF
  ]);

  const nomeBase = `OS-${os.id}`;

  if (anexos.length === 0) {
    baixarArquivo(pdfBlob, `${nomeBase}.pdf`);
    return;
  }

  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  zip.file(`${nomeBase}.pdf`, pdfBlob);

  const pastaAbertura = zip.folder("fotos-abertura")!;
  const pastaFechamento = zip.folder("fotos-execucao")!;
  const usadosAbertura = new Set<string>();
  const usadosFechamento = new Set<string>();

  const blobsDosAnexos = await Promise.all(anexos.map((anexo) => buscarAnexoBlob(anexo)));

  anexos.forEach((anexo, i) => {
    const pasta = anexo.origem === "OS_FECHAMENTO" ? pastaFechamento : pastaAbertura;
    const usados = anexo.origem === "OS_FECHAMENTO" ? usadosFechamento : usadosAbertura;
    pasta.file(nomeUnicoNoZip(anexo.nome_arquivo, usados), blobsDosAnexos[i]);
  });

  const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  baixarArquivo(zipBlob, `${nomeBase}.zip`);
}
