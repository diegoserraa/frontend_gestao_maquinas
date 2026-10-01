import type { AcaoCatalogo, Catalogo, ModuloCatalogo } from "./permissoesTypes";

/**
 * Regras da tela de permissões — funções puras (sem React), espelhando o que o
 * backend faz ao salvar. O backend continua sendo quem decide; aqui só evitamos
 * montar uma combinação que ele corrigiria sozinho.
 */

export const OS_VER_TODAS = "os.ver";
export const OS_VER_PROPRIAS = "os.ver_proprias";

export type EscopoOS = "nenhuma" | "proprias" | "todas";

export function indiceAcoes(catalogo: Catalogo): Map<string, AcaoCatalogo> {
  return new Map(catalogo.modulos.flatMap((m) => m.acoes.map((a) => [a.permissao, a] as const)));
}

/** Completa com as dependências (nunca remove). Igual ao normalizar() do backend. */
export function completar(entrada: Iterable<string>, catalogo: Catalogo): Set<string> {
  const acoes = indiceAcoes(catalogo);
  const conjunto = new Set(entrada);

  let mudou = true;
  while (mudou) {
    mudou = false;

    for (const chave of [...conjunto]) {
      const def = acoes.get(chave);
      if (!def) continue;

      for (const dep of def.requer) {
        if (!conjunto.has(dep)) {
          conjunto.add(dep);
          mudou = true;
        }
      }

      if (def.requerUmDe.length > 0 && !def.requerUmDe.some((d) => conjunto.has(d))) {
        conjunto.add(def.requerUmDe[0]);
        mudou = true;
      }
    }
  }

  return conjunto;
}

/** Remove tudo que perdeu uma dependência (o contrário de completar), até estabilizar. */
export function podar(entrada: Iterable<string>, catalogo: Catalogo): Set<string> {
  const acoes = indiceAcoes(catalogo);
  const conjunto = new Set(entrada);

  let mudou = true;
  while (mudou) {
    mudou = false;

    for (const chave of [...conjunto]) {
      const def = acoes.get(chave);
      if (!def) continue;

      const faltaTodas = def.requer.some((d) => !conjunto.has(d));
      const faltaUma = def.requerUmDe.length > 0 && !def.requerUmDe.some((d) => conjunto.has(d));

      if (faltaTodas || faltaUma) {
        conjunto.delete(chave);
        mudou = true;
      }
    }
  }

  return conjunto;
}

/** Liga uma permissão trazendo o que ela exige. */
export function ligar(atual: ReadonlySet<string>, permissao: string, catalogo: Catalogo): Set<string> {
  return completar([...atual, permissao], catalogo);
}

/** Desliga uma permissão levando junto o que dependia dela. */
export function desligar(atual: ReadonlySet<string>, permissao: string, catalogo: Catalogo): Set<string> {
  const copia = new Set(atual);
  copia.delete(permissao);
  return podar(copia, catalogo);
}

/** Liga/desliga a "tela" inteira: desligar remove todas as ações do módulo. */
export function alternarModulo(atual: ReadonlySet<string>, modulo: ModuloCatalogo, ligado: boolean, catalogo: Catalogo): Set<string> {
  if (ligado) return ligar(atual, modulo.acesso, catalogo);

  const copia = new Set(atual);
  for (const a of modulo.acoes) copia.delete(a.permissao);
  return podar(copia, catalogo);
}

/** O módulo de O.S. tem "ver" em dois níveis: nenhuma, só as minhas, todas. */
export function escopoDeOS(atual: ReadonlySet<string>): EscopoOS {
  if (atual.has(OS_VER_TODAS)) return "todas";
  if (atual.has(OS_VER_PROPRIAS)) return "proprias";
  return "nenhuma";
}

export function definirEscopoOS(atual: ReadonlySet<string>, escopo: EscopoOS, catalogo: Catalogo): Set<string> {
  const os = catalogo.modulos.find((m) => m.chave === "os");
  if (!os) return new Set(atual);

  if (escopo === "nenhuma") {
    const copia = new Set(atual);
    for (const a of os.acoes) copia.delete(a.permissao);
    return podar(copia, catalogo);
  }

  const copia = new Set(atual);
  copia.delete(escopo === "todas" ? OS_VER_PROPRIAS : OS_VER_TODAS);
  copia.add(escopo === "todas" ? OS_VER_TODAS : OS_VER_PROPRIAS);
  return completar(copia, catalogo);
}

export type Diferenca = { adicionadas: string[]; removidas: string[] };

export function diferenca(antes: Iterable<string>, depois: Iterable<string>): Diferenca {
  const a = new Set(antes);
  const d = new Set(depois);

  return {
    adicionadas: [...d].filter((p) => !a.has(p)).sort(),
    removidas: [...a].filter((p) => !d.has(p)).sort(),
  };
}

export const mesmoConjunto = (a: ReadonlySet<string>, b: ReadonlySet<string>): boolean =>
  a.size === b.size && [...a].every((p) => b.has(p));

/** "Máquinas › Editar" — usado no histórico e nos avisos. */
export function rotulosDe(catalogo: Catalogo): Map<string, string> {
  return new Map(
    catalogo.modulos.flatMap((m) => m.acoes.map((a) => [a.permissao, `${m.rotulo} › ${a.rotulo}`] as const))
  );
}

/** Quantas permissões do módulo estão ligadas (para o resumo do cartão). */
export function contarDoModulo(atual: ReadonlySet<string>, modulo: ModuloCatalogo): { ligadas: number; total: number } {
  return {
    ligadas: modulo.acoes.filter((a) => atual.has(a.permissao)).length,
    total: modulo.acoes.length,
  };
}
