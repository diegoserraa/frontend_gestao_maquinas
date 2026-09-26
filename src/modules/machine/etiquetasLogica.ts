/** Etiquetas de QR Code das máquinas — regras de layout e de nome de arquivo (funções puras, sem React). */

/** Medidas em milímetros. */
export type Medidas = { largura: number; altura: number };

/** Etiqueta pequena (cabe em rolo de impressora térmica e em folha adesiva recortável). */
export const ETIQUETA_PADRAO: Medidas = { largura: 60, altura: 30 };

export const FOLHA_A4: Medidas = { largura: 210, altura: 297 };

export type Grade = {
  colunas: number;
  linhas: number;
  porFolha: number;
  /** espaço deixado à esquerda e no topo para a grade ficar centralizada na folha */
  margemX: number;
  margemY: number;
};

/** Quantas etiquetas cabem na folha (com uma margem mínima de segurança para a impressora) e onde começam. */
export function calcularGrade(etiqueta: Medidas = ETIQUETA_PADRAO, folha: Medidas = FOLHA_A4, margemMinima = 5): Grade {
  const colunas = Math.max(1, Math.floor((folha.largura - 2 * margemMinima) / etiqueta.largura));
  const linhas = Math.max(1, Math.floor((folha.altura - 2 * margemMinima) / etiqueta.altura));

  return {
    colunas,
    linhas,
    porFolha: colunas * linhas,
    margemX: (folha.largura - colunas * etiqueta.largura) / 2,
    margemY: (folha.altura - linhas * etiqueta.altura) / 2,
  };
}

/** Em que folha e em que ponto (mm, canto superior esquerdo) fica a etiqueta de número `indice` (0, 1, 2...). */
export function posicaoDaEtiqueta(indice: number, grade: Grade, etiqueta: Medidas = ETIQUETA_PADRAO) {
  const naFolha = indice % grade.porFolha;

  return {
    folha: Math.floor(indice / grade.porFolha),
    x: grade.margemX + (naFolha % grade.colunas) * etiqueta.largura,
    y: grade.margemY + Math.floor(naFolha / grade.colunas) * etiqueta.altura,
  };
}

export const totalDeFolhas = (quantidade: number, grade: Grade): number => (quantidade <= 0 ? 0 : Math.ceil(quantidade / grade.porFolha));

/** Deixa só o que cabe em `max` linhas; se cortar, termina a última com "…". */
export function limitarLinhas(linhas: string[], max: number): string[] {
  if (linhas.length <= max) return linhas;

  const mantidas = linhas.slice(0, max);
  mantidas[max - 1] = `${mantidas[max - 1].replace(/[\s.,;:-]+$/, "")}…`;
  return mantidas;
}

/** "Injetora Principal #2" → "injetora-principal-2" (sem acento, seguro para nome de arquivo). */
export function paraNomeDeArquivo(texto: string): string {
  return (
    texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "maquina"
  );
}

const doisDigitos = (n: number) => String(n).padStart(2, "0");

/** etiquetas-qr-2026-09-24-12-maquinas.pdf  ou  etiqueta-qr-injetora-principal.pdf */
export function nomeDoArquivo(itens: { nome: string }[], setor: string | null = null, quando: Date = new Date()): string {
  if (itens.length === 1) return `etiqueta-qr-${paraNomeDeArquivo(itens[0].nome)}.pdf`;

  const data = `${quando.getFullYear()}-${doisDigitos(quando.getMonth() + 1)}-${doisDigitos(quando.getDate())}`;
  const sufixo = setor ? `-${paraNomeDeArquivo(setor)}` : "";

  return `etiquetas-qr${sufixo}-${data}-${itens.length}-maquinas.pdf`;
}
