import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Building2, ChevronRight, ClipboardCheck, PartyPopper, PauseCircle, Sparkles } from "lucide-react";

import { DashboardKpiCard } from "@/modules/dashboardGestor/DashboardKpiCard";
import { DashboardSection } from "@/modules/dashboardGestor/DashboardSection";
import { iniciais } from "@/modules/permissoes/permissoesBusca";

import {
  contagemPorPlano,
  empresasQuePedemAtencao,
  maisRecentes,
  novasNosUltimosDias,
  pendenciasDeCadastro,
} from "./dashboardAdminLogica";
import { PLANOS } from "./empresaForm";
import { PlanoBadge, SituacaoBadge } from "./empresasColunas";
import { rotuloUltimoAcesso } from "./empresasLogica";
import { listarEmpresas } from "./empresasService";
import type { EmpresaResumo } from "./empresasTypes";

const LIMITE_SEM_ACESSO_DIAS = 7;
const JANELA_NOVAS_DIAS = 30;

const desde = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

function Esqueleto() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Carregando o dashboard">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[90px] rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="h-64 rounded-xl bg-slate-100 lg:col-span-2" />
        <div className="h-64 rounded-xl bg-slate-100 lg:col-span-3" />
      </div>
    </div>
  );
}

function LinhaDaEmpresa({
  empresa,
  detalhe,
  aoAbrir,
}: {
  empresa: EmpresaResumo;
  detalhe: React.ReactNode;
  aoAbrir: (empresa: EmpresaResumo) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => aoAbrir(empresa)}
        className="flex w-full min-h-14 items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={`Abrir ${empresa.nome}`}
      >
        <span
          aria-hidden="true"
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
            empresa.ativo ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-400"
          }`}
        >
          {iniciais(empresa.nome)}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-slate-900">{empresa.nome}</span>
          <span className="block truncate text-xs text-slate-500">{detalhe}</span>
        </span>

        <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-slate-300" />
      </button>
    </li>
  );
}

const COR_DO_PLANO: Record<string, string> = {
  BASICO: "bg-slate-400",
  PROFISSIONAL: "bg-blue-500",
  EMPRESARIAL: "bg-violet-500",
};

/**
 * Dashboard do administrador (dono do sistema): visão das EMPRESAS clientes para bater o olho —
 * quantas são, em que plano estão, quem está parado, quem falta completar. Só identificação e cobrança:
 * nada da operação dos clientes. Não cria nada aqui (o cadastro fica na tela Empresas).
 */
export function DashboardAdmin() {
  const navigate = useNavigate();

  const [empresas, setEmpresas] = useState<EmpresaResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      setEmpresas((await listarEmpresas()).empresas);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar o dashboard.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const ativas = useMemo(() => empresas.filter((e) => e.ativo).length, [empresas]);
  const novas = useMemo(() => novasNosUltimosDias(empresas, JANELA_NOVAS_DIAS), [empresas]);
  const porPlano = useMemo(() => contagemPorPlano(empresas), [empresas]);
  const atencao = useMemo(() => empresasQuePedemAtencao(empresas, Date.now(), LIMITE_SEM_ACESSO_DIAS), [empresas]);
  const pendencias = useMemo(() => pendenciasDeCadastro(empresas), [empresas]);
  const recentes = useMemo(() => maisRecentes(empresas, 5), [empresas]);

  const abrir = (e: EmpresaResumo) => navigate(`/admin/empresas?empresa=${e.id}`);
  const maiorPlano = Math.max(1, ...Object.values(porPlano));

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">Visão geral das empresas</h1>
          <p className="text-sm text-slate-500">Quem são os clientes, em que plano estão e quem precisa de atenção</p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/empresas")}
          className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-lg border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
        >
          Ver todas as empresas
        </button>
      </div>

      {carregando && <Esqueleto />}

      {erro && !carregando && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {erro}{" "}
          <button type="button" onClick={carregar} className="underline">
            Tentar novamente
          </button>
        </div>
      )}

      {!carregando && !erro && empresas.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Building2 size={22} aria-hidden="true" />
          </span>
          <p className="text-base font-medium text-slate-800">Nenhuma empresa cadastrada ainda</p>
          <p className="max-w-sm text-sm text-slate-500">Os clientes aparecem aqui assim que forem cadastrados na tela Empresas.</p>
        </div>
      )}

      {!carregando && !erro && empresas.length > 0 && (
        <>
          {/* NÚMEROS */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
            <DashboardKpiCard
              label="Empresas ativas"
              value={empresas.length - ativas > 0 ? `${ativas} de ${empresas.length}` : ativas}
              icon={<Building2 size={20} />}
              colorClass="bg-blue-50 text-blue-600"
            />
            <DashboardKpiCard
              label="Inativas"
              value={empresas.length - ativas}
              icon={<PauseCircle size={20} />}
              colorClass="bg-slate-100 text-slate-500"
            />
            <DashboardKpiCard
              label={`Novas (${JANELA_NOVAS_DIAS} dias)`}
              value={novas}
              icon={<Sparkles size={20} />}
              colorClass="bg-emerald-50 text-emerald-600"
            />
            <DashboardKpiCard
              label="Cadastro incompleto"
              value={pendencias.length}
              icon={<ClipboardCheck size={20} />}
              colorClass={pendencias.length > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}
              highlight={pendencias.length > 0}
            />
            <DashboardKpiCard
              label={`Sem acesso (${LIMITE_SEM_ACESSO_DIAS}+ dias)`}
              value={atencao.length}
              icon={<AlertTriangle size={20} />}
              colorClass={atencao.length > 0 ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}
              highlight={atencao.length > 0}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            {/* POR PLANO */}
            <DashboardSection
              title="Empresas por plano"
              subtitle="Só as ativas: a base de quem paga"
              className="border-t-4 border-t-blue-400 min-w-0 lg:col-span-2"
            >
              <ul className="space-y-3.5">
                {PLANOS.map((p) => (
                  <li key={p.valor}>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <p className="text-sm font-medium text-slate-800">{p.rotulo}</p>
                      <p className="text-sm font-semibold text-slate-800">{porPlano[p.valor]}</p>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={maiorPlano}
                      aria-valuenow={porPlano[p.valor]}
                      aria-label={`Plano ${p.rotulo}: ${porPlano[p.valor]} empresas`}
                      className="h-2 overflow-hidden rounded-full bg-slate-100"
                    >
                      <div
                        className={`h-full rounded-full transition-[width] duration-500 ${COR_DO_PLANO[p.valor]}`}
                        style={{ width: `${(porPlano[p.valor] / maiorPlano) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}

                {porPlano.SEM_PLANO > 0 && (
                  <li className="flex items-baseline justify-between gap-3 border-t border-slate-100 pt-3">
                    <p className="text-sm text-amber-700">Sem plano definido</p>
                    <p className="text-sm font-semibold text-amber-700">{porPlano.SEM_PLANO}</p>
                  </li>
                )}
              </ul>
            </DashboardSection>

            {/* PRECISAM DE ATENÇÃO */}
            <DashboardSection
              title="Precisam de atenção"
              subtitle="Empresas ativas que não estão entrando no sistema"
              className={`min-w-0 lg:col-span-3 border-t-4 ${atencao.length > 0 ? "border-t-red-400" : "border-t-emerald-400"}`}
            >
              {atencao.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <span className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <PartyPopper size={18} aria-hidden="true" />
                  </span>
                  <p className="text-sm font-medium text-slate-700">Tudo em dia</p>
                  <p className="max-w-xs text-xs text-slate-500">Todas as empresas ativas acessaram o sistema nos últimos {LIMITE_SEM_ACESSO_DIAS} dias.</p>
                </div>
              ) : (
                <ul className="-mx-2 divide-y divide-slate-100">
                  {atencao.slice(0, 6).map((a) => (
                    <LinhaDaEmpresa key={a.empresa.id} empresa={a.empresa} detalhe={a.rotulo} aoAbrir={abrir} />
                  ))}
                </ul>
              )}

              {atencao.length > 6 && <p className="mt-2 text-center text-xs text-slate-400">e mais {atencao.length - 6}…</p>}
            </DashboardSection>
          </div>

          {/* CADASTRO INCOMPLETO */}
          {pendencias.length > 0 && (
            <DashboardSection
              title="Cadastro incompleto"
              subtitle="Falta informação para poder cobrar esses clientes"
              className="border-t-4 border-t-amber-400"
            >
              <ul className="-mx-2 divide-y divide-slate-100">
                {pendencias.slice(0, 6).map((p) => (
                  <LinhaDaEmpresa key={p.empresa.id} empresa={p.empresa} detalhe={`Falta: ${p.faltando.join(" e ")}`} aoAbrir={abrir} />
                ))}
              </ul>
              {pendencias.length > 6 && <p className="mt-2 text-center text-xs text-slate-400">e mais {pendencias.length - 6}…</p>}
            </DashboardSection>
          )}

          {/* CADASTRADAS RECENTEMENTE */}
          <DashboardSection
            title="Últimas empresas cadastradas"
            subtitle="As cinco mais recentes"
            className="border-t-4 border-t-blue-400"
            action={
              <button type="button" onClick={() => navigate("/admin/empresas")} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                Ver todas
              </button>
            }
          >
            <ul className="-mx-2 divide-y divide-slate-100">
              {recentes.map((e) => (
                <li key={e.id} className="flex items-center gap-2 pr-2">
                  <ul className="min-w-0 flex-1">
                    <LinhaDaEmpresa
                      empresa={e}
                      aoAbrir={abrir}
                      detalhe={`Cliente desde ${desde(e.criado_em)} · acesso ${rotuloUltimoAcesso(e.ultimo_acesso).toLowerCase()}`}
                    />
                  </ul>
                  <span className="hidden sm:inline-flex">
                    <PlanoBadge plano={e.plano} />
                  </span>
                  <SituacaoBadge ativo={e.ativo} />
                </li>
              ))}
            </ul>
          </DashboardSection>
        </>
      )}
    </div>
  );
}
