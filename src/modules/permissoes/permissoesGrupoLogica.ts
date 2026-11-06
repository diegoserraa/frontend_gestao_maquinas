import { desligar, ligar } from "./permissoesLogica";
import type {
  AcaoEmGrupo,
  Catalogo,
  MotivoIgnorado,
  PedidoEmGrupo,
  ResultadoEmGrupo,
  TipoFuncionario,
} from "./permissoesTypes";

/**
 * Regras da tela "Permissões em grupo" — funções puras (sem React), para poder testar.
 * O servidor confere tudo de novo; aqui só se evita montar um pedido inválido.
 */

export type ModoAlvo = "tipo" | "selecao";

/**
 * Marca/desmarca uma permissão na escolha do grupo.
 *  - "dar": a escolha acompanha as dependências (o servidor completa do mesmo jeito),
 *    então o que aparece marcado é exatamente o que será dado;
 *  - "retirar": cada permissão é independente (o servidor leva junto o que dependia dela).
 */
export function alternarNaEscolha(
  atual: ReadonlySet<string>,
  permissao: string,
  valor: boolean,
  acao: AcaoEmGrupo,
  catalogo: Catalogo
): Set<string> {
  if (acao === "retirar") {
    const copia = new Set(atual);
    if (valor) copia.add(permissao);
    else copia.delete(permissao);
    return copia;
  }

  return valor ? ligar(atual, permissao, catalogo) : desligar(atual, permissao, catalogo);
}

/** Ao trocar entre dar e retirar a escolha recomeça (o significado de "marcado" muda). */
export const escolhaInicial = (): Set<string> => new Set();

export type EstadoDoPedido = {
  modo: ModoAlvo;
  tipo: TipoFuncionario | null;
  usuarios: number[];
  acao: AcaoEmGrupo;
  permissoes: ReadonlySet<string>;
};

/** Monta o pedido para o servidor, ou null se ainda falta escolher algo. */
export function montarPedido(e: EstadoDoPedido): PedidoEmGrupo | null {
  if (e.permissoes.size === 0) return null;

  if (e.modo === "tipo") {
    return e.tipo ? { acao: e.acao, permissoes: [...e.permissoes], alvo: { tipo: e.tipo } } : null;
  }

  return e.usuarios.length > 0
    ? { acao: e.acao, permissoes: [...e.permissoes], alvo: { usuarios: [...e.usuarios] } }
    : null;
}

export const ROTULO_MOTIVO: Record<MotivoIgnorado, string> = {
  ajuste_individual: "tem ajuste individual (que tem prioridade sobre o grupo)",
  sem_mudanca: "já estava assim",
  fora_do_seu_limite: "a mudança envolve uma permissão que você não possui",
};

export const plural = (n: number, singular: string, pluralTexto: string): string =>
  `${n} ${n === 1 ? singular : pluralTexto}`;

export type ResumoDoResultado = {
  alterados: number;
  ajusteIndividual: string[];
  semMudanca: string[];
  foraDoLimite: string[];
  algoParaAplicar: boolean;
};

/** Agrupa o resultado por motivo (para mostrar "N alterados, M ignorados por ajuste individual..."). */
export function resumirResultado(res: ResultadoEmGrupo): ResumoDoResultado {
  const nomesDe = (motivo: MotivoIgnorado) => res.ignorados.filter((i) => i.motivo === motivo).map((i) => i.nome);

  return {
    alterados: res.alterados.length,
    ajusteIndividual: nomesDe("ajuste_individual"),
    semMudanca: nomesDe("sem_mudanca"),
    foraDoLimite: nomesDe("fora_do_seu_limite"),
    algoParaAplicar: res.alterados.length > 0,
  };
}

/** Frase curta com o resultado, ex.: "4 alterados · 2 ignorados por ajuste individual". */
export function frasePreview(res: ResultadoEmGrupo, acao: AcaoEmGrupo): string {
  const r = resumirResultado(res);
  const um = res.alterados.length === 1;
  const verbo = res.simulado
    ? `${um ? "vai" : "vão"} ${acao === "dar" ? "receber" : "perder"}`
    : acao === "dar"
      ? um ? "recebeu" : "receberam"
      : um ? "perdeu" : "perderam";

  if (res.total === 0) return "Nenhum funcionário encontrado para esse alvo.";

  const partes: string[] = [];

  partes.push(
    r.alterados > 0
      ? `${plural(r.alterados, "funcionário", "funcionários")} ${verbo}`
      : "Ninguém será alterado"
  );

  if (r.ajusteIndividual.length > 0) partes.push(`${plural(r.ajusteIndividual.length, "ignorado", "ignorados")} por ajuste individual`);
  if (r.semMudanca.length > 0) partes.push(`${r.semMudanca.length} já ${r.semMudanca.length === 1 ? "estava" : "estavam"} assim`);
  if (r.foraDoLimite.length > 0) partes.push(`${r.foraDoLimite.length} fora do seu limite`);

  return partes.join(" · ");
}
