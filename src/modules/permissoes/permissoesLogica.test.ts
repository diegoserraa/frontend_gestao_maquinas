import { describe, expect, it } from "vitest";
import {
  alternarModulo,
  completar,
  contarDoModulo,
  definirEscopoOS,
  desligar,
  diferenca,
  escopoDeOS,
  ligar,
  mesmoConjunto,
  podar,
  rotulosDe,
} from "./permissoesLogica";
import type { AcaoCatalogo, Catalogo } from "./permissoesTypes";

/** Catálogo reduzido, com a mesma FORMA do que o backend entrega em /permissoes/catalogo. */
const acao = (permissao: string, extra: Partial<AcaoCatalogo> = {}): AcaoCatalogo => ({
  permissao,
  rotulo: permissao.split(".")[1],
  descricao: "",
  requer: [],
  requerUmDe: [],
  ...extra,
});

const VER_OS = ["os.ver_proprias", "os.ver"];

const catalogo: Catalogo = {
  modulos: [
    {
      chave: "maquinas",
      rotulo: "Máquinas",
      descricao: "",
      acesso: "maquinas.ver",
      acoes: [
        acao("maquinas.ver"),
        acao("maquinas.criar", { requer: ["maquinas.ver"] }),
        acao("maquinas.editar", { requer: ["maquinas.ver"] }),
      ],
    },
    {
      chave: "os",
      rotulo: "Ordens de serviço",
      descricao: "",
      acesso: "os.ver",
      acoes: [
        acao("os.ver"),
        acao("os.ver_proprias"),
        acao("os.criar", { requerUmDe: VER_OS }),
        acao("os.iniciar", { requerUmDe: VER_OS }),
        acao("os.agir_em_qualquer", { requerUmDe: VER_OS }),
        acao("os.definir_externo", { requer: ["os.iniciar", "os.agir_em_qualquer"] }),
      ],
    },
    {
      chave: "monitoramento",
      rotulo: "Monitoramento",
      descricao: "",
      acesso: "monitoramento.ver",
      acoes: [
        acao("monitoramento.ver"),
        acao("monitoramento.abrir_os", { requer: ["monitoramento.ver", "os.criar"] }),
      ],
    },
  ],
  padroes: { GESTOR: [], TECNICO: [], OPERADOR: [] },
};

const S = (...p: string[]) => new Set(p);

describe("completar (liga o que a permissão exige)", () => {
  it("editar máquina traz ver máquinas", () => {
    expect(completar(["maquinas.editar"], catalogo)).toEqual(S("maquinas.editar", "maquinas.ver"));
  });

  it("'um de': sem nenhum ver de O.S., entra o de menor privilégio (só as minhas)", () => {
    const r = completar(["os.criar"], catalogo);
    expect(r.has("os.ver_proprias")).toBe(true);
    expect(r.has("os.ver")).toBe(false);
  });

  it("'um de': se já vê todas, não acrescenta 'só as minhas'", () => {
    expect(completar(["os.ver", "os.criar"], catalogo)).toEqual(S("os.ver", "os.criar"));
  });

  it("cadeia: definir externo traz iniciar, agir em outros e o ver", () => {
    const r = completar(["os.definir_externo"], catalogo);
    expect([...r].sort()).toEqual(["os.agir_em_qualquer", "os.definir_externo", "os.iniciar", "os.ver_proprias"]);
  });

  it("dependência entre módulos: abrir O.S. pelo alerta traz criar O.S. e ver monitoramento", () => {
    const r = completar(["monitoramento.abrir_os"], catalogo);
    expect(r).toEqual(expect.objectContaining(new Set(["monitoramento.ver", "os.criar", "os.ver_proprias", "monitoramento.abrir_os"])));
  });

  it("ignora permissões desconhecidas e não altera a entrada", () => {
    const entrada = S("voar.alto");
    expect(completar(entrada, catalogo)).toEqual(S("voar.alto"));
    expect(entrada).toEqual(S("voar.alto"));
  });
});

