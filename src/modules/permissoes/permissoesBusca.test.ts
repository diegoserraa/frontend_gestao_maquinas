import { describe, expect, it } from "vitest";
import { acoesVisiveis, casaComBusca, iniciais, normalizarTexto } from "./permissoesBusca";
import type { AcaoCatalogo, ModuloCatalogo } from "./permissoesTypes";

const acao = (permissao: string, rotulo: string, descricao = ""): AcaoCatalogo => ({
  permissao,
  rotulo,
  descricao,
  requer: [],
  requerUmDe: [],
});

const modulo: ModuloCatalogo = {
  chave: "maquinas",
  rotulo: "Máquinas",
  descricao: "Cadastro e detalhes",
  acesso: "maquinas.ver",
  acoes: [acao("maquinas.ver", "Ver máquinas"), acao("maquinas.criar", "Cadastrar", "Cadastrar novas"), acao("maquinas.excluir", "Excluir", "Apagar")],
};

describe("normalizarTexto / casaComBusca", () => {
  it("ignora acento e maiúsculas", () => {
    expect(normalizarTexto("  MÁQUINAS ")).toBe("maquinas");
    expect(casaComBusca(["Máquinas"], "maquina")).toBe(true);
  });

  it("várias palavras: todas precisam aparecer, em qualquer ordem", () => {
    expect(casaComBusca(["Ver máquinas"], "maq ver")).toBe(true);
    expect(casaComBusca(["Ver máquinas"], "maq excluir")).toBe(false);
  });

  it("busca vazia casa com tudo", () => {
    expect(casaComBusca(["x"], "   ")).toBe(true);
  });
});

describe("acoesVisiveis", () => {
  it("sem busca: todas", () => {
    expect(acoesVisiveis(modulo, "")).toHaveLength(3);
  });

  it("busca que casa com o módulo mostra todas as ações", () => {
    expect(acoesVisiveis(modulo, "maquinas")).toHaveLength(3);
  });

  it("busca que casa só com uma ação mostra só ela", () => {
    expect(acoesVisiveis(modulo, "apagar")?.map((a) => a.permissao)).toEqual(["maquinas.excluir"]);
  });

  it("nada casa: null (o módulo some)", () => {
    expect(acoesVisiveis(modulo, "relatório")).toBeNull();
  });
});

describe("iniciais", () => {
  it("primeira e última palavra", () => {
    expect(iniciais("Maria da Silva")).toBe("MS");
    expect(iniciais("joão")).toBe("JO");
    expect(iniciais("__TESTE_A")).toBe("TA");
    expect(iniciais("")).toBe("?");
  });
});
