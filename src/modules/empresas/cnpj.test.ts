import { describe, expect, it } from "vitest";

import { cnpjValido, mascaraCnpj, mascaraTelefone, somenteDigitos, telefoneValido } from "./cnpj";

describe("cnpjValido", () => {
  it("aceita CNPJ válido, com ou sem máscara", () => {
    expect(cnpjValido("11.222.333/0001-81")).toBe(true);
    expect(cnpjValido("11222333000181")).toBe(true);
    expect(cnpjValido("00.000.000/0001-91")).toBe(true);
  });

  it("recusa dígito verificador errado, tamanho errado, letras e vazio", () => {
    expect(cnpjValido("11.222.333/0001-82")).toBe(false);
    expect(cnpjValido("1122233300018")).toBe(false);
    expect(cnpjValido("112223330001811")).toBe(false);
    expect(cnpjValido("ABCDEFGHIJKLMN")).toBe(false);
    expect(cnpjValido("")).toBe(false);
  });

  it("recusa sequências repetidas", () => {
    for (let d = 0; d <= 9; d++) expect(cnpjValido(String(d).repeat(14))).toBe(false);
  });
});

describe("mascaraCnpj", () => {
  it("formata aos poucos, enquanto digita", () => {
    expect(mascaraCnpj("1")).toBe("1");
    expect(mascaraCnpj("112")).toBe("11.2");
    expect(mascaraCnpj("11222")).toBe("11.222");
    expect(mascaraCnpj("112223")).toBe("11.222.3");
    expect(mascaraCnpj("11222333")).toBe("11.222.333");
    expect(mascaraCnpj("112223330")).toBe("11.222.333/0");
    expect(mascaraCnpj("112223330001")).toBe("11.222.333/0001");
    expect(mascaraCnpj("1122233300018")).toBe("11.222.333/0001-8");
    expect(mascaraCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });

  it("ignora o que não é dígito e corta o excesso", () => {
    expect(mascaraCnpj("11.222.333/0001-81999")).toBe("11.222.333/0001-81");
    expect(mascaraCnpj("ab")).toBe("");
    expect(mascaraCnpj("")).toBe("");
  });

  it("aplicar a máscara de novo não muda nada", () => {
    expect(mascaraCnpj(mascaraCnpj("11222333000181"))).toBe("11.222.333/0001-81");
  });
});

describe("telefone", () => {
  it("formata celular e fixo", () => {
    expect(mascaraTelefone("11912345678")).toBe("(11) 91234-5678");
    expect(mascaraTelefone("1133334444")).toBe("(11) 3333-4444");
    expect(mascaraTelefone("119")).toBe("(11) 9");
    expect(mascaraTelefone("1")).toBe("1");
    expect(mascaraTelefone("")).toBe("");
  });

  it("valida só com DDD (10 ou 11 dígitos)", () => {
    expect(telefoneValido("(11) 91234-5678")).toBe(true);
    expect(telefoneValido("1133334444")).toBe(true);
    expect(telefoneValido("91234-5678")).toBe(false);
    expect(telefoneValido("123")).toBe(false);
  });

  it("somenteDigitos", () => {
    expect(somenteDigitos("(11) 91234-5678")).toBe("11912345678");
  });
});
