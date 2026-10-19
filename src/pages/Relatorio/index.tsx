import { useMemo, useState } from "react";

import {
  ClipboardList,
  Gauge,
  ChevronRight,
  OctagonPause,
  UserRound,
  BellRing,
} from "lucide-react";

import { useOpcoesFiltroRelatorio } from "../../hooks/useOpcoesFiltroRelatorio";
import { useRelatorio } from "../../hooks/useRelatorio";

import { PainelRelatorio } from "../../modules/relatorios/PainelRelatorio";

import { RelatorioHistoricoOSTable } from "../../modules/relatorios/RelatorioHistoricoOSTable";
import { RelatorioIndicadoresTable } from "../../modules/relatorios/RelatorioIndicadoresTable";
import { RelatorioProdutividadeTecnicoTable } from "../../modules/relatorios/RelatorioProdutividadeTecnicoTable";
import { RelatorioAlertasTable } from "../../modules/relatorios/RelatorioAlertasTable";
import { formatarSegundos } from "../../modules/ordemServico/pausaOSLogica";

import { FILTROS_VAZIOS } from "../../modules/relatorios/types";

import type {
  FiltrosRelatorio as FiltrosRelatorioType,
  IndicadorMaquinaItem,
  OrdemServicoRelatorioItem,
  ProdutividadeTecnicoItem,
  AlertaMonitoramentoItem,
} from "../../modules/relatorios/types";

type TipoRelatorio = "historico-os" | "indicadores" | "produtividade-tecnico" | "alertas";

const RELATORIOS: {
  id: TipoRelatorio;
  titulo: string;
  descricao: string;
  icon: typeof ClipboardList;
  accent: string;
}[] = [
  {
    id: "historico-os",
    titulo: "Histórico de O.S.",
    descricao: "Ordens de serviço no período",
    icon: ClipboardList,
    accent: "from-blue-600 to-indigo-600",
  },
  {
    id: "indicadores",
    titulo: "Indicadores por Máquina",
    descricao: "MTTR, MTBF e manutenções",
    icon: Gauge,
    accent: "from-violet-600 to-purple-600",
  },
  {
    id: "produtividade-tecnico",
    titulo: "Produtividade por Técnico",
    descricao: "Carga atual e atendimento no período",
    icon: UserRound,
    accent: "from-amber-600 to-orange-600",
  },
  {
    id: "alertas",
    titulo: "Alertas de Monitoramento",
    descricao: "Temperatura, vibração e sinal no período",
    icon: BellRing,
    accent: "from-rose-600 to-red-600",
  },
];

const NOME_ARQUIVO_PADRAO_OS =
  "historico-ordens-servico";

const NOME_ARQUIVO_PADRAO_INDICADORES =
  "indicadores-por-maquina";

const NOME_ARQUIVO_PADRAO_TECNICOS =
  "produtividade-por-tecnico";

const NOME_ARQUIVO_PADRAO_ALERTAS =
  "alertas-de-monitoramento";

