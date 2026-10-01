import { describe, expect, it } from "vitest";
import { deEmpresa, FORM_VAZIO, paraDados, paraNovaEmpresa, problemaNoFormulario, rotuloDoPlano, type FormEmpresa } from "./empresaForm";
import type { EmpresaCompleta } from "./empresasTypes";

const valido = (extra: Partial<FormEmpresa> = {}): FormEmpresa => ({
  ...FORM_VAZIO,
  nome: "Metalúrgica Silva",
  cnpj: "11.222.333/0001-81",
  gestor_nome: "Ana",
  gestor_email: "ana@silva.com",
  ...extra,
});

describe("problemaNoFormulario", () => {
  it("formulário mínimo válido", () => {
    expect(problemaNoFormulario(valido(), true)).toBeNull();
  });

  it("nome é obrigatório", () => {
    expect(problemaNoFormulario(valido({ nome: " " }), true)).toMatch(/nome da empresa/);
  });

  it("CNPJ: obrigatório, válido; ou 'sem CNPJ' com observação", () => {
    expect(problemaNoFormulario(valido({ cnpj: "" }), true)).toMatch(/Informe o CNPJ/);
    expect(problemaNoFormulario(valido({ cnpj: "11.222.333/0001-82" }), true)).toMatch(/CNPJ inválido/);
    expect(problemaNoFormulario(valido({ cnpj: "", sem_cnpj: true }), true)).toMatch(/observações/);
    expect(problemaNoFormulario(valido({ cnpj: "", sem_cnpj: true, observacoes: "MEI, sem CNPJ ativo" }), true)).toBeNull();
  });

  it("telefone e e-mail de cobrança, quando preenchidos, precisam ser válidos", () => {
    expect(problemaNoFormulario(valido({ telefone: "123" }), true)).toMatch(/Telefone/);
    expect(problemaNoFormulario(valido({ telefone: "(11) 91234-5678" }), true)).toBeNull();
    expect(problemaNoFormulario(valido({ email_cobranca: "cobranca" }), true)).toMatch(/cobrança/);
  });

  it("gestor: só exigido na criação", () => {
    expect(problemaNoFormulario(valido({ gestor_nome: "" }), true)).toMatch(/nome do gestor/);
    expect(problemaNoFormulario(valido({ gestor_email: "x" }), true)).toMatch(/e-mail válido/);
    expect(problemaNoFormulario(valido({ gestor_telefone: "12" }), true)).toMatch(/gestor inválido/);
    expect(problemaNoFormulario(valido({ gestor_nome: "", gestor_email: "" }), false)).toBeNull();
  });
});

describe("paraDados / paraNovaEmpresa", () => {
  it("manda CNPJ e telefones só com dígitos, tira espaços e some com o que está vazio", () => {
    const d = paraDados(valido({ nome: "  Silva  ", telefone: "(11) 91234-5678", uf: "SP", plano: "PROFISSIONAL", razao_social: " " }));

    expect(d).toMatchObject({ nome: "Silva", cnpj: "11222333000181", telefone: "11912345678", uf: "SP", plano: "PROFISSIONAL", sem_cnpj: false });
    expect(d.razao_social).toBeUndefined();
    expect(d.observacoes).toBeUndefined();
    expect(d.inicio_contrato).toBeUndefined();
  });

  it("'sem CNPJ' nunca envia CNPJ", () => {
    const d = paraDados(valido({ sem_cnpj: true, cnpj: "11.222.333/0001-81", observacoes: "MEI sem CNPJ" }));
    expect(d.sem_cnpj).toBe(true);
    expect(d.cnpj).toBeUndefined();
  });

  it("a criação leva o gestor junto", () => {
    const n = paraNovaEmpresa(valido({ gestor_telefone: "(11) 98765-4321" }));
    expect(n.gestor).toEqual({ nome: "Ana", email: "ana@silva.com", telefone: "11987654321" });
  });
});

describe("deEmpresa", () => {
  const cadastrada: EmpresaCompleta = {
    id: "1",
    nome: "Silva",
    razao_social: "Silva LTDA",
    cnpj: "11222333000181",
    sem_cnpj: false,
    plano: "EMPRESARIAL",
    ativo: true,
    criado_em: "2026-01-01T00:00:00Z",
    inicio_contrato: "2026-03-01",
    telefone: "11912345678",
    email_cobranca: "fin@silva.com",
    cidade: "Campinas",
    uf: "SP",
    inativada_em: null,
    motivo_inativacao: null,
    ultimo_acesso: null,
    observacoes: "Piloto",
  };

  it("preenche a edição com máscara", () => {
    const f = deEmpresa(cadastrada);
    expect(f.cnpj).toBe("11.222.333/0001-81");
    expect(f.telefone).toBe("(11) 91234-5678");
    expect(f.plano).toBe("EMPRESARIAL");
    expect(f.inicio_contrato).toBe("2026-03-01");
    expect(f.observacoes).toBe("Piloto");
  });

  it("empresa antiga (campos vazios) vira formulário vazio, sem 'null' escrito", () => {
    const f = deEmpresa({ ...cadastrada, razao_social: null, cnpj: null, plano: null, telefone: null, email_cobranca: null, cidade: null, uf: null, inicio_contrato: null, observacoes: null });
    expect(f.cnpj).toBe("");
    expect(Object.values(f).some((v) => v === null || v === "null")).toBe(false);
  });

  it("ida e volta não perde nada", () => {
    expect(paraDados(deEmpresa(cadastrada))).toMatchObject({ cnpj: "11222333000181", telefone: "11912345678", plano: "EMPRESARIAL", cidade: "Campinas" });
  });
});

describe("rotuloDoPlano", () => {
  it("nomes em português; vazio vira 'Sem plano'", () => {
    expect(rotuloDoPlano("BASICO")).toBe("Básico");
    expect(rotuloDoPlano("PROFISSIONAL")).toBe("Profissional");
    expect(rotuloDoPlano("EMPRESARIAL")).toBe("Empresarial");
    expect(rotuloDoPlano(null)).toBe("Sem plano");
  });
});
