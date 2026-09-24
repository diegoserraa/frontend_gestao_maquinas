import { usePermissoes } from "@/modules/permissoes/usePermissoes";
import { useState } from "react";
import {
  Building2,
  Factory,
  Eye,
  FileSpreadsheet,
  Loader2,
  Search,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { DateInput } from "../../components/ui/date-input";
import { ExportarModal } from "../../components/modals/relatorio/Exportar";

import type {
  FiltrosRelatorio as FiltrosRelatorioType,
  MaquinaOption,
  SetorOption,
} from "../relatorios/types";

type FiltrosRelatorioProps = {
  filtros: FiltrosRelatorioType;
  onChange: (filtros: FiltrosRelatorioType) => void;
  setores: SetorOption[];
  maquinas: MaquinaOption[];
  onVisualizar: () => void;
  onExportar: (nomeArquivo: string) => void;
  loading?: boolean;
  exportando?: boolean;
  nomeArquivoPadrao: string;
};

export function FiltrosRelatorio({
  filtros,
  onChange,
  setores,
  maquinas,
  onVisualizar,
  onExportar,
  loading = false,
  exportando = false,
  nomeArquivoPadrao,
}: FiltrosRelatorioProps) {
  const { pode } = usePermissoes();
  const [modalExportarAberto, setModalExportarAberto] =
    useState(false);

  const [pesquisaSetor, setPesquisaSetor] =
    useState("");

  const [pesquisaMaquina, setPesquisaMaquina] =
    useState("");

  /*
   * Quando um setor está selecionado,
   * mostramos somente as máquinas daquele setor.
   */
  const maquinasDisponiveis = filtros.setorId
    ? maquinas.filter(
        (maquina) =>
          String(maquina.setor_id ?? "") ===
          String(filtros.setorId)
      )
    : maquinas;

  /*
   * Pesquisa de setores.
   */
  const setoresFiltrados = setores.filter((setor) =>
    setor.nome
      .toLowerCase()
      .includes(pesquisaSetor.toLowerCase())
  );

  /*
   * Pesquisa de máquinas.
   */
  const maquinasFiltradas =
    maquinasDisponiveis.filter((maquina) =>
      maquina.nome
        .toLowerCase()
        .includes(pesquisaMaquina.toLowerCase())
    );

  function atualizar(
    campo: keyof FiltrosRelatorioType,
    valor: string
  ) {
    /*
     * Ao trocar o setor, limpamos a máquina.
     * Isso evita manter uma máquina que pertence
     * ao setor anterior.
     */
    if (campo === "setorId") {
      onChange({
        ...filtros,
        setorId: valor,
        maquinaId: "",
      });

      return;
    }

    onChange({
      ...filtros,
      [campo]: valor,
    });
  }

  function confirmarExportacao(nomeArquivo: string) {
    onExportar(nomeArquivo);
  }

  /*
   * Altura única para TODOS os campos e botões.
   *
   * O DateInput (document 9) usa h-11 fixo no input
   * interno — então todo o resto (Select, botões)
   * precisa usar h-11 também pra bater certinho.
   */
  const filterHeight = "h-11";

  /*
   * Estilo dos SelectTriggers.
   *
   * Importante:
   * - outline-none
   * - ring-0
   * - focus:ring-0
   * - focus-visible:ring-0
   *
   * Evita a borda preta padrão ao abrir/focar.
   * w-full garante 100% da largura da célula do grid.
   */
  const selectClass = `
    ${filterHeight}
    w-full
    rounded-xl
    border
    border-slate-200
    bg-white
    px-3
    text-sm
    text-slate-700
    shadow-sm
    transition-all
    duration-150

    outline-none
    ring-0

    hover:border-slate-300
    hover:shadow-sm

    focus:outline-none
    focus:ring-0
    focus:ring-offset-0
    focus:border-blue-300

    focus-visible:outline-none
    focus-visible:ring-0
    focus-visible:ring-offset-0
    focus-visible:border-blue-300

    data-[state=open]:outline-none
    data-[state=open]:ring-0
    data-[state=open]:ring-offset-0
    data-[state=open]:border-blue-300
  `;

  /*
   * Classe base dos botões — mesma altura e mesma
   * largura (100% da célula do grid) que os campos.
   */
  const buttonClass = `${filterHeight} w-full gap-2 rounded-xl font-semibold shadow-sm transition-all active:scale-[0.98]`;

  return (
    <div
      className="
        bg-white
        rounded-2xl
        border
        border-slate-200
        shadow-sm
        p-4
        sm:p-5
        space-y-5
      "
    >
      {/* CABEÇALHO */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800">
          Configurações do Relatório
        </h3>

        <p className="mt-0.5 text-xs text-slate-400">
          Defina os filtros e clique em visualizar
        </p>
      </div>

      {/*
       * FILTROS + AÇÕES
       *
       * Todos os 6 itens (2 datas, 2 selects, 2 botões)
       * dividem o mesmo grid com colunas de largura
       * IGUAL (xl:grid-cols-6 → repeat(6, 1fr)), então
       * cada célula ocupa exatamente 1/6 da largura do
       * container e todo item estica 100% da sua célula
       * (w-full) com a mesma altura (h-11).
       */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
        {/* DATA INICIAL */}
        <div className="min-w-0 w-full">
          <label
            className="
              block
              mb-1.5
              text-[10px]
              font-semibold
              uppercase
              tracking-wide
              text-slate-400
            "
          >
            Data Inicial
          </label>

          <div className={`${filterHeight} w-full`}>
            <DateInput
              value={filtros.dataInicial}
              onChange={(valor) =>
                atualizar("dataInicial", valor)
              }
            />
          </div>
        </div>

        {/* DATA FINAL */}
        <div className="min-w-0 w-full">
          <label
            className="
              block
              mb-1.5
              text-[10px]
              font-semibold
              uppercase
              tracking-wide
              text-slate-400
            "
          >
            Data Final
          </label>

          <div className={`${filterHeight} w-full`}>
            <DateInput
              value={filtros.dataFinal}
              onChange={(valor) =>
                atualizar("dataFinal", valor)
              }
            />
          </div>
        </div>

        {/* SETOR */}
        <div className="min-w-0 w-full">
          <label
            className="
              block
              mb-1.5
              text-[10px]
              font-semibold
              uppercase
              tracking-wide
              text-slate-400
            "
          >
            Setor
          </label>

          <Select
            value={filtros.setorId || "all"}
            onValueChange={(valor) =>
              atualizar(
                "setorId",
                valor === "all" ? "" : valor
              )
            }
            onOpenChange={(aberto) => {
              if (!aberto) {
                setPesquisaSetor("");
              }
            }}
          >
            <SelectTrigger className={selectClass}>
              <div className="flex min-w-0 items-center gap-2">
                <Building2
                  size={14}
                  className="shrink-0 text-slate-400"
                />

                <SelectValue placeholder="Todos os setores" />
              </div>
            </SelectTrigger>

            <SelectContent
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                p-1
                shadow-xl

                outline-none
                focus:outline-none
                focus:ring-0
                focus:ring-offset-0
              "
            >
              {/* PESQUISA DE SETOR */}
              <div
                className="relative px-1 pb-2"
                onKeyDown={(e) => {
                  e.stopPropagation();
                }}
              >
                <Search
                  size={14}
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-[calc(50%+4px)]
                    text-slate-400
                    pointer-events-none
                  "
                />

                <Input
                  autoFocus
                  value={pesquisaSetor}
                  onChange={(e) =>
                    setPesquisaSetor(e.target.value)
                  }
                  placeholder="Pesquisar setor..."
                  className="
                    h-9
                    pl-9
                    pr-3
                    rounded-lg
                    border
                    border-slate-200
                    bg-slate-50
                    text-xs
                    text-slate-700
                    shadow-none

                    outline-none
                    ring-0

                    focus:outline-none
                    focus:ring-0
                    focus:ring-offset-0

                    focus-visible:outline-none
                    focus-visible:ring-0
                    focus-visible:ring-offset-0

                    focus:border-blue-400
                    focus-visible:border-blue-400
                  "
                />
              </div>

              <SelectItem
                value="all"
                className="
                  outline-none
                  focus:bg-slate-50
                  focus:text-slate-800
                "
              >
                Todos os setores
              </SelectItem>

              {setoresFiltrados.length > 0 ? (
                setoresFiltrados.map((setor) => (
                  <SelectItem
                    key={setor.id}
                    value={String(setor.id)}
                    className="
                      outline-none
                      focus:bg-slate-50
                      focus:text-slate-800
                    "
                  >
                    {setor.nome}
                  </SelectItem>
                ))
              ) : (
                <div className="px-3 py-5 text-center">
                  <Building2
                    size={18}
                    className="mx-auto mb-2 text-slate-300"
                  />

                  <p className="text-xs text-slate-400">
                    Nenhum setor encontrado
                  </p>
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* MÁQUINA */}
        <div className="min-w-0 w-full">
          <label
            className="
              block
              mb-1.5
              text-[10px]
              font-semibold
              uppercase
              tracking-wide
              text-slate-400
            "
          >
            Máquina
          </label>

          <Select
            value={filtros.maquinaId || "all"}
            onValueChange={(valor) =>
              atualizar(
                "maquinaId",
                valor === "all" ? "" : valor
              )
            }
            onOpenChange={(aberto) => {
              if (!aberto) {
                setPesquisaMaquina("");
              }
            }}
          >
            <SelectTrigger className={selectClass}>
              <div className="flex min-w-0 items-center gap-2">
                <Factory
                  size={14}
                  className="shrink-0 text-slate-400"
                />

                <SelectValue placeholder="Todas as máquinas" />
              </div>
            </SelectTrigger>

            <SelectContent
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                p-1
                shadow-xl

                outline-none
                focus:outline-none
                focus:ring-0
                focus:ring-offset-0
              "
            >
              {/* PESQUISA DE MÁQUINA */}
              <div
                className="relative px-1 pb-2"
                onKeyDown={(e) => {
                  e.stopPropagation();
                }}
              >
                <Search
                  size={14}
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-[calc(50%+4px)]
                    text-slate-400
                    pointer-events-none
                  "
                />

                <Input
                  autoFocus
                  value={pesquisaMaquina}
                  onChange={(e) =>
                    setPesquisaMaquina(e.target.value)
                  }
                  placeholder="Pesquisar máquina..."
                  className="
                    h-9
                    pl-9
                    pr-3
                    rounded-lg
                    border
                    border-slate-200
                    bg-slate-50
                    text-xs
                    text-slate-700
                    shadow-none

                    outline-none
                    ring-0

                    focus:outline-none
                    focus:ring-0
                    focus:ring-offset-0

                    focus-visible:outline-none
                    focus-visible:ring-0
                    focus-visible:ring-offset-0

                    focus:border-blue-400
                    focus-visible:border-blue-400
                  "
                />
              </div>

              <SelectItem
                value="all"
                className="
                  outline-none
                  focus:bg-slate-50
                  focus:text-slate-800
                "
              >
                Todas as máquinas
              </SelectItem>

              {maquinasFiltradas.length > 0 ? (
                maquinasFiltradas.map((maquina) => (
                  <SelectItem
                    key={maquina.id}
                    value={String(maquina.id)}
                    className="
                      outline-none
                      focus:bg-slate-50
                      focus:text-slate-800
                    "
                  >
                    {maquina.nome}
                  </SelectItem>
                ))
              ) : (
                <div className="px-3 py-5 text-center">
                  <Factory
                    size={18}
                    className="mx-auto mb-2 text-slate-300"
                  />

                  <p className="text-xs text-slate-400">
                    Nenhuma máquina encontrada
                  </p>
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* BOTÃO VISUALIZAR */}
        <div className="min-w-0 w-full flex flex-col justify-end">
          {/* espaçador invisível — replica a altura do label acima
              dos campos, garantindo que o botão fique alinhado na
              mesma base que os campos ao lado. */}
          <span
            aria-hidden
            className="block mb-1.5 text-[10px] font-semibold uppercase tracking-wide invisible select-none"
          >
            .
          </span>

          <Button
            type="button"
            onClick={onVisualizar}
            disabled={loading}
            className={`
              ${buttonClass}
              bg-blue-600
              hover:bg-blue-700
              text-white

              outline-none
              focus:outline-none
              focus:ring-2
              focus:ring-blue-100
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-blue-100
            `}
          >
            {loading ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Eye size={16} />
            )}

            {loading
              ? "Carregando..."
              : "Visualizar"}
          </Button>
        </div>

        {/* BOTÃO EXPORTAR */}
        <div className="min-w-0 w-full flex flex-col justify-end">
          <span
            aria-hidden
            className="block mb-1.5 text-[10px] font-semibold uppercase tracking-wide invisible select-none"
          >
            .
          </span>

          {pode("relatorios.exportar") && (
<Button
            type="button"
            variant="outline"
            onClick={() =>
              setModalExportarAberto(true)
            }
            disabled={exportando}
            className={`
              ${buttonClass}
              border-emerald-200
              bg-white
              text-emerald-700

              hover:bg-emerald-50
              hover:border-emerald-300

              outline-none
              focus:outline-none
              focus:ring-2
              focus:ring-emerald-100
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-emerald-100
            `}
          >
            {exportando ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <FileSpreadsheet size={16} />
            )}

            {exportando
              ? "Exportando..."
              : "Exportar Excel"}
          </Button>
)}
        </div>
      </div>

      {/* MODAL DE EXPORTAÇÃO */}
      <ExportarModal
        open={modalExportarAberto}
        onOpenChange={setModalExportarAberto}
        nomeArquivoPadrao={nomeArquivoPadrao}
        exportando={exportando}
        onConfirmar={(nome) => {
          confirmarExportacao(nome);
          setModalExportarAberto(false);
        }}
      />
    </div>
  );
}
