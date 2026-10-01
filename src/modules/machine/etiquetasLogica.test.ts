import { describe, expect, it } from "vitest";

import {
  calcularGrade,
  ETIQUETA_PADRAO,
  FOLHA_A4,
  limitarLinhas,
  nomeDoArquivo,
  paraNomeDeArquivo,
  posicaoDaEtiqueta,
  totalDeFolhas,
} from "./etiquetasLogica";

describe("calcularGrade", () => {
  it("etiqueta 60x30 em A4: 3 colunas x 9 linhas = 27 por folha, centralizado", () => {
    const g = calcularGrade();

    expect(g).toMatchObject({ colunas: 3, linhas: 9, porFolha: 27 });
    expect(g.margemX).toBeCloseTo(15); // (210 - 180) / 2
    expect(g.margemY).toBeCloseTo(13.5); // (297 - 270) / 2
  });

  it("a grade nunca invade a margem de segurança da impressora", () => {
    for (const etiqueta of [{ largura: 60, altura: 30 }, { largura: 50, altura: 30 }, { largura: 45, altura: 45 }, { largura: 70, altura: 40 }]) {
      const g = calcularGrade(etiqueta);

      expect(g.margemX).toBeGreaterThanOrEqual(5 - 1e-9);
      expect(g.margemY).toBeGreaterThanOrEqual(5 - 1e-9);
      expect(g.margemX + g.colunas * etiqueta.largura).toBeLessThanOrEqual(FOLHA_A4.largura - 5 + 1e-9);
      expect(g.margemY + g.linhas * etiqueta.altura).toBeLessThanOrEqual(FOLHA_A4.altura - 5 + 1e-9);
    }
  });

  it("etiqueta maior que a folha ainda cabe uma (não quebra)", () => {
    expect(calcularGrade({ largura: 400, altura: 500 }).porFolha).toBe(1);
  });
});

describe("posicaoDaEtiqueta", () => {
  const g = calcularGrade();

  it("preenche da esquerda para a direita e de cima para baixo", () => {
    expect(posicaoDaEtiqueta(0, g)).toEqual({ folha: 0, x: g.margemX, y: g.margemY });
    expect(posicaoDaEtiqueta(1, g)).toEqual({ folha: 0, x: g.margemX + ETIQUETA_PADRAO.largura, y: g.margemY });
    expect(posicaoDaEtiqueta(3, g)).toEqual({ folha: 0, x: g.margemX, y: g.margemY + ETIQUETA_PADRAO.altura });
  });

  it("a etiqueta seguinte à última da folha vai para o começo da folha nova", () => {
    expect(posicaoDaEtiqueta(26, g).folha).toBe(0);
    expect(posicaoDaEtiqueta(27, g)).toEqual({ folha: 1, x: g.margemX, y: g.margemY });
    expect(posicaoDaEtiqueta(54, g).folha).toBe(2);
  });

  it("nenhuma etiqueta se sobrepõe a outra", () => {
    const pontos = new Set(Array.from({ length: 60 }, (_, i) => {
      const p = posicaoDaEtiqueta(i, g);
      return `${p.folha}:${p.x}:${p.y}`;
    }));
    expect(pontos.size).toBe(60);
  });
});

describe("totalDeFolhas", () => {
  const g = calcularGrade();

  it("arredonda para cima; nada para imprimir = 0", () => {
    expect(totalDeFolhas(0, g)).toBe(0);
    expect(totalDeFolhas(1, g)).toBe(1);
    expect(totalDeFolhas(27, g)).toBe(1);
    expect(totalDeFolhas(28, g)).toBe(2);
    expect(totalDeFolhas(500, g)).toBe(19);
  });
});

describe("limitarLinhas", () => {
  it("não mexe no que cabe", () => {
    expect(limitarLinhas(["a", "b"], 3)).toEqual(["a", "b"]);
  });

  it("corta o excesso e marca com reticências, sem deixar pontuação pendurada", () => {
    expect(limitarLinhas(["Injetora", "Principal da", "Linha 3 -", "Setor B"], 3)).toEqual(["Injetora", "Principal da", "Linha 3…"]);
  });
});

describe("nomes de arquivo", () => {
  it("tira acento, espaço e símbolo", () => {
    expect(paraNomeDeArquivo("Injetora Principal #2")).toBe("injetora-principal-2");
    expect(paraNomeDeArquivo("Máquina de Solda / Ação")).toBe("maquina-de-solda-acao");
    expect(paraNomeDeArquivo("///")).toBe("maquina");
    expect(paraNomeDeArquivo("../../etc/passwd")).toBe("etc-passwd");
  });

  it("uma máquina: nome dela; várias: data e quantidade; com setor, o setor entra", () => {
    const quando = new Date(2026, 8, 24, 10, 0, 0);

    expect(nomeDoArquivo([{ nome: "Injetora Principal" }])).toBe("etiqueta-qr-injetora-principal.pdf");
    expect(nomeDoArquivo([{ nome: "A" }, { nome: "B" }], null, quando)).toBe("etiquetas-qr-2026-09-24-2-maquinas.pdf");
    expect(nomeDoArquivo([{ nome: "A" }, { nome: "B" }, { nome: "C" }], "Usinagem", quando)).toBe("etiquetas-qr-usinagem-2026-09-24-3-maquinas.pdf");
  });
});
