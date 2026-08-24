import type { ReactNode } from "react";

import { FiltrosRelatorio } from "./FiltrosRelatorio";

import {
  RelatorioEstadoInicial,
  RelatorioErro,
  RelatorioVazio,
} from "./RelatorioEstados";

import type {
  FiltrosRelatorio as FiltrosRelatorioType,
  MaquinaOption,
  SetorOption,
} from "../relatorios/types";

type PainelRelatorioProps<T> = {
  filtros: FiltrosRelatorioType;

  onFiltrosChange: (
    filtros: FiltrosRelatorioType
  ) => void;

  setores: SetorOption[];

  maquinas: MaquinaOption[];

  dados: T[];

  loading: boolean;

  erro: boolean;

  buscou: boolean;

  exportando: boolean;

  onVisualizar: () => void;

  onExportar: (
    nomeArquivo: string
  ) => void;

  renderTabela: (dados: T[]) => ReactNode;

  nomeArquivoPadrao: string;
};

export function PainelRelatorio<T>({
  filtros,
  onFiltrosChange,
  setores,
  maquinas,
  dados,
  loading,
  erro,
  buscou,
  exportando,
  onVisualizar,
  onExportar,
  renderTabela,
  nomeArquivoPadrao,
}: PainelRelatorioProps<T>) {
  return (
    <div className="space-y-4">

      {/* =====================================================
          FILTROS
      ===================================================== */}

      <FiltrosRelatorio
        filtros={filtros}
        onChange={onFiltrosChange}
        setores={setores}
        maquinas={maquinas}
        onVisualizar={onVisualizar}
        onExportar={onExportar}
        loading={loading}
        exportando={exportando}
        nomeArquivoPadrao={nomeArquivoPadrao}
      />

      {/* =====================================================
          CONTAINER
      ===================================================== */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* ===================================================
            CABEÇALHO
        =================================================== */}

        <div className="flex items-center justify-between p-4 sm:p-5 pb-3">

          <h3 className="font-semibold text-sm text-slate-800">
            Pré-visualização
          </h3>

          {buscou &&
            !loading &&
            !erro &&
            dados.length > 0 && (
              <span className="text-xs text-slate-400">
                {dados.length} registro(s)
              </span>
            )}

        </div>

        {/* ===================================================
            CONTEÚDO
        =================================================== */}

        <div className="w-full px-2 py-2">

          {/* =================================================
              ESTADO INICIAL
          ================================================= */}

          {!buscou && !loading && (
            <RelatorioEstadoInicial />
          )}

          {/* =================================================
              ERRO
          ================================================= */}

          {!loading && erro && (
            <RelatorioErro
              onRetry={onVisualizar}
            />
          )}

          {/* =================================================
              VAZIO
          ================================================= */}

          {!loading &&
            !erro &&
            buscou &&
            dados.length === 0 && (
              <RelatorioVazio />
            )}

          {/* =================================================
              TABELA

              IMPORTANTE:
              A tabela é renderizada MESMO durante loading.

              Isso permite que:
              
              loading === true
                    ↓
              RelatorioIndicadoresTable
                    ↓
              DataTableLoading
          ================================================= */}

          {(loading ||
            (!erro &&
              buscou &&
              dados.length > 0)) && (
            renderTabela(dados)
          )}

        </div>

      </div>

    </div>
  );
}