describe("podar (remove o que perdeu a base)", () => {
  it("sem ver máquinas, caem criar e editar", () => {
    expect(podar(S("maquinas.criar", "maquinas.editar"), catalogo)).toEqual(S());
  });

  it("com 'ver todas' ou 'só as minhas' as ações de O.S. se mantêm", () => {
    expect(podar(S("os.criar", "os.ver"), catalogo)).toEqual(S("os.criar", "os.ver"));
    expect(podar(S("os.criar", "os.ver_proprias"), catalogo)).toEqual(S("os.criar", "os.ver_proprias"));
  });

  it("perdendo um requisito no meio da cadeia, cai tudo que dependia dele", () => {
    const r = podar(S("os.ver", "os.definir_externo", "os.agir_em_qualquer"), catalogo); // falta os.iniciar
    expect(r).toEqual(S("os.ver", "os.agir_em_qualquer"));
  });
});

describe("ligar / desligar", () => {
  it("ligar traz dependências e não mexe no resto", () => {
    expect(ligar(S("setores.ver"), "maquinas.criar", catalogo)).toEqual(S("setores.ver", "maquinas.criar", "maquinas.ver"));
  });

  it("desligar 'ver máquinas' leva junto criar/editar", () => {
    const r = desligar(S("maquinas.ver", "maquinas.criar", "os.ver"), "maquinas.ver", catalogo);
    expect(r).toEqual(S("os.ver"));
  });

  it("desligar 'criar O.S.' leva junto 'abrir O.S. pelo alerta' (que dependia dela)", () => {
    const r = desligar(S("os.ver", "os.criar", "monitoramento.ver", "monitoramento.abrir_os"), "os.criar", catalogo);
    expect(r).toEqual(S("os.ver", "monitoramento.ver"));
  });

  it("ligar e desligar são inversos quando não há dependentes", () => {
    const base = S("os.ver");
    expect(desligar(ligar(base, "os.iniciar", catalogo), "os.iniciar", catalogo)).toEqual(base);
  });
});

describe("tela inteira (módulo)", () => {
  const maquinas = catalogo.modulos[0];

  it("ligar a tela liga só o acesso", () => {
    expect(alternarModulo(S(), maquinas, true, catalogo)).toEqual(S("maquinas.ver"));
  });

  it("desligar a tela remove todas as ações dela", () => {
    expect(alternarModulo(S("maquinas.ver", "maquinas.criar", "os.ver"), maquinas, false, catalogo)).toEqual(S("os.ver"));
  });

  it("contagem do cartão", () => {
    expect(contarDoModulo(S("maquinas.ver", "maquinas.criar"), maquinas)).toEqual({ ligadas: 2, total: 3 });
  });
});

describe("O.S.: quais enxerga (nenhuma / só as minhas / todas)", () => {
  it("lê o escopo atual", () => {
    expect(escopoDeOS(S())).toBe("nenhuma");
    expect(escopoDeOS(S("os.ver_proprias"))).toBe("proprias");
    expect(escopoDeOS(S("os.ver"))).toBe("todas");
    expect(escopoDeOS(S("os.ver", "os.ver_proprias"))).toBe("todas");
  });

  it("de 'só as minhas' para 'todas' troca o ver e mantém as ações", () => {
    const r = definirEscopoOS(S("os.ver_proprias", "os.criar"), "todas", catalogo);
    expect(r).toEqual(S("os.ver", "os.criar"));
  });

  it("de 'todas' para 'só as minhas' mantém as ações", () => {
    const r = definirEscopoOS(S("os.ver", "os.criar"), "proprias", catalogo);
    expect(r).toEqual(S("os.ver_proprias", "os.criar"));
  });

  it("'nenhuma' remove tudo de O.S. e o que dependia (abrir pelo alerta)", () => {
    const r = definirEscopoOS(S("os.ver", "os.criar", "os.iniciar", "monitoramento.ver", "monitoramento.abrir_os", "maquinas.ver"), "nenhuma", catalogo);
    expect(r).toEqual(S("monitoramento.ver", "maquinas.ver"));
  });
});

describe("comparação e histórico", () => {
  it("diferença entre dois conjuntos", () => {
    expect(diferenca(["a", "b"], ["b", "c"])).toEqual({ adicionadas: ["c"], removidas: ["a"] });
    expect(diferenca([], [])).toEqual({ adicionadas: [], removidas: [] });
  });

  it("mesmoConjunto ignora a ordem", () => {
    expect(mesmoConjunto(S("a", "b"), S("b", "a"))).toBe(true);
    expect(mesmoConjunto(S("a"), S("a", "b"))).toBe(false);
  });

  it("rótulos legíveis: 'Máquinas › criar'", () => {
    expect(rotulosDe(catalogo).get("maquinas.criar")).toBe("Máquinas › criar");
  });
});
