import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** localStorage e window de mentira (o teste roda em Node, sem navegador). */
function instalarNavegadorFalso() {
  const dados = new Map<string, string>();
  const ouvintes = new Map<string, Set<() => void>>();

  vi.stubGlobal("localStorage", {
    getItem: (k: string) => (dados.has(k) ? (dados.get(k) as string) : null),
    setItem: (k: string, v: string) => void dados.set(k, v),
    removeItem: (k: string) => void dados.delete(k),
    clear: () => dados.clear(),
  });

  vi.stubGlobal("window", {
    addEventListener: (ev: string, cb: () => void) => {
      if (!ouvintes.has(ev)) ouvintes.set(ev, new Set());
      ouvintes.get(ev)!.add(cb);
    },
    removeEventListener: (ev: string, cb: () => void) => void ouvintes.get(ev)?.delete(cb),
  });

  return { dados, ouvintes };
}

let store: typeof import("./permissoesStore");

beforeEach(async () => {
  vi.resetModules();
  instalarNavegadorFalso();
  store = await import("./permissoesStore");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("store de permissões", () => {
  it("começa vazio", () => {
    expect(store.lerPermissoes().lista).toEqual([]);
    expect(store.lerPermissoes().conjunto.size).toBe(0);
  });

  it("salvar disponibiliza a lista e o conjunto", () => {
    store.salvarPermissoes(["os.ver", "maquinas.ver"]);
    const e = store.lerPermissoes();
    expect(e.lista).toEqual(["os.ver", "maquinas.ver"]);
    expect(e.conjunto.has("os.ver")).toBe(true);
    expect(e.conjunto.has("usuarios.ver")).toBe(false);
  });

  it("devolve o MESMO objeto enquanto nada muda (exigência do useSyncExternalStore)", () => {
    store.salvarPermissoes(["os.ver"]);
    expect(store.lerPermissoes()).toBe(store.lerPermissoes());
  });

  it("muda o objeto quando o conteúdo muda", () => {
    store.salvarPermissoes(["os.ver"]);
    const antes = store.lerPermissoes();
    store.salvarPermissoes(["os.ver", "maquinas.ver"]);
    expect(store.lerPermissoes()).not.toBe(antes);
  });

  it("avisa quem está assinando ao salvar e ao limpar; parar de assinar funciona", () => {
    const cb = vi.fn();
    const parar = store.assinarPermissoes(cb);

    store.salvarPermissoes(["os.ver"]);
    store.limparPermissoes();
    expect(cb).toHaveBeenCalledTimes(2);

    parar();
    store.salvarPermissoes(["x"]);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("limpar (logout) zera as permissões", () => {
    store.salvarPermissoes(["os.ver"]);
    store.limparPermissoes();
    expect(store.lerPermissoes().lista).toEqual([]);
  });

  it("conteúdo corrompido no armazenamento vira 'sem permissões' (não quebra a tela)", () => {
    localStorage.setItem("permissoes", "{isso não é json");
    expect(store.lerPermissoes().lista).toEqual([]);

    localStorage.setItem("permissoes", JSON.stringify({ nao: "lista" }));
    expect(store.lerPermissoes().lista).toEqual([]);
  });

  it("se o armazenamento do navegador falhar, não lança erro", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("bloqueado");
      },
      removeItem: () => {
        throw new Error("bloqueado");
      },
    });

    expect(() => store.salvarPermissoes(["os.ver"])).not.toThrow();
    expect(() => store.limparPermissoes()).not.toThrow();
    expect(store.lerPermissoes().lista).toEqual([]);
  });
});
