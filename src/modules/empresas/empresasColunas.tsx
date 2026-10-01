import { Eye, Power } from "lucide-react";

import type { CardColumn } from "@/components/data/DataCard";
import type { Column } from "@/components/data/DataTable";
import { iniciais } from "@/modules/permissoes/permissoesBusca";

import { mascaraCnpj, mascaraTelefone } from "./cnpj";
import { rotuloDoPlano } from "./empresaForm";
import { rotuloUltimoAcesso } from "./empresasLogica";
import type { EmpresaResumo } from "./empresasTypes";

type Acoes = {
  onDetalhes: (empresa: EmpresaResumo) => void;
  /** abre o detalhe já na parte de inativar/reativar */
  onSituacao: (empresa: EmpresaResumo) => void;
};

const desde = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

function Avatar({ nome, ativo }: { nome: string; ativo: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
        ativo ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-400"
      }`}
    >
      {iniciais(nome)}
    </span>
  );
}

export function SituacaoBadge({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
        ativo ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
    >
      <span className={`size-1.5 rounded-full ${ativo ? "bg-emerald-500" : "bg-red-400"}`} />
      {ativo ? "Ativa" : "Inativa"}
    </span>
  );
}

const ESTILO_DO_PLANO: Record<string, string> = {
  BASICO: "bg-slate-100 text-slate-700",
  PROFISSIONAL: "bg-blue-50 text-blue-700",
  EMPRESARIAL: "bg-violet-50 text-violet-700",
};

export function PlanoBadge({ plano }: { plano: string | null }) {
  if (!plano) return <span className="inline-flex rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">Sem plano</span>;

  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${ESTILO_DO_PLANO[plano] ?? ESTILO_DO_PLANO.BASICO}`}>{rotuloDoPlano(plano)}</span>;
}

/** CNPJ formatado; "sem CNPJ" quando é de propósito; "CNPJ pendente" para cadastros antigos. */
export function TextoDoCnpj({ empresa }: { empresa: EmpresaResumo }) {
  if (empresa.cnpj) return <>{mascaraCnpj(empresa.cnpj)}</>;
  if (empresa.sem_cnpj) return <>Sem CNPJ</>;
  return <span className="font-medium text-amber-600">CNPJ pendente</span>;
}

const localizacao = (e: EmpresaResumo) => [e.cidade, e.uf].filter(Boolean).join(" / ");

function BotoesDaLinha({ empresa, onDetalhes, onSituacao, grande = false }: Acoes & { empresa: EmpresaResumo; grande?: boolean }) {
  const tamanho = grande ? "size-10" : "p-2";

  return (
    <>
      <button
        type="button"
        onClick={() => onDetalhes(empresa)}
        title="Detalhes"
        aria-label={`Detalhes de ${empresa.nome}`}
        className={`${tamanho} inline-flex items-center justify-center rounded-md ${grande ? "border border-slate-300" : ""} text-blue-600 hover:bg-blue-50`}
      >
        <Eye size={grande ? 16 : 15} />
      </button>

      <button
        type="button"
        onClick={() => onSituacao(empresa)}
        title={empresa.ativo ? "Inativar" : "Reativar"}
        aria-label={empresa.ativo ? `Inativar ${empresa.nome}` : `Reativar ${empresa.nome}`}
        className={`${tamanho} inline-flex items-center justify-center rounded-md ${grande ? "border border-slate-300" : ""} ${
          empresa.ativo ? "text-slate-600 hover:bg-slate-50" : "text-emerald-600 hover:bg-emerald-50"
        }`}
      >
        <Power size={grande ? 16 : 15} />
      </button>
    </>
  );
}

export function colunasDaTabela(acoes: Acoes): Column<EmpresaResumo>[] {
  return [
    {
      key: "nome",
      label: "Empresa",
      render: (_, e) => (
        <div className="flex items-center gap-3">
          <Avatar nome={e.nome} ativo={e.ativo} />
          <div className="min-w-0">
            <p className={`truncate font-medium ${e.ativo ? "text-slate-900" : "text-slate-500"}`}>{e.nome}</p>
            <p className="truncate text-xs text-slate-400">
              <TextoDoCnpj empresa={e} />
              {e.razao_social ? ` · ${e.razao_social}` : ""}
            </p>
          </div>
        </div>
      ),
    },
    { key: "plano", label: "Plano", render: (_, e) => <PlanoBadge plano={e.plano} /> },
    { key: "ativo", label: "Situação", render: (_, e) => <SituacaoBadge ativo={e.ativo} /> },
    {
      key: "telefone",
      label: "Contato",
      render: (_, e) => (
        <div className="min-w-0 text-xs">
          <p className="text-slate-700">{e.telefone ? mascaraTelefone(e.telefone) : <span className="text-slate-400">-</span>}</p>
          <p className="truncate text-slate-400">{localizacao(e)}</p>
        </div>
      ),
    },
    {
      key: "criado_em",
      label: "Cliente desde",
      render: (_, e) => <span className="whitespace-nowrap text-xs text-slate-600">{desde(e.criado_em)}</span>,
    },
    {
      key: "ultimo_acesso",
      label: "Último acesso",
      render: (_, e) => <span className="whitespace-nowrap text-xs text-slate-500">{rotuloUltimoAcesso(e.ultimo_acesso)}</span>,
    },
    {
      key: "id",
      label: "Ações",
      render: (_, e) => (
        <div className="flex items-center gap-1">
          <BotoesDaLinha empresa={e} {...acoes} />
        </div>
      ),
    },
  ];
}

export function colunasDosCartoes(acoes: Acoes): CardColumn<EmpresaResumo>[] {
  return [
    {
      render: (e) => (
        <div className="w-full space-y-4 rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar nome={e.nome} ativo={e.ativo} />
              <div className="min-w-0">
                <p className={`font-medium [overflow-wrap:anywhere] ${e.ativo ? "text-slate-900" : "text-slate-500"}`}>{e.nome}</p>
                <p className="text-xs text-slate-400">
                  <TextoDoCnpj empresa={e} />
                </p>
              </div>
            </div>
            <SituacaoBadge ativo={e.ativo} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500">Plano</p>
              <PlanoBadge plano={e.plano} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Cliente desde</p>
              <p className="text-sm text-slate-800">{desde(e.criado_em)}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Contato</p>
              <p className="text-sm text-slate-800">{e.telefone ? mascaraTelefone(e.telefone) : "-"}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Cidade</p>
              <p className="truncate text-sm text-slate-800">{localizacao(e) || "-"}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
            <p className="text-xs text-slate-500">Último acesso: {rotuloUltimoAcesso(e.ultimo_acesso)}</p>
            <div className="flex gap-1.5">
              <BotoesDaLinha empresa={e} {...acoes} grande />
            </div>
          </div>
        </div>
      ),
    },
  ];
}
