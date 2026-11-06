import { describe, expect, it } from "vitest";
import { forcaDaSenha, problemaNaNovaSenha, regrasDaSenha } from "./senhaLogica";

describe("problemaNaNovaSenha", () => {
  it("espelha as regras do servidor", () => {
    expect(problemaNaNovaSenha("Ab1", "antiga")).toMatch(/8 caracteres/);
    expect(problemaNaNovaSenha("SomenteLetras", "antiga")).toMatch(/letras e números/);
    expect(problemaNaNovaSenha("1234567890", "antiga")).toMatch(/letras e números/);
    expect(problemaNaNovaSenha("Senha1234", "Senha1234")).toMatch(/diferente/);
    expect(problemaNaNovaSenha("Senha1234", "antiga")).toBeNull();
  });

  it("limite de 72 bytes (o servidor não leria o fim)", () => {
    expect(problemaNaNovaSenha("Ab1" + "x".repeat(69), "antiga")).toBeNull(); // 72
    expect(problemaNaNovaSenha("Ab1" + "x".repeat(70), "antiga")).toMatch(/72/); // 73
    expect(problemaNaNovaSenha("Ab1" + "é".repeat(36), "antiga")).toMatch(/72/); // 75 bytes, 39 caracteres
  });

  it("aceita espaços, símbolos e acentos", () => {
    expect(problemaNaNovaSenha("Sénha forte #1 ção", "antiga")).toBeNull();
  });
});

describe("regrasDaSenha", () => {
  const estado = (nova: string, atual = "antiga1", conf = "") => Object.fromEntries(regrasDaSenha(nova, atual, conf).map((r) => [r.chave, r.ok]));

  it("tudo apagado enquanto não digita", () => {
    expect(estado("", "", "")).toEqual({ tamanho: false, mistura: false, diferente: false, confere: false });
  });

  it("marca cada regra conforme é cumprida", () => {
    expect(estado("abcdefgh")).toMatchObject({ tamanho: true, mistura: false });
    expect(estado("abcd1234")).toMatchObject({ tamanho: true, mistura: true, diferente: true, confere: false });
    expect(estado("abcd1234", "antiga1", "abcd1234")).toMatchObject({ confere: true });
  });

  it("senha igual à atual não cumpre 'diferente'", () => {
    expect(estado("abcd1234", "abcd1234")).toMatchObject({ diferente: false });
  });

  it("acima de 72 bytes o tamanho deixa de valer", () => {
    expect(estado("Ab1" + "x".repeat(70))).toMatchObject({ tamanho: false });
  });
});

describe("forcaDaSenha", () => {
  it("vazia não tem nível", () => {
    expect(forcaDaSenha("")).toEqual({ nivel: 0, rotulo: "" });
  });

  it("fraca, boa e forte", () => {
    expect(forcaDaSenha("abc").rotulo).toBe("Fraca");
    expect(forcaDaSenha("abcdefgh").rotulo).toBe("Fraca");
    expect(forcaDaSenha("abcd1234").nivel).toBeLessThanOrEqual(2);
    expect(forcaDaSenha("Trator2026x").rotulo).toBe("Boa");
    expect(forcaDaSenha("Trator@2026-Forte").rotulo).toBe("Forte");
  });

  it("padrões óbvios ficam fracos mesmo compridos", () => {
    expect(forcaDaSenha("aaaaaaaaaaaaaaaa").rotulo).toBe("Fraca");
    expect(forcaDaSenha("12345678901234").rotulo).toBe("Fraca");
    expect(forcaDaSenha("Senha1234567890").rotulo).toBe("Fraca");
  });
});
