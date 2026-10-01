import { describe, expect, it } from "vitest";
import { emailPareceValido, filtrarEmpresas, rotuloUltimoAcesso, textoDoAcesso } from "./empresasLogica";
import { empresa } from "./empresaFalsa";

const AGORA = new Date("2026-05-10T12:00:00Z").getTime();

describe("rotuloUltimoAcesso", () => {
  const atras = (ms: number) => new Date(AGORA - ms).toISOString();

  it("nunca acessou", () => {
    expect(rotuloUltimoAcesso(null, AGORA)).toBe("Nunca acessou");
    expect(rotuloUltimoAcesso(undefined, AGORA)).toBe("Nunca acessou");
  });

  it("escalas de tempo", () => {
    expect(rotuloUltimoAcesso(atras(20_000), AGORA)).toBe("agora mesmo");
    expect(rotuloUltimoAcesso(atras(5 * 60_000), AGORA)).toBe("há 5 min");
    expect(rotuloUltimoAcesso(atras(3 * 3600_000), AGORA)).toBe("há 3h");
    expect(rotuloUltimoAcesso(atras(30 * 3600_000), AGORA)).toBe("ontem");
    expect(rotuloUltimoAcesso(atras(4 * 86400_000), AGORA)).toBe("há 4 dias");
  });

  it("muito antigo mostra a data; data inválida não quebra", () => {
    expect(rotuloUltimoAcesso(atras(90 * 86400_000), AGORA)).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(rotuloUltimoAcesso("lixo", AGORA)).toBe("-");
  });

  it("instante no futuro (relógios diferentes) vira 'agora mesmo'", () => {
    expect(rotuloUltimoAcesso(new Date(AGORA + 60_000).toISOString(), AGORA)).toBe("agora mesmo");
  });
});

describe("filtrarEmpresas", () => {
  const lista = [
    empresa({ id: "1", nome: "Metalúrgica Silva", cnpj: "11222333000181" }),
    empresa({ id: "2", nome: "Plásticos Norte", razao_social: "Norte Polímeros S.A.", cnpj: "00000000000191", ativo: false, cidade: "Manaus" }),
    empresa({ id: "3", nome: "Cliente MEI", razao_social: null, cnpj: null, sem_cnpj: true, cidade: null }),
  ];
  const ids = (busca: string, situacao: "todas" | "ativas" | "inativas" = "todas") =>
    filtrarEmpresas(lista, busca, situacao).map((e) => e.id);

  it("busca ignora acento e maiúsculas", () => {
    expect(ids("metalurgica")).toEqual(["1"]);
    expect(ids("PLASTICOS")).toEqual(["2"]);
  });

  it("acha pela razão social e pela cidade", () => {
    expect(ids("polímeros")).toEqual(["2"]);
    expect(ids("manaus")).toEqual(["2"]);
  });

  it("acha pelo CNPJ, com ou sem máscara, inteiro ou em parte", () => {
    expect(ids("11.222.333/0001-81")).toEqual(["1"]);
    expect(ids("11222333000181")).toEqual(["1"]);
    expect(ids("222333")).toEqual(["1"]);
    expect(ids("0001-91")).toEqual(["2"]);
  });

  it("empresa sem CNPJ não quebra a busca", () => {
    expect(ids("mei")).toEqual(["3"]);
    expect(ids("999999")).toEqual([]);
  });

  it("filtra por situação", () => {
    expect(ids("", "ativas")).toEqual(["1", "3"]);
    expect(ids("", "inativas")).toEqual(["2"]);
    expect(ids("", "todas")).toHaveLength(3);
  });

  it("combina busca e situação", () => {
    expect(ids("norte", "ativas")).toEqual([]);
  });
});

describe("textoDoAcesso", () => {
  it("monta a mensagem para o gestor", () => {
    const txt = textoDoAcesso({ empresa: "Silva", email: "g@silva.com", senha: "Abc12345xyz9", url: "https://app.exemplo.com" });
    expect(txt).toContain("Silva");
    expect(txt).toContain("E-mail: g@silva.com");
    expect(txt).toContain("Senha temporária: Abc12345xyz9");
    expect(txt).toContain("Endereço: https://app.exemplo.com");
    expect(txt).toContain("trocar a senha");
  });

  it("sem endereço, a linha some", () => {
    expect(textoDoAcesso({ empresa: "S", email: "e@e.com", senha: "x" })).not.toContain("Endereço");
  });
});

describe("emailPareceValido", () => {
  it("aceita e recusa", () => {
    expect(emailPareceValido("a@b.com")).toBe(true);
    expect(emailPareceValido("  a@b.com ")).toBe(true);
    expect(emailPareceValido("a@b")).toBe(false);
    expect(emailPareceValido("sem-arroba.com")).toBe(false);
    expect(emailPareceValido("")).toBe(false);
  });
});
