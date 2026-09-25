import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Power, RotateCcw, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { notify } from "@/lib/notify";
import { iniciais } from "@/modules/permissoes/permissoesBusca";

import { mascaraCnpj, mascaraTelefone } from "./cnpj";
import { deEmpresa, paraDados, problemaNoFormulario, rotuloDoPlano, type FormEmpresa } from "./empresaForm";
import { SituacaoBadge } from "./empresasColunas";
import { rotuloUltimoAcesso } from "./empresasLogica";
import { definirSituacaoEmpresa, detalharEmpresa, editarEmpresa } from "./empresasService";
import type { DetalheEmpresa } from "./empresasTypes";
import { FormularioEmpresa } from "./FormularioEmpresa";

type Props = {
  /** null = fechado */
  empresaId: string | null;
  /** abre já com a confirmação de inativar/reativar à mostra */
  comConfirmacao?: boolean;
  onClose: () => void;
  /** depois de editar, inativar ou reativar (a lista recarrega) */
  aoAlterar: () => void;
};

const dataLonga = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

/** AAAA-MM-DD (sem fuso: é uma data de calendário) → 01/03/2026 */
const dataDoContrato = (ymd: string) => ymd.split("-").reverse().join("/");

function Dado({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{rotulo}</p>
      <div className="text-sm text-slate-800 [overflow-wrap:anywhere]">{children}</div>
    </div>
  );
}

const Vazio = () => <span className="text-slate-400">Não informado</span>;

const Cartao = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <h3 className="mb-3 text-sm font-semibold text-slate-900">{titulo}</h3>
    <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">{children}</div>
  </section>
);

/**
 * Uma empresa cliente: dados de identificação e cobrança, quem administra (para saber com quem falar),
 * edição e inativar/reativar. Não mostra nada da operação do cliente (máquinas, O.S., usuários...).
 */
