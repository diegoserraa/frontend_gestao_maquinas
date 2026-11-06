import { describe, expect, it } from "vitest";
import {
  contagemPorPlano,
  diasDesde,
  empresasQuePedemAtencao,
  maisRecentes,
  novasNosUltimosDias,
  pendenciasDeCadastro,
} from "./dashboardAdminLogica";
import { empresa } from "./empresaFalsa";

const AGORA = new Date("2026-05-10T12:00:00Z").getTime();
const dias = (n: number) => new Date(AGORA - n * 86_400_000).toISOString();

describe("diasDesde", () => {
  it("conta dias inteiros", () => {
    expect(diasDesde(dias(0), AGORA)).toBe(0);
    expect(diasDesde(dias(3), AGORA)).toBe(3);
    expect(diasDesde(new Date(AGORA - 3.9 * 86_400_000).toISOString(), AGORA)).toBe(3);
  });

  it("futuro vale 0; vazio ou inválido vira null", () => {
    expect(diasDesde(new Date(AGORA + 86_400_000).toISOString(), AGORA)).toBe(0);
    expect(diasDesde(null, AGORA)).toBeNull();
    expect(diasDesde("lixo", AGORA)).toBeNull();
  });
});

describe("empresasQuePedemAtencao", () => {
  it("cliente que nunca entrou e já passou de 1 dia é sinalizado; o de hoje não", () => {
    const lista = empresasQuePedemAtencao(
      [empresa({ id: "hoje", criado_em: dias(0) }), empresa({ id: "velho", criado_em: dias(5) })],
      AGORA
    );
    expect(lista.map((a) => a.empresa.id)).toEqual(["velho"]);
    expect(lista[0].motivo).toBe("primeiro_acesso");
    expect(lista[0].rotulo).toContain("5 dias");
  });

  it("quem parou de acessar há mais de 7 dias é sinalizado; quem acessou na semana não", () => {
    const lista = empresasQuePedemAtencao(
      [empresa({ id: "ok", ultimo_acesso: dias(7) }), empresa({ id: "parou", ultimo_acesso: dias(8) })],
      AGORA
    );
    expect(lista.map((a) => a.empresa.id)).toEqual(["parou"]);
    expect(lista[0].motivo).toBe("sem_acesso");
  });

  it("empresa inativa não entra e a mais parada vem primeiro", () => {
    const lista = empresasQuePedemAtencao(
      [
        empresa({ id: "inativa", ativo: false, ultimo_acesso: dias(90) }),
        empresa({ id: "a", ultimo_acesso: dias(10) }),
        empresa({ id: "b", ultimo_acesso: dias(30) }),
      ],
      AGORA
    );
    expect(lista.map((a) => a.empresa.id)).toEqual(["b", "a"]);
  });
});

describe("pendenciasDeCadastro", () => {
  it("aponta o que falta para cobrar: CNPJ e/ou plano", () => {
    const lista = pendenciasDeCadastro([
      empresa({ id: "ok" }),
      empresa({ id: "sem-cnpj", nome: "B", cnpj: null }),
      empresa({ id: "sem-plano", nome: "C", plano: null }),
      empresa({ id: "nada", nome: "A", cnpj: null, plano: null }),
    ]);

    expect(lista.map((p) => [p.empresa.id, p.faltando])).toEqual([
      ["nada", ["CNPJ", "plano"]],
      ["sem-cnpj", ["CNPJ"]],
      ["sem-plano", ["plano"]],
    ]);
  });

  it("cliente marcado 'sem CNPJ' de propósito não é pendência; inativa também não", () => {
    expect(pendenciasDeCadastro([empresa({ cnpj: null, sem_cnpj: true })])).toEqual([]);
    expect(pendenciasDeCadastro([empresa({ cnpj: null, plano: null, ativo: false })])).toEqual([]);
  });
});

describe("maisRecentes", () => {
  it("as mais novas primeiro, limitadas, sem alterar a lista original", () => {
    const original = [empresa({ id: "1", criado_em: dias(10) }), empresa({ id: "2", criado_em: dias(1) }), empresa({ id: "3", criado_em: dias(5) })];
    expect(maisRecentes(original, 2).map((e) => e.id)).toEqual(["2", "3"]);
    expect(original.map((e) => e.id)).toEqual(["1", "2", "3"]);
  });
});

describe("novasNosUltimosDias", () => {
  it("conta as cadastradas na janela", () => {
    const lista = [empresa({ criado_em: dias(0) }), empresa({ criado_em: dias(29) }), empresa({ criado_em: dias(30) }), empresa({ criado_em: dias(200) })];
    expect(novasNosUltimosDias(lista, 30, AGORA)).toBe(2);
    expect(novasNosUltimosDias([], 30, AGORA)).toBe(0);
  });
});

describe("contagemPorPlano", () => {
  it("conta só as ativas, separando as sem plano", () => {
    const c = contagemPorPlano([
      empresa({ plano: "BASICO" }),
      empresa({ plano: "BASICO" }),
      empresa({ plano: "PROFISSIONAL" }),
      empresa({ plano: "EMPRESARIAL", ativo: false }),
      empresa({ plano: null }),
    ]);
    expect(c).toEqual({ BASICO: 2, PROFISSIONAL: 1, EMPRESARIAL: 0, SEM_PLANO: 1 });
  });
});
