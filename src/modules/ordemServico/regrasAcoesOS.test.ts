import { describe, expect, it } from "vitest";
import { acoesDaOS } from "./regrasAcoesOS";

const com = (...permissoes: string[]) => {
  const s = new Set(permissoes);
  return (p: string) => s.has(p);
};

const ID = 10;

const TUDO = [
  "os.ver", "os.assumir", "os.iniciar", "os.finalizar", "os.atribuir",
  "os.definir_externo", "os.cancelar", "os.agir_em_qualquer",
];

describe("botões da O.S. por permissão e estado", () => {
  it("assumir: só O.S. aberta, não externa, e com a permissão", () => {
    const os = { status: "ABERTA", id_tecnico: null };
    expect(acoesDaOS(os, ID, com("os.assumir")).assumir).toBe(true);
    expect(acoesDaOS(os, ID, com()).assumir).toBe(false);
    expect(acoesDaOS({ ...os, status: "ATRIBUIDA" }, ID, com("os.assumir")).assumir).toBe(false);
    expect(acoesDaOS({ ...os, execucao_externa: true }, ID, com("os.assumir")).assumir).toBe(false);
  });

  it("iniciar: só a O.S. atribuída a ele (não a de outro, nem a externa)", () => {
    const pode = com("os.iniciar");
    expect(acoesDaOS({ status: "ATRIBUIDA", id_tecnico: ID }, ID, pode).iniciar).toBe(true);
    expect(acoesDaOS({ status: "ATRIBUIDA", id_tecnico: 99 }, ID, pode).iniciar).toBe(false);
    expect(acoesDaOS({ status: "ATRIBUIDA", id_tecnico: ID, execucao_externa: true }, ID, pode).iniciar).toBe(false);
    expect(acoesDaOS({ status: "ABERTA", id_tecnico: ID }, ID, pode).iniciar).toBe(false);
  });

  it("finalizar: técnico na dele em andamento; quem age em qualquer, em qualquer uma em andamento", () => {
    const tecnico = com("os.finalizar");
    expect(acoesDaOS({ status: "EM_ANDAMENTO", id_tecnico: ID }, ID, tecnico).finalizar).toBe(true);
    expect(acoesDaOS({ status: "EM_ANDAMENTO", id_tecnico: 99 }, ID, tecnico).finalizar).toBe(false);
    expect(acoesDaOS({ status: "ATRIBUIDA", id_tecnico: ID }, ID, tecnico).finalizar).toBe(false);

    const gestor = com("os.finalizar", "os.agir_em_qualquer");
    expect(acoesDaOS({ status: "EM_ANDAMENTO", id_tecnico: 99 }, ID, gestor).finalizar).toBe(true);
  });

  it("finalizar externa: só com 'agir em qualquer' e em qualquer estado aberto", () => {
    const os = { status: "ATRIBUIDA", id_tecnico: null, execucao_externa: true };
    expect(acoesDaOS(os, ID, com("os.finalizar", "os.agir_em_qualquer")).finalizar).toBe(true);
    expect(acoesDaOS(os, ID, com("os.finalizar")).finalizar).toBe(false);
    expect(acoesDaOS({ ...os, status: "FINALIZADA" }, ID, com("os.finalizar", "os.agir_em_qualquer")).finalizar).toBe(false);
  });

  it("atribuir e definir externo: só sem executor e enquanto a O.S. está aberta", () => {
    const pode = com("os.atribuir", "os.definir_externo");
    const livre = { status: "ABERTA", id_tecnico: null };
    expect(acoesDaOS(livre, ID, pode)).toMatchObject({ atribuir: true, definirExterno: true });

    expect(acoesDaOS({ ...livre, id_tecnico: 5 }, ID, pode)).toMatchObject({ atribuir: false, definirExterno: false });
    expect(acoesDaOS({ ...livre, status: "FINALIZADA" }, ID, pode)).toMatchObject({ atribuir: false, definirExterno: false });
  });

  it("REGRESSÃO: depois de marcada como externa, não oferece atribuir nem definir externo de novo", () => {
    // externa = sem técnico (id_tecnico vazio), execucao_externa verdadeiro
    const externa = { status: "EM_ANDAMENTO", id_tecnico: null, execucao_externa: true };
    const acoes = acoesDaOS(externa, ID, com(...TUDO));
    expect(acoes.atribuir).toBe(false);
    expect(acoes.definirExterno).toBe(false);
    expect(acoes.assumir).toBe(false);
    expect(acoes.finalizar).toBe(true);
  });

  it("cancelar: com a permissão, enquanto não estiver encerrada", () => {
    const pode = com("os.cancelar");
    expect(acoesDaOS({ status: "EM_ANDAMENTO" }, ID, pode).cancelar).toBe(true);
    expect(acoesDaOS({ status: "FINALIZADA" }, ID, pode).cancelar).toBe(false);
    expect(acoesDaOS({ status: "CANCELADA" }, ID, pode).cancelar).toBe(false);
    expect(acoesDaOS({ status: "ABERTA" }, ID, com()).cancelar).toBe(false);
  });

  it("sem nenhuma permissão, nenhum botão aparece", () => {
    for (const status of ["ABERTA", "ATRIBUIDA", "EM_ANDAMENTO", "FINALIZADA"]) {
      const acoes = acoesDaOS({ status, id_tecnico: ID }, ID, com());
      expect(Object.values(acoes).every((v) => v === false)).toBe(true);
    }
  });

  it("status em minúsculas também funciona", () => {
    expect(acoesDaOS({ status: "aberta" }, ID, com("os.assumir")).assumir).toBe(true);
  });
});