export function Relatorios() {
  const [relatorioAtivo, setRelatorioAtivo] =
    useState<TipoRelatorio>("historico-os");

  const { setores, maquinas } =
    useOpcoesFiltroRelatorio();

  const [filtrosOS, setFiltrosOS] =
    useState<FiltrosRelatorioType>(FILTROS_VAZIOS);

  const [filtrosIndicadores, setFiltrosIndicadores] =
    useState<FiltrosRelatorioType>(FILTROS_VAZIOS);

  const [filtrosTecnicos, setFiltrosTecnicos] =
    useState<FiltrosRelatorioType>(FILTROS_VAZIOS);

  const [filtrosAlertas, setFiltrosAlertas] =
    useState<FiltrosRelatorioType>(FILTROS_VAZIOS);

  const relatorioOS =
    useRelatorio<OrdemServicoRelatorioItem>(
      "/ordens-servico/preview",
      "/ordens-servico",
      `${NOME_ARQUIVO_PADRAO_OS}.xlsx`
    );

  const relatorioIndicadores =
    useRelatorio<IndicadorMaquinaItem>(
      "/manutencao/preview",
      "/manutencao",
      `${NOME_ARQUIVO_PADRAO_INDICADORES}.xlsx`
    );

  const relatorioTecnicos =
    useRelatorio<ProdutividadeTecnicoItem>(
      "/tecnicos/preview",
      "/tecnicos",
      `${NOME_ARQUIVO_PADRAO_TECNICOS}.xlsx`
    );

  const relatorioAlertas =
    useRelatorio<AlertaMonitoramentoItem>(
      "/alertas/preview",
      "/alertas",
      `${NOME_ARQUIVO_PADRAO_ALERTAS}.xlsx`
    );

  // total de horas paradas nos dados já carregados (mesma conta do
  // Dashboard) — só aparece quando pelo menos uma O.S. do resultado foi
  // marcada como "máquina parada"
  const totalSegundosParados = useMemo(
    () =>
      relatorioOS.dados.reduce((soma, item) => {
        if (!item.maquina_parada) return soma;
        return soma + (Number(item.tempo_parado_segundos ?? 0) || 0);
      }, 0),
    [relatorioOS.dados]
  );

  const temParadaNosDados = relatorioOS.dados.some((item) => item.maquina_parada);

  return (
    <div className="space-y-5 md:space-y-6 overflow-x-hidden">

      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-800">
          Relatórios
        </h1>

        <p className="text-xs md:text-sm text-slate-500">
          Painel de seleção de relatórios
        </p>
      </div>

      {/* =====================================================
          SELETOR DE RELATÓRIO
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

        {RELATORIOS.map((rel) => {
          const Icon = rel.icon;

          const ativo =
            relatorioAtivo === rel.id;

          return (
            <button
              key={rel.id}
              type="button"
              onClick={() =>
                setRelatorioAtivo(rel.id)
              }
              className={`
                group relative overflow-hidden rounded-2xl
                p-3 sm:p-3.5
                text-left
                transition-all duration-200
                ${
                  ativo
                    ? `bg-gradient-to-br ${rel.accent} shadow-md`
                    : "bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
                }
              `}
            >

              {/* EFEITOS DO CARD ATIVO */}

              {ativo && (
                <>
                  <div
                    className="
                      absolute
                      -right-6
                      -top-6
                      h-28
                      w-28
                      rounded-full
                      bg-white/10
                      blur-2xl
                    "
                  />

                  <div
                    className="
                      absolute
                      -right-2
                      -bottom-8
                      h-24
                      w-24
                      rounded-full
                      bg-white/10
                      blur-xl
                    "
                  />
                </>
              )}

              {/* CONTEÚDO */}

              <div className="relative flex items-center gap-3">

                {/* ÍCONE */}

                <div
                  className={`
                    flex
                    h-9 w-9
                    sm:h-10 sm:w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    transition-colors
                    ${
                      ativo
                        ? "bg-white/15 backdrop-blur-sm ring-1 ring-white/20 text-white"
                        : "bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/70 group-hover:bg-slate-100"
                    }
                  `}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                  />
                </div>

                {/* TEXTOS */}

                <div className="min-w-0 flex-1">

                  <p
                    className={`
                      text-sm
                      font-bold
                      truncate
                      ${
                        ativo
                          ? "text-white"
                          : "text-slate-800"
                      }
                    `}
                  >
                    {rel.titulo}
                  </p>

                  <p
                    className={`
                      text-xs
                      mt-0.5
                      truncate
                      ${
                        ativo
                          ? "text-white/80"
                          : "text-slate-400"
                      }
                    `}
                  >
                    {rel.descricao}
                  </p>

                </div>

                {/* SETA */}

                <ChevronRight
                  size={17}
                  className={`
                    shrink-0
                    transition-transform
                    ${
                      ativo
                        ? "text-white/70 translate-x-0.5"
                        : "text-slate-300 group-hover:translate-x-0.5"
                    }
                  `}
                />

              </div>

            </button>
          );
        })}

      </div>

      {/* =====================================================
          HISTÓRICO DE O.S.
      ===================================================== */}

      {relatorioAtivo === "historico-os" && (
        <PainelRelatorio
          filtros={filtrosOS}
          onFiltrosChange={setFiltrosOS}

          setores={setores}
          maquinas={maquinas}

          dados={relatorioOS.dados}

          loading={relatorioOS.loading}
          erro={relatorioOS.erro}
          buscou={relatorioOS.buscou}
          exportando={relatorioOS.exportando}

          onVisualizar={() =>
            relatorioOS.visualizar(filtrosOS)
          }

          onExportar={(nomeArquivo) =>
            relatorioOS.exportar(
              filtrosOS,
              nomeArquivo
            )
          }

          /*
           * O loading é repassado para a tabela
           * para que ela utilize o DataTableLoading.
           */

          renderTabela={(dados) => (
            <RelatorioHistoricoOSTable
              dados={dados}
              loading={relatorioOS.loading}
            />
          )}

          nomeArquivoPadrao={
            NOME_ARQUIVO_PADRAO_OS
          }

          mostrarFiltroParada

          resumoExtra={
            temParadaNosDados ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                <OctagonPause size={12} />
                {formatarSegundos(totalSegundosParados)} parado no período
              </span>
            ) : undefined
          }
        />
      )}

      {/* =====================================================
          INDICADORES POR MÁQUINA
      ===================================================== */}

      {relatorioAtivo === "indicadores" && (
        <PainelRelatorio
          filtros={filtrosIndicadores}

          onFiltrosChange={
            setFiltrosIndicadores
          }

          setores={setores}
          maquinas={maquinas}

          dados={relatorioIndicadores.dados}

          loading={relatorioIndicadores.loading}
          erro={relatorioIndicadores.erro}
          buscou={relatorioIndicadores.buscou}
          exportando={
            relatorioIndicadores.exportando
          }

          onVisualizar={() =>
            relatorioIndicadores.visualizar(
              filtrosIndicadores
            )
          }

          onExportar={(nomeArquivo) =>
            relatorioIndicadores.exportar(
              filtrosIndicadores,
              nomeArquivo
            )
          }

          /*
           * O loading é repassado para a tabela
           * para que ela utilize o DataTableLoading.
           */

          renderTabela={(dados) => (
            <RelatorioIndicadoresTable
              dados={dados}
              loading={
                relatorioIndicadores.loading
              }
            />
          )}

          nomeArquivoPadrao={
            NOME_ARQUIVO_PADRAO_INDICADORES
          }
        />
      )}

      {/* =====================================================
          PRODUTIVIDADE POR TÉCNICO
      ===================================================== */}

      {relatorioAtivo === "produtividade-tecnico" && (
        <PainelRelatorio
          filtros={filtrosTecnicos}

          onFiltrosChange={
            setFiltrosTecnicos
          }

          setores={setores}
          maquinas={maquinas}

          dados={relatorioTecnicos.dados}

          loading={relatorioTecnicos.loading}
          erro={relatorioTecnicos.erro}
          buscou={relatorioTecnicos.buscou}
          exportando={
            relatorioTecnicos.exportando
          }

          onVisualizar={() =>
            relatorioTecnicos.visualizar(
              filtrosTecnicos
            )
          }

          onExportar={(nomeArquivo) =>
            relatorioTecnicos.exportar(
              filtrosTecnicos,
              nomeArquivo
            )
          }

          renderTabela={(dados) => (
            <RelatorioProdutividadeTecnicoTable
              dados={dados}
              loading={
                relatorioTecnicos.loading
              }
            />
          )}

          nomeArquivoPadrao={
            NOME_ARQUIVO_PADRAO_TECNICOS
          }
        />
      )}

      {/* =====================================================
          ALERTAS DE MONITORAMENTO
      ===================================================== */}

      {relatorioAtivo === "alertas" && (
        <PainelRelatorio
          filtros={filtrosAlertas}

          onFiltrosChange={
            setFiltrosAlertas
          }

          setores={setores}
          maquinas={maquinas}

          dados={relatorioAlertas.dados}

          loading={relatorioAlertas.loading}
          erro={relatorioAlertas.erro}
          buscou={relatorioAlertas.buscou}
          exportando={
            relatorioAlertas.exportando
          }

          onVisualizar={() =>
            relatorioAlertas.visualizar(
              filtrosAlertas
            )
          }

          onExportar={(nomeArquivo) =>
            relatorioAlertas.exportar(
              filtrosAlertas,
              nomeArquivo
            )
          }

          renderTabela={(dados) => (
            <RelatorioAlertasTable
              dados={dados}
              loading={
                relatorioAlertas.loading
              }
            />
          )}

          nomeArquivoPadrao={
            NOME_ARQUIVO_PADRAO_ALERTAS
          }
        />
      )}

    </div>
  );
}

export default Relatorios;