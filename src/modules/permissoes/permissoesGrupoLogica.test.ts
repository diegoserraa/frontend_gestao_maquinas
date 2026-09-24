import { describe, expect, it } from "vitest";
import {
  alternarNaEscolha,
  frasePreview,
  montarPedido,
  plural,
  resumirResultado,
} from "./permissoesGrupoLogica";
import type { AcaoCatalogo, Catalogo, ResultadoEmGrupo } from "./permissoesTypes";

const acao = (permissao: string, extra: Partial<AcaoCatalogo> = {}): AcaoCatalogo => ({
  permissao,
  rotulo: permissao.split(".")[1],
  descricao: "",
  requer: [],
  requerUmDe: [],
  ...extra,
});

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
  ],
  padroes: { GESTOR: [], TECNICO: [], OPERADOR: [] },
};

const resultado = (extra: Partial<ResultadoEmGrupo> = {}): ResultadoEmGrupo => ({
  simulado: true,
  total: 0,
  alterados: [],
  ignorados: [],
  ...extra,
});

describe("alternarNaEscolha", () => {
  it("dar: ligar traz a dependência junto", () => {
    const r = alternarNaEscolha(new Set(), "maquinas.criar", true, "dar", catalogo);
    expect([...r].sort()).toEqual(["maquinas.criar", "maquinas.ver"]);
  });

  it("dar: desligar leva junto quem dependia", () => {
    const r = alternarNaEscolha(new Set(["maquinas.ver", "maquinas.criar"]), "maquinas.ver", false, "dar", catalogo);
    expect(r.size).toBe(0);
  });

  it("retirar: cada permissão é independente", () => {
    const r = alternarNaEscolha(new Set(), "maquinas.ver", true, "retirar", catalogo);
    expect([...r]).toEqual(["maquinas.ver"]);
    const s = alternarNaEscolha(r, "maquinas.criar", true, "retirar", catalogo);
    expect([...s].sort()).toEqual(["maquinas.criar", "maquinas.ver"]);
    expect([...alternarNaEscolha(s, "maquinas.ver", false, "retirar", catalogo)]).toEqual(["maquinas.criar"]);
  });

  it("não altera o conjunto recebido", () => {
    const atual = new Set(["maquinas.ver"]);
    alternarNaEscolha(atual, "maquinas.editar", true, "retirar", catalogo);
    expect([...atual]).toEqual(["maquinas.ver"]);
  });
});

describe("montarPedido", () => {
  const base = { modo: "tipo" as const, tipo: "TECNICO" as const, usuarios: [], acao: "dar" as const };

  it("sem permissões escolhidas não monta pedido", () => {
    expect(montarPedido({ ...base, permissoes: new Set() })).toBeNull();
  });

  it("por tipo exige o tipo", () => {
    expect(montarPedido({ ...base, tipo: null, permissoes: new Set(["maquinas.ver"]) })).toBeNull();
    expect(montarPedido({ ...base, permissoes: new Set(["maquinas.ver"]) })).toEqual({
      acao: "dar",
      permissoes: ["maquinas.ver"],
      alvo: { tipo: "TECNICO" },
    });
  });

  it("por seleção exige ao menos um funcionário", () => {
    const e = { ...base, modo: "selecao" as const, permissoes: new Set(["maquinas.ver"]) };
    expect(montarPedido(e)).toBeNull();
    expect(montarPedido({ ...e, usuarios: [3, 7], acao: "retirar" })).toEqual({
      acao: "retirar",
      permissoes: ["maquinas.ver"],
      alvo: { usuarios: [3, 7] },
    });
  });
});

describe("resumirResultado e frasePreview", () => {
  const res = resultado({
    total: 6,
    alterados: [
      { id: 1, nome: "A" },
      { id: 2, nome: "B" },
    ],
    ignorados: [
      { id: 3, nome: "C", motivo: "ajuste_individual" },
      { id: 4, nome: "D", motivo: "sem_mudanca" },
      { id: 5, nome: "E", motivo: "sem_mudanca" },
      { id: 6, nome: "F", motivo: "fora_do_seu_limite" },
    ],
  });

  it("agrupa por motivo", () => {
    const r = resumirResultado(res);
    expect(r.alterados).toBe(2);
    expect(r.ajusteIndividual).toEqual(["C"]);
    expect(r.semMudanca).toEqual(["D", "E"]);
    expect(r.foraDoLimite).toEqual(["F"]);
    expect(r.algoParaAplicar).toBe(true);
  });

  it("frase da simulação", () => {
    expect(frasePreview(res, "dar")).toBe(
      "2 funcionários vão receber · 1 ignorado por ajuste individual · 2 já estavam assim · 1 fora do seu limite"
    );
  });

  it("singular, retirar e já aplicado", () => {
    const um = resultado({ total: 1, alterados: [{ id: 1, nome: "A" }] });
    expect(frasePreview(um, "retirar")).toBe("1 funcionário vai perder");
    expect(frasePreview({ ...um, simulado: false }, "dar")).toBe("1 funcionário recebeu");
  });

  it("ninguém alterado e ninguém encontrado", () => {
    expect(frasePreview(resultado({ total: 1, ignorados: [{ id: 1, nome: "A", motivo: "sem_mudanca" }] }), "dar")).toBe(
      "Ninguém será alterado · 1 já estava assim"
    );
    expect(frasePreview(resultado(), "dar")).toBe("Nenhum funcionário encontrado para esse alvo.");
    expect(resumirResultado(resultado()).algoParaAplicar).toBe(false);
  });
});

describe("plural", () => {
  it("usa singular só para 1", () => {
    expect(plural(1, "item", "itens")).toBe("1 item");
    expect(plural(0, "item", "itens")).toBe("0 itens");
    expect(plural(2, "item", "itens")).toBe("2 itens");
  });
});
