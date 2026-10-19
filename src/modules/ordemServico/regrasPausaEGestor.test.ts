import { describe, expect, it } from "vitest";
import { acoesDaOS } from "./regrasAcoesOS";

const com = (...permissoes: string[]) => {
  const s = new Set(permissoes);
  return (p: string) => s.has(p);
};

const ID = 10;

describe("pausar e retomar", () => {
  const tecnico = com("os.pausar");

  it("pausar: só O.S. em andamento e dele", () => {
    expect(acoesDaOS({ status: "EM_ANDAMENTO", id_tecnico: ID }, ID, tecnico).pausar).toBe(true);
    expect(acoesDaOS({ status: "EM_ANDAMENTO", id_tecnico: 99 }, ID, tecnico).pausar).toBe(false);
    expect(acoesDaOS({ status: "ATRIBUIDA", id_tecnico: ID }, ID, tecnico).pausar).toBe(false);
    expect(acoesDaOS({ status: "PAUSADA", id_tecnico: ID }, ID, tecnico).pausar).toBe(false);
    expect(acoesDaOS({ status: "FINALIZADA", id_tecnico: ID }, ID, tecnico).pausar).toBe(false);
  });

  it("retomar: só O.S. pausada e dele", () => {
    expect(acoesDaOS({ status: "PAUSADA", id_tecnico: ID }, ID, tecnico).retomar).toBe(true);
    expect(acoesDaOS({ status: "PAUSADA", id_tecnico: 99 }, ID, tecnico).retomar).toBe(false);
    expect(acoesDaOS({ status: "EM_ANDAMENTO", id_tecnico: ID }, ID, tecnico).retomar).toBe(false);
  });

  it("sem a permissão 'os.pausar' não aparece nenhum dos dois", () => {
    const sem = com("os.finalizar");
    expect(acoesDaOS({ status: "EM_ANDAMENTO", id_tecnico: ID }, ID, sem).pausar).toBe(false);
    expect(acoesDaOS({ status: "PAUSADA", id_tecnico: ID }, ID, sem).retomar).toBe(false);
  });

  it("quem age em O.S. de outros (não gestor) pausa e retoma a de qualquer técnico", () => {
    const coordenador = com("os.pausar", "os.agir_em_qualquer");
    expect(acoesDaOS({ status: "EM_ANDAMENTO", id_tecnico: 99 }, ID, coordenador, "TECNICO").pausar).toBe(true);
    expect(acoesDaOS({ status: "PAUSADA", id_tecnico: 99 }, ID, coordenador, "TECNICO").retomar).toBe(true);
  });

  it("O.S. pausada não pode ser finalizada (precisa retomar antes)", () => {
    const pode = com("os.finalizar", "os.agir_em_qualquer");
    expect(acoesDaOS({ status: "PAUSADA", id_tecnico: ID }, ID, pode, "TECNICO").finalizar).toBe(false);
    expect(acoesDaOS({ status: "PAUSADA", id_tecnico: null, execucao_externa: true }, ID, pode, "TECNICO").finalizar).toBe(false);
  });

  it("cancelar continua possível com a O.S. pausada", () => {
    expect(acoesDaOS({ status: "PAUSADA", id_tecnico: ID }, ID, com("os.cancelar")).cancelar).toBe(true);
  });
});

describe("o gestor não faz manutenção: atribui, cancela e só finaliza O.S. de técnico externo", () => {
  const gestor = com("os.ver", "os.atribuir", "os.definir_externo", "os.cancelar", "os.finalizar", "os.agir_em_qualquer");
  // mesmo que por engano ele tivesse estas, a tela não mostra
  const gestorComExtras = com("os.assumir", "os.iniciar", "os.pausar", "os.finalizar", "os.agir_em_qualquer", "os.atribuir", "os.cancelar");

  it("não assume, não inicia, não pausa nem retoma", () => {
    expect(acoesDaOS({ status: "ABERTA" }, ID, gestorComExtras, "GESTOR").assumir).toBe(false);
    expect(acoesDaOS({ status: "ATRIBUIDA", id_tecnico: ID }, ID, gestorComExtras, "GESTOR").iniciar).toBe(false);
    expect(acoesDaOS({ status: "EM_ANDAMENTO", id_tecnico: ID }, ID, gestorComExtras, "GESTOR").pausar).toBe(false);
    expect(acoesDaOS({ status: "PAUSADA", id_tecnico: ID }, ID, gestorComExtras, "GESTOR").retomar).toBe(false);
  });

  it("NÃO finaliza a O.S. de um técnico da empresa", () => {
    expect(acoesDaOS({ status: "EM_ANDAMENTO", id_tecnico: 99 }, ID, gestor, "GESTOR").finalizar).toBe(false);
    expect(acoesDaOS({ status: "EM_ANDAMENTO", id_tecnico: ID }, ID, gestor, "GESTOR").finalizar).toBe(false);
  });

  it("finaliza a O.S. de técnico externo (enquanto aberta)", () => {
    const externa = { status: "EM_ANDAMENTO", id_tecnico: null, execucao_externa: true };
    expect(acoesDaOS(externa, ID, gestor, "GESTOR").finalizar).toBe(true);
    expect(acoesDaOS({ ...externa, status: "FINALIZADA" }, ID, gestor, "GESTOR").finalizar).toBe(false);
  });

  it("atribui a técnico, define externo e cancela", () => {
    const livre = { status: "ABERTA", id_tecnico: null };
    expect(acoesDaOS(livre, ID, gestor, "GESTOR")).toMatchObject({ atribuir: true, definirExterno: true, cancelar: true });
  });

  it("o técnico continua com todas as ações de execução", () => {
    const tecnico = com("os.assumir", "os.iniciar", "os.pausar", "os.finalizar");
    expect(acoesDaOS({ status: "ABERTA" }, ID, tecnico, "TECNICO").assumir).toBe(true);
    expect(acoesDaOS({ status: "ATRIBUIDA", id_tecnico: ID }, ID, tecnico, "TECNICO").iniciar).toBe(true);
    expect(acoesDaOS({ status: "EM_ANDAMENTO", id_tecnico: ID }, ID, tecnico, "TECNICO")).toMatchObject({ pausar: true, finalizar: true });
  });
});
