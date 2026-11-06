/**
 * Para onde a pessoa queria ir antes de precisar entrar (ex.: abriu o QR Code de uma máquina com a câmera
 * do celular sem estar logada). Depois do login, o sistema leva para lá em vez de para o início.
 * Só guarda caminhos DO PRÓPRIO SISTEMA: nunca um endereço externo (evita redirecionamento malicioso).
 */

const CHAVE = "destino_pos_login";

/** Caminho interno válido ("/machines/12?tab=os") ou null. */
export function destinoSeguro(caminho: string | null | undefined): string | null {
  if (!caminho) return null;

  // precisa começar com uma única "/": recusa "//site.com", "http://...", "javascript:..." e barra invertida
  if (!caminho.startsWith("/") || caminho.startsWith("//") || caminho.includes("\\")) return null;

  // sem caracteres de controle
  if (/[\u0000-\u001f\u007f]/.test(caminho)) return null;

  // as telas de entrada não são destino
  if (/^\/(login|trocar-senha)(\/|\?|#|$)/.test(caminho)) return null;

  return caminho;
}

export function guardarDestino(caminho: string): void {
  const seguro = destinoSeguro(caminho);
  if (!seguro) return;

  try {
    sessionStorage.setItem(CHAVE, seguro);
  } catch {
    // sem sessionStorage: a pessoa só cai no início depois de entrar
  }
}

/** Lê o destino guardado e apaga (vale uma vez só). */
export function consumirDestino(): string | null {
  try {
    const guardado = destinoSeguro(sessionStorage.getItem(CHAVE));
    sessionStorage.removeItem(CHAVE);
    return guardado;
  } catch {
    return null;
  }
}
