/**
 * Guarda as permissões do usuário logado.
 *
 * Fica no localStorage (a tela já abre com o menu certo depois de um F5) e é
 * exposto como "store externa" pro React (useSyncExternalStore) — sem provider,
 * sem biblioteca. O backend é sempre quem decide; aqui só se esconde o que não
 * adianta mostrar.
 */

const CHAVE = "permissoes";

export type EstadoPermissoes = {
  lista: string[];
  conjunto: ReadonlySet<string>;
};

const VAZIO: EstadoPermissoes = { lista: [], conjunto: new Set() };

let brutoEmCache: string | null | undefined;
let estadoEmCache: EstadoPermissoes = VAZIO;

const ouvintes = new Set<() => void>();

const avisar = () => ouvintes.forEach((cb) => cb());

/** Devolve sempre o MESMO objeto enquanto o conteúdo não mudar (exigência do useSyncExternalStore). */
export function lerPermissoes(): EstadoPermissoes {
  let bruto: string | null = null;

  try {
    bruto = localStorage.getItem(CHAVE);
  } catch {
    return VAZIO;
  }

  if (bruto === brutoEmCache) return estadoEmCache;

  brutoEmCache = bruto;

  try {
    const lista: string[] = bruto ? JSON.parse(bruto) : [];
    estadoEmCache = Array.isArray(lista) ? { lista, conjunto: new Set(lista) } : VAZIO;
  } catch {
    estadoEmCache = VAZIO;
  }

  return estadoEmCache;
}

export function salvarPermissoes(lista: string[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    // navegador sem armazenamento: segue sem cache
  }

  avisar();
}

export function limparPermissoes(): void {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // ignora
  }

  avisar();
}

export function assinarPermissoes(cb: () => void): () => void {
  ouvintes.add(cb);
  window.addEventListener("storage", cb); // outra aba mudou (login/logout)

  return () => {
    ouvintes.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export const permissoesDoServidor = (): EstadoPermissoes => VAZIO;