export function EmpresaDetalheModal({ empresaId, comConfirmacao = false, onClose, aoAlterar }: Props) {
  const [dados, setDados] = useState<DetalheEmpresa | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [editando, setEditando] = useState<FormEmpresa | null>(null);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const [confirmando, setConfirmando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async (id: string) => {
    try {
      setCarregando(true);
      setErro(null);
      setDados(await detalharEmpresa(id));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar a empresa.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (!empresaId) return;
    setDados(null);
    setMotivo("");
    setEditando(null);
    setErroForm(null);
    setConfirmando(comConfirmacao);
    void carregar(empresaId);
  }, [empresaId, comConfirmacao, carregar]);

  const empresa = dados?.empresa;

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!empresa || !editando) return;

    const problema = problemaNoFormulario(editando, false);
    if (problema) {
      setErroForm(problema);
      return;
    }

    try {
      setSalvando(true);
      setErroForm(null);
      setDados(await editarEmpresa(empresa.id, paraDados(editando)));
      setEditando(null);
      notify.success("Dados da empresa atualizados");
      aoAlterar();
    } catch (err) {
      setErroForm(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function alterarSituacao() {
    if (!empresa) return;
    const ativar = !empresa.ativo;

    try {
      setSalvando(true);
      setDados(await definirSituacaoEmpresa(empresa.id, ativar, ativar ? undefined : motivo));
      setConfirmando(false);
      setMotivo("");
      notify.success(ativar ? "Empresa reativada" : "Empresa inativada");
      aoAlterar();
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Não foi possível alterar a situação.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={empresaId !== null} onOpenChange={(aberto) => !aberto && !salvando && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-[96vw] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 px-4 pb-4 pt-5 text-left sm:px-6 sm:pt-6">
          <div className="flex items-center gap-3 pr-8">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-semibold text-white shadow-sm"
            >
              {iniciais(empresa?.nome ?? "")}
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate text-left text-lg font-semibold sm:text-xl">
                {editando ? "Editar empresa" : empresa?.nome ?? "Empresa"}
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2 text-left text-xs text-slate-500 sm:text-sm">
                {editando ? (
                  <span>{empresa?.nome}</span>
                ) : (
                  <>
                    {empresa && <SituacaoBadge ativo={empresa.ativo} />}
                    {empresa && <span>Cliente desde {dataLonga(empresa.criado_em)}</span>}
                  </>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {editando && empresa ? (
          <form onSubmit={salvarEdicao} noValidate className="flex min-h-0 flex-1 flex-col border-t bg-slate-50/60">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <FormularioEmpresa
                valores={editando}
                onChange={(m) => {
                  setEditando((f) => (f ? { ...f, ...m } : f));
                  setErroForm(null);
                }}
                desabilitado={salvando}
                prefixo="edit"
              />

              {erroForm && (
                <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
                  <span className="size-1.5 shrink-0 rounded-full bg-red-400" />
                  <p className="text-xs text-red-600">{erroForm}</p>
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-white px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
              <Button type="button" variant="outline" onClick={() => setEditando(null)} disabled={salvando} className="h-10 w-full sm:h-9 sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando} className="h-10 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white sm:h-9 sm:w-auto">
                {salvando && <Loader2 size={14} className="animate-spin" />}
                Salvar alterações
              </Button>
            </div>
          </form>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto border-t bg-slate-50/60 px-4 py-4 sm:px-6">
            {carregando && !dados && (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400" aria-busy="true">
                <Loader2 size={16} className="animate-spin" /> Carregando...
              </div>
            )}

            {erro && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {erro}
              </div>
            )}

            {dados && empresa && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button type="button" variant="outline" onClick={() => setEditando(deEmpresa(empresa))} className="h-9 w-full sm:w-auto">
                    <Pencil size={14} /> Editar dados
                  </Button>
                </div>

                <Cartao titulo="Empresa">
                  <Dado rotulo="Nome fantasia">{empresa.nome}</Dado>
                  <Dado rotulo="Razão social">{empresa.razao_social ?? <Vazio />}</Dado>
                  <Dado rotulo="CNPJ">
                    {empresa.cnpj ? (
                      mascaraCnpj(empresa.cnpj)
                    ) : empresa.sem_cnpj ? (
                      <span className="text-slate-500">Cliente sem CNPJ</span>
                    ) : (
                      <span className="font-medium text-amber-600">Pendente</span>
                    )}
                  </Dado>
                  <Dado rotulo="Cidade / UF">
                    {empresa.cidade || empresa.uf ? [empresa.cidade, empresa.uf].filter(Boolean).join(" / ") : <Vazio />}
                  </Dado>
                </Cartao>

                <Cartao titulo="Contato e cobrança">
                  <Dado rotulo="Telefone / WhatsApp">{empresa.telefone ? mascaraTelefone(empresa.telefone) : <Vazio />}</Dado>
                  <Dado rotulo="E-mail de cobrança">{empresa.email_cobranca ?? <Vazio />}</Dado>
                </Cartao>

                <Cartao titulo="Contrato">
                  <Dado rotulo="Plano">
                    {empresa.plano ? rotuloDoPlano(empresa.plano) : <span className="font-medium text-amber-600">Sem plano definido</span>}
                  </Dado>
                  <Dado rotulo="Início do contrato">{empresa.inicio_contrato ? dataDoContrato(empresa.inicio_contrato) : <Vazio />}</Dado>
                  <Dado rotulo="Último acesso à empresa">{rotuloUltimoAcesso(empresa.ultimo_acesso)}</Dado>
                  {empresa.observacoes && (
                    <div className="sm:col-span-2">
                      <Dado rotulo="Observações internas">
                        <span className="whitespace-pre-line">{empresa.observacoes}</span>
                      </Dado>
                    </div>
                  )}
                </Cartao>

                {/* QUEM ADMINISTRA */}
                <section aria-labelledby="gestores-da-empresa">
                  <h3 id="gestores-da-empresa" className="mb-2 text-sm font-semibold text-slate-900">
                    Gestor{dados.gestores.length > 1 ? "es" : ""}
                  </h3>

                  <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {dados.gestores.map((g) => (
                      <li key={g.id} className="flex items-center gap-3 px-3 py-2.5">
                        <span
                          aria-hidden="true"
                          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600"
                        >
                          {iniciais(g.nome)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {g.nome}
                            {!g.ativo && <span className="ml-2 text-xs font-normal text-red-500">inativo</span>}
                          </p>
                          <p className="truncate text-xs text-slate-500">{g.email}</p>
                          {g.telefone && <p className="truncate text-xs text-slate-500">{mascaraTelefone(g.telefone)}</p>}
                        </div>
                        <p className="shrink-0 text-right text-[11px] text-slate-400">{rotuloUltimoAcesso(g.ultimo_acesso)}</p>
                      </li>
                    ))}

                    {dados.gestores.length === 0 && <li className="p-4 text-center text-sm text-slate-500">Nenhum gestor cadastrado.</li>}
                  </ul>
                </section>

                {/* SITUAÇÃO */}
                <section
                  aria-labelledby="situacao-da-empresa"
                  className={`rounded-2xl border p-4 ${empresa.ativo ? "border-slate-200 bg-white" : "border-orange-200 bg-orange-50/70"}`}
                >
                  <h3 id="situacao-da-empresa" className="text-sm font-semibold text-slate-900">
                    Situação da empresa
                  </h3>

                  {empresa.ativo ? (
                    <>
                      <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                        Inativar bloqueia o acesso de <strong>todos</strong> os usuários da empresa na hora, mesmo quem já está logado. Os dados
                        ficam guardados e você pode reativar quando quiser.
                      </p>

                      {!confirmando ? (
                        <Button type="button" variant="outline" onClick={() => setConfirmando(true)} className="mt-3 h-10 w-full border-red-200 text-red-600 hover:bg-red-50 sm:h-9 sm:w-auto">
                          <Power size={14} /> Inativar empresa
                        </Button>
                      ) : (
                        <div className="mt-3 space-y-3 rounded-xl border border-red-200 bg-red-50/60 p-3">
                          <p className="flex items-center gap-1.5 text-sm font-medium text-red-700">
                            <ShieldAlert size={15} aria-hidden="true" /> Confirmar inativação de {empresa.nome}
                          </p>
                          <div>
                            <label htmlFor="motivo-inativacao" className="text-xs font-medium text-slate-700">
                              Motivo (opcional)
                            </label>
                            <textarea
                              id="motivo-inativacao"
                              value={motivo}
                              onChange={(e) => setMotivo(e.target.value)}
                              maxLength={500}
                              rows={2}
                              disabled={salvando}
                              placeholder="Ex.: pagamento em atraso, pedido do cliente..."
                              className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-700 shadow-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                            />
                          </div>
                          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button type="button" variant="outline" onClick={() => setConfirmando(false)} disabled={salvando} className="h-10 w-full sm:h-9 sm:w-auto">
                              Voltar
                            </Button>
                            <Button type="button" onClick={alterarSituacao} disabled={salvando} className="h-10 w-full bg-red-600 text-white hover:bg-red-700 sm:h-9 sm:w-auto">
                              {salvando && <Loader2 size={14} className="animate-spin" />}
                              Confirmar inativação
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="mt-1 text-xs text-orange-800 sm:text-sm">
                        Inativa{empresa.inativada_em ? ` desde ${dataLonga(empresa.inativada_em)}` : ""}.
                        {empresa.motivo_inativacao ? ` Motivo: ${empresa.motivo_inativacao}` : ""} Ninguém dessa empresa consegue entrar.
                      </p>
                      <Button
                        type="button"
                        onClick={alterarSituacao}
                        disabled={salvando}
                        className="mt-3 h-10 w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:h-9 sm:w-auto"
                      >
                        {salvando ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                        Reativar empresa
                      </Button>
                    </>
                  )}
                </section>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
