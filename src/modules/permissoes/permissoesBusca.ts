import type { AcaoCatalogo, ModuloCatalogo } from "./permissoesTypes";

/** Busca de permissões nos painéis: ignora acento e maiúsculas; várias palavras = todas precisam aparecer. */

export const normalizarTexto = (texto: string): string =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export function casaComBusca(campos: readonly string[], busca: string): boolean {
  const palavras = normalizarTexto(busca).split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return true;

  const texto = normalizarTexto(campos.join(" "));
  return palavras.every((p) => texto.includes(p));
}

/**
 * Ações do módulo que aparecem para a busca:
 *  - busca vazia ou que casa com o próprio módulo (nome/descrição): todas;
 *  - senão só as que casam; `null` se nada casar (o módulo some da lista).
 */
export function acoesVisiveis(modulo: ModuloCatalogo, busca: string): AcaoCatalogo[] | null {
  if (normalizarTexto(busca) === "") return modulo.acoes;
  if (casaComBusca([modulo.rotulo, modulo.descricao], busca)) return modulo.acoes;

  const casadas = modulo.acoes.filter((a) => casaComBusca([modulo.rotulo, a.rotulo, a.descricao], busca));
  return casadas.length > 0 ? casadas : null;
}

export const iniciais = (nome: string): string => {
  const partes = nome
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};
