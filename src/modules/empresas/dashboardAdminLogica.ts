import type { EmpresaResumo, Plano } from "./empresasTypes";

/**
 * Regras do dashboard do administrador — funções puras (sem React), para poder testar.
 * Só o que ajuda a identificar e cobrar cada cliente; nada da operação deles.
 */

const DIA_MS = 86_400_000;

/** Quantos dias inteiros se passaram desde `iso` (0 se for hoje ou no futuro; null se a data não vale). */
export function diasDesde(iso: string | null | undefined, agoraMs: number = Date.now()): number | null {
  if (!iso) return null;

  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;

  return Math.max(0, Math.floor((agoraMs - t) / DIA_MS));
}

export type Atencao = {
  empresa: EmpresaResumo;
  /** "primeiro_acesso": cadastrada e ninguém entrou ainda; "sem_acesso": já usou, mas parou */
  motivo: "primeiro_acesso" | "sem_acesso";
  dias: number;
  rotulo: string;
};

/**
 * Empresas ATIVAS que merecem uma olhada do dono do sistema:
 *  - ninguém entrou desde o cadastro (cliente que esqueceu de começar);
 *  - ninguém acessa há mais de `limiteDias`.
 * Cliente cadastrado há menos de 1 dia não entra (ainda é cedo). Mais antigas primeiro.
 */
export function empresasQuePedemAtencao(empresas: EmpresaResumo[], agoraMs: number = Date.now(), limiteDias = 7): Atencao[] {
  const lista: Atencao[] = [];

  for (const empresa of empresas) {
    if (!empresa.ativo) continue;

    if (!empresa.ultimo_acesso) {
      const dias = diasDesde(empresa.criado_em, agoraMs) ?? 0;
      if (dias < 1) continue;

      lista.push({
        empresa,
        motivo: "primeiro_acesso",
        dias,
        rotulo: `Ninguém acessou desde o cadastro (${dias} ${dias === 1 ? "dia" : "dias"})`,
      });
      continue;
    }

    const dias = diasDesde(empresa.ultimo_acesso, agoraMs);
    if (dias !== null && dias > limiteDias) {
      lista.push({ empresa, motivo: "sem_acesso", dias, rotulo: `Sem acesso há ${dias} dias` });
    }
  }

  return lista.sort((a, b) => b.dias - a.dias);
}

export type Pendencia = {
  empresa: EmpresaResumo;
  /** o que falta para poder cobrar esse cliente */
  faltando: string[];
};

/** Empresas ATIVAS com cadastro incompleto: sem CNPJ (e sem a marca "sem CNPJ") ou sem plano definido. */
export function pendenciasDeCadastro(empresas: EmpresaResumo[]): Pendencia[] {
  const lista: Pendencia[] = [];

  for (const empresa of empresas) {
    if (!empresa.ativo) continue;

    const faltando: string[] = [];
    if (!empresa.cnpj && !empresa.sem_cnpj) faltando.push("CNPJ");
    if (!empresa.plano) faltando.push("plano");

    if (faltando.length > 0) lista.push({ empresa, faltando });
  }

  return lista.sort((a, b) => a.empresa.nome.localeCompare(b.empresa.nome));
}

/** As últimas empresas cadastradas (mais novas primeiro). */
export function maisRecentes(empresas: EmpresaResumo[], quantas = 5): EmpresaResumo[] {
  return [...empresas]
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
    .slice(0, quantas);
}

/** Empresas cadastradas nos últimos `dias` dias (contando o dia de hoje). */
export function novasNosUltimosDias(empresas: EmpresaResumo[], dias = 30, agoraMs: number = Date.now()): number {
  return empresas.filter((e) => {
    const d = diasDesde(e.criado_em, agoraMs);
    return d !== null && d < dias;
  }).length;
}

export type ContagemPorPlano = Record<Plano | "SEM_PLANO", number>;

/** Quantas empresas ATIVAS há em cada plano (base da cobrança). */
export function contagemPorPlano(empresas: EmpresaResumo[]): ContagemPorPlano {
  const total: ContagemPorPlano = { BASICO: 0, PROFISSIONAL: 0, EMPRESARIAL: 0, SEM_PLANO: 0 };

  for (const e of empresas) {
    if (!e.ativo) continue;
    total[e.plano ?? "SEM_PLANO"] += 1;
  }

  return total;
}
