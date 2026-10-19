/**
 * Força o download de um Blob já pronto (PDF, ZIP, imagem...) — usado por qualquer
 * geração de arquivo no front (etiquetas em PDF, O.S. em PDF/ZIP). Um lugar só evita
 * reimplementar o mesmo truque de link temporário em cada módulo.
 */
export function baixarArquivo(blob: Blob, nome: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // revoga só depois de um tempo: o navegador processa o download de forma assíncrona,
  // e revogar a URL logo em seguida corre o risco de apagar o blob antes dele terminar
  // de ler os bytes (download falha silenciosamente, sem nenhum erro no console)
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
