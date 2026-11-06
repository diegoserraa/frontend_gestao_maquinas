import { cnpjValido, mascaraCnpj, mascaraTelefone, somenteDigitos, telefoneValido } from "./cnpj";
import { emailPareceValido } from "./empresasLogica";
import type { DadosCadastrais, EmpresaCompleta, NovaEmpresa, Plano } from "./empresasTypes";

/** Formulário de cadastro/edição de empresa — regras puras (sem React), iguais às do servidor. */

export const PLANOS: { valor: Plano; rotulo: string }[] = [
  { valor: "BASICO", rotulo: "Básico" },
  { valor: "PROFISSIONAL", rotulo: "Profissional" },
  { valor: "EMPRESARIAL", rotulo: "Empresarial" },
];

export const rotuloDoPlano = (plano: string | null | undefined): string =>
  PLANOS.find((p) => p.valor === plano)?.rotulo ?? "Sem plano";

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

/** Tudo como texto (o que a pessoa digita); a conversão para o envio é `paraDados`. */
export type FormEmpresa = {
  nome: string;
  razao_social: string;
  cnpj: string;
  sem_cnpj: boolean;
  telefone: string;
  email_cobranca: string;
  cidade: string;
  uf: string;
  plano: string;
  inicio_contrato: string;
  observacoes: string;
  gestor_nome: string;
  gestor_email: string;
  gestor_telefone: string;
};

export const FORM_VAZIO: FormEmpresa = {
  nome: "",
  razao_social: "",
  cnpj: "",
  sem_cnpj: false,
  telefone: "",
  email_cobranca: "",
  cidade: "",
  uf: "",
  plano: "",
  inicio_contrato: "",
  observacoes: "",
  gestor_nome: "",
  gestor_email: "",
  gestor_telefone: "",
};

/** Preenche o formulário de edição com o que já está cadastrado. */
export function deEmpresa(e: EmpresaCompleta): FormEmpresa {
  return {
    ...FORM_VAZIO,
    nome: e.nome,
    razao_social: e.razao_social ?? "",
    cnpj: e.cnpj ? mascaraCnpj(e.cnpj) : "",
    sem_cnpj: e.sem_cnpj,
    telefone: e.telefone ? mascaraTelefone(e.telefone) : "",
    email_cobranca: e.email_cobranca ?? "",
    cidade: e.cidade ?? "",
    uf: e.uf ?? "",
    plano: e.plano ?? "",
    inicio_contrato: e.inicio_contrato ?? "",
    observacoes: e.observacoes ?? "",
  };
}

/** Primeira coisa errada no formulário (ou null se pode enviar). O servidor confere tudo de novo. */
export function problemaNoFormulario(f: FormEmpresa, comGestor: boolean): string | null {
  if (f.nome.trim().length < 2) return "Informe o nome da empresa.";

  if (f.sem_cnpj) {
    if (f.observacoes.trim().length < 5) return "Explique nas observações por que o cliente não tem CNPJ.";
  } else if (!f.cnpj.trim()) {
    return "Informe o CNPJ (ou marque “Cliente sem CNPJ”).";
  } else if (!cnpjValido(f.cnpj)) {
    return "CNPJ inválido. Confira os números.";
  }

  if (f.telefone.trim() && !telefoneValido(f.telefone)) return "Telefone inválido. Informe com DDD.";
  if (f.email_cobranca.trim() && !emailPareceValido(f.email_cobranca)) return "E-mail de cobrança inválido.";

  if (comGestor) {
    if (f.gestor_nome.trim().length < 2) return "Informe o nome do gestor.";
    if (!emailPareceValido(f.gestor_email)) return "Informe um e-mail válido para o gestor.";
    if (f.gestor_telefone.trim() && !telefoneValido(f.gestor_telefone)) return "Telefone do gestor inválido. Informe com DDD.";
  }

  return null;
}

const opcional = (v: string): string | undefined => v.trim() || undefined;

/** Texto do formulário → o que o servidor espera (CNPJ e telefone só com dígitos; vazio some). */
export function paraDados(f: FormEmpresa): DadosCadastrais {
  return {
    nome: f.nome.trim(),
    razao_social: opcional(f.razao_social),
    cnpj: f.sem_cnpj ? undefined : opcional(somenteDigitos(f.cnpj)),
    sem_cnpj: f.sem_cnpj,
    telefone: opcional(somenteDigitos(f.telefone)),
    email_cobranca: opcional(f.email_cobranca),
    cidade: opcional(f.cidade),
    uf: opcional(f.uf),
    plano: (opcional(f.plano) as Plano | undefined),
    inicio_contrato: opcional(f.inicio_contrato),
    observacoes: opcional(f.observacoes),
  };
}

export function paraNovaEmpresa(f: FormEmpresa): NovaEmpresa {
  return {
    ...paraDados(f),
    gestor: {
      nome: f.gestor_nome.trim(),
      email: f.gestor_email.trim(),
      telefone: opcional(somenteDigitos(f.gestor_telefone)),
    },
  };
}
