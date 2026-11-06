import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { DataCards } from "@/components/data/DataCard";
import { DataTable } from "@/components/data/DataTable";
import { DataTableLoading } from "@/components/data/DataTableLoading";
import { Pagination } from "@/components/data/Pagination";
import { notify } from "@/lib/notify";

import { EmpresaDetalheModal } from "@/modules/empresas/EmpresaDetalheModal";
import { EmpresasFilters } from "@/modules/empresas/EmpresasFilters";
import { NovaEmpresaModal } from "@/modules/empresas/NovaEmpresaModal";
import { colunasDaTabela, colunasDosCartoes } from "@/modules/empresas/empresasColunas";
import { filtrarEmpresas } from "@/modules/empresas/empresasLogica";
import { listarEmpresas } from "@/modules/empresas/empresasService";
import type { EmpresaResumo, FiltroSituacao } from "@/modules/empresas/empresasTypes";

/** Painel do administrador (dono do sistema): cadastro das empresas clientes. É o único lugar onde se cria empresa. */
export default function Empresas() {
  const [empresas, setEmpresas] = useState<EmpresaResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState<FiltroSituacao>("todas");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [params, setParams] = useSearchParams();

  const [novaAberta, setNovaAberta] = useState(false);
  const [detalhe, setDetalhe] = useState<{ id: string; confirmar: boolean } | null>(
    params.get("empresa") ? { id: params.get("empresa") as string, confirmar: false } : null
  );

  // vindo do dashboard: já abriu a empresa pedida, limpa o endereço
  useEffect(() => {
    if (params.has("empresa") || params.has("nova")) setParams({}, { replace: true });
    // só na chegada
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregar = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setCarregando(true);
      setErro(null);

      const lista = await listarEmpresas();
      setEmpresas(lista.empresas);
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : "Não foi possível carregar as empresas.";
      setErro(mensagem);
      notify.error(mensagem);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    setPage(1);
  }, [busca, situacao, pageSize]);

  const filtradas = useMemo(() => filtrarEmpresas(empresas, busca, situacao), [empresas, busca, situacao]);

  const paginadas = useMemo(() => {
    const inicio = (page - 1) * pageSize;
    return filtradas.slice(inicio, inicio + pageSize);
  }, [filtradas, page, pageSize]);

  const acoes = useMemo(
    () => ({
      onDetalhes: (e: EmpresaResumo) => setDetalhe({ id: e.id, confirmar: false }),
      onSituacao: (e: EmpresaResumo) => setDetalhe({ id: e.id, confirmar: true }),
    }),
    []
  );

  const colunas = useMemo(() => colunasDaTabela(acoes), [acoes]);
  const cartoes = useMemo(() => colunasDosCartoes(acoes), [acoes]);

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Empresas</h1>
          <p className="text-sm text-slate-500">Cadastro dos clientes: identificação, contrato e situação</p>
        </div>

        <button
          type="button"
          onClick={() => setNovaAberta(true)}
          className="w-full sm:w-auto px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
        >
          + Nova empresa
        </button>
      </div>

      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/40">
          <EmpresasFilters onBusca={setBusca} onSituacao={setSituacao} />
        </div>

        <div className="w-full px-2 py-2">
          {carregando ? (
            <DataTableLoading />
          ) : erro ? (
            <div role="alert" className="m-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {erro}{" "}
              <button type="button" onClick={() => carregar()} className="underline">
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              <div className="hidden sm:block">
                <DataTable columns={colunas} data={paginadas} onRowDoubleClick={(e) => setDetalhe({ id: e.id, confirmar: false })} />
              </div>

              <div className="sm:hidden p-2">
                <DataCards columns={cartoes} data={paginadas} />
              </div>
            </>
          )}
        </div>

        <Pagination
          page={page}
          totalItems={filtradas.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <NovaEmpresaModal open={novaAberta} onClose={() => setNovaAberta(false)} aoCriar={() => carregar(true)} />

      <EmpresaDetalheModal
        empresaId={detalhe?.id ?? null}
        comConfirmacao={detalhe?.confirmar}
        onClose={() => setDetalhe(null)}
        aoAlterar={() => carregar(true)}
      />
    </div>
  );
}
