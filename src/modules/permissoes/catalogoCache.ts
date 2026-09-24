import { getCatalogo } from "./permissoesService";
import type { Catalogo } from "./permissoesTypes";

// o catálogo não muda durante a sessão: uma busca só, compartilhada pelos painéis
let emCache: Promise<Catalogo> | null = null;

export const carregarCatalogo = (): Promise<Catalogo> =>
  (emCache ??= getCatalogo().catch((e) => {
    emCache = null; // se falhar, a próxima abertura tenta de novo
    throw e;
  }));

export const mensagemDe = (e: unknown, padrao: string): string =>
  e instanceof Error && e.message ? e.message : padrao;
