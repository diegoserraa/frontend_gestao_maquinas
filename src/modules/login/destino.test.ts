import { beforeEach, describe, expect, it, vi } from "vitest";

import { consumirDestino, destinoSeguro, guardarDestino } from "./destino";

describe("destinoSeguro", () => {
  it("aceita caminhos internos, com busca e âncora", () => {
    expect(destinoSeguro("/machines/12")).toBe("/machines/12");
    expect(destinoSeguro("/machines/12?tab=os")).toBe("/machines/12?tab=os");
    expect(destinoSeguro("/ordens-servico/7#linha")).toBe("/ordens-servico/7#linha");
    expect(destinoSeguro("/")).toBe("/");
  });

  it("recusa qualquer endereço que saia do sistema", () => {
    for (const perigoso of [
      "//site-malicioso.com",
      "https://site-malicioso.com",
      "http://localhost:5173/machines/1",
      "javascript:alert(1)",
      "/\\site-malicioso.com",
      "\\\\site-malicioso.com",
      "machines/12",
      "",
      null,
      undefined,
    ]) {
      expect(destinoSeguro(perigoso as any), String(perigoso)).toBeNull();
    }
  });

  it("recusa caracteres de controle", () => {
    expect(destinoSeguro("/machines/1\r\nSet-Cookie: x=1")).toBeNull();
    expect(destinoSeguro("/machines/1\u0000")).toBeNull();
  });

  it("as telas de entrada não são destino (evita laço)", () => {
    for (const tela of ["/login", "/login?x=1", "/trocar-senha", "/trocar-senha/"]) {
      expect(destinoSeguro(tela), tela).toBeNull();
    }
    expect(destinoSeguro("/loginfake")).toBe("/loginfake");
  });
});

/** sessionStorage de mentira (o ambiente de teste é Node, sem navegador). */
function armazenamentoFalso() {
  const dados = new Map<string, string>();
  return {
    getItem: (k: string) => dados.get(k) ?? null,
    setItem: (k: string, v: string) => void dados.set(k, v),
    removeItem: (k: string) => void dados.delete(k),
    clear: () => dados.clear(),
  };
}

describe("guardar e consumir", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", armazenamentoFalso());
  });

  it("volta o que foi guardado e só uma vez", () => {
    guardarDestino("/machines/12?tab=os");

    expect(consumirDestino()).toBe("/machines/12?tab=os");
    expect(consumirDestino()).toBeNull();
  });

  it("não guarda destino inseguro", () => {
    guardarDestino("//site-malicioso.com");
    guardarDestino("/login");

    expect(consumirDestino()).toBeNull();
  });

  it("valor adulterado no armazenamento também é recusado na leitura", () => {
    sessionStorage.setItem("destino_pos_login", "https://site-malicioso.com");

    expect(consumirDestino()).toBeNull();
    expect(sessionStorage.getItem("destino_pos_login")).toBeNull();
  });

  it("guardar de novo substitui o anterior", () => {
    guardarDestino("/machines/1");
    guardarDestino("/machines/2");

    expect(consumirDestino()).toBe("/machines/2");
  });
});
