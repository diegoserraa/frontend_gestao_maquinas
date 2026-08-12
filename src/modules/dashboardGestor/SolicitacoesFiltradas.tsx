import { useMemo, useState } from "react";
import {
  ChevronDown,
  Filter,
  Inbox,
  RotateCcw,
  X,
} from "lucide-react";
import { format, isValid } from "date-fns";

import {
  OrdemServicoCard,
  normalizar,
  type OrdemServicoResumo,
} from "./OrdemServicoCard";

import { DateInput } from "@/components/ui/date-input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SolicitacoesFiltradasProps = {
  ordens: OrdemServicoResumo[];
  onVisualizar?: (ordem: OrdemServicoResumo) => void;
  itensIniciais?: number;
  itensPorCarregamento?: number;
};

const STATUS_OPTIONS = [
  { value: "todas", label: "Todos os status" },
  { value: "ATRIBUIDA", label: "Atribuída" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "FINALIZADA", label: "Finalizada" },
];

function dataEmRange(
  dataIso: string,
  inicio: string,
  fim: string
) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return true;
  }

  const dataSemHora = new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate()
  );

  if (inicio) {
    const dIni = new Date(`${inicio}T00:00:00`);

    const dIniSemHora = new Date(
      dIni.getFullYear(),
      dIni.getMonth(),
      dIni.getDate()
    );

    if (dataSemHora < dIniSemHora) {
      return false;
    }
  }

  if (fim) {
    const dFim = new Date(`${fim}T00:00:00`);

    const dFimSemHora = new Date(
      dFim.getFullYear(),
      dFim.getMonth(),
      dFim.getDate()
    );

    if (dataSemHora > dFimSemHora) {
      return false;
    }
  }

  return true;
}

export function SolicitacoesFiltradas({
  ordens,
  onVisualizar,
  itensIniciais = 4,
  itensPorCarregamento = 4,
}: SolicitacoesFiltradasProps) {
  const [statusFiltro, setStatusFiltro] =
    useState("todas");

  const [dataInicio, setDataInicio] =
    useState("");

  const [dataFim, setDataFim] =
    useState("");

  const [filtrosAbertos, setFiltrosAbertos] =
    useState(false);

  const [visibleCount, setVisibleCount] =
    useState(itensIniciais);

  const ordenadas = useMemo(() => {
    return [...ordens].sort((a, b) => {
      return (
        new Date(b.data_abertura).getTime() -
        new Date(a.data_abertura).getTime()
      );
    });
  }, [ordens]);

  const filtradas = useMemo(() => {
    return ordenadas.filter((ordem) => {
      const statusOk =
        statusFiltro === "todas" ||
        normalizar(ordem.status) ===
          normalizar(statusFiltro);

      const dataOk = dataEmRange(
        ordem.data_abertura,
        dataInicio,
        dataFim
      );

      return statusOk && dataOk;
    });
  }, [
    ordenadas,
    statusFiltro,
    dataInicio,
    dataFim,
  ]);

  const filtrosAtivos =
    statusFiltro !== "todas" ||
    Boolean(dataInicio) ||
    Boolean(dataFim);

  const quantidadeFiltros =
    Number(statusFiltro !== "todas") +
    Number(Boolean(dataInicio)) +
    Number(Boolean(dataFim));

  const visiveis = filtradas.slice(
    0,
    visibleCount
  );

  const restantes =
    filtradas.length - visiveis.length;

  const statusSelecionado =
    STATUS_OPTIONS.find(
      (option) => option.value === statusFiltro
    )?.label ?? "Todos os status";

  const formatarData = (value: string) => {
    if (!value) {
      return "";
    }

    const date = new Date(`${value}T00:00:00`);

    if (!isValid(date)) {
      return "";
    }

    return format(date, "dd/MM/yyyy");
  };

  const alterarStatus = (value: string) => {
    setStatusFiltro(value);
    setVisibleCount(itensIniciais);
  };

  const alterarDataInicio = (value: string) => {
    setDataInicio(value);
    setVisibleCount(itensIniciais);
  };

  const alterarDataFim = (value: string) => {
    setDataFim(value);
    setVisibleCount(itensIniciais);
  };

  const limparFiltros = () => {
    setStatusFiltro("todas");
    setDataInicio("");
    setDataFim("");
    setVisibleCount(itensIniciais);
  };

  const renderFiltros = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* STATUS */}
          <div className="space-y-2">
            <label
              className="
                block
                text-xs
                font-semibold
                text-slate-600
              "
            >
              Status
            </label>

            <Select
              value={statusFiltro}
              onValueChange={alterarStatus}
            >
              <SelectTrigger
                className="
                  h-11
                  w-full
                  rounded-xl
                  border-slate-200
                  bg-white
                  px-3.5
                  text-sm
                  font-medium
                  text-slate-700
                  shadow-sm
                  transition-all
                  duration-200
                  hover:border-slate-300
                  hover:shadow-md
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              >
                <SelectValue />
              </SelectTrigger>

              <SelectContent
                className="
                  rounded-xl
                  border-slate-200
                  bg-white
                  shadow-xl
                "
              >
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="
                      rounded-lg
                      text-sm
                      font-medium
                      text-slate-700
                      focus:bg-blue-50
                      focus:text-blue-700
                    "
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* DATA INICIAL */}
          <div className="space-y-2">
            <label
              className="
                block
                text-xs
                font-semibold
                text-slate-600
              "
            >
              Data inicial
            </label>

            <DateInput
              value={dataInicio}
              onChange={alterarDataInicio}
            />
          </div>

          {/* DATA FINAL */}
          <div className="space-y-2">
            <label
              className="
                block
                text-xs
                font-semibold
                text-slate-600
              "
            >
              Data final
            </label>

            <DateInput
              value={dataFim}
              onChange={alterarDataFim}
            />
          </div>
        </div>

        {filtrosAtivos && (
          <div
            className="
              flex
              flex-col
              gap-3
              border-t
              border-slate-100
              pt-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div
              className="
                flex
                flex-wrap
                items-center
                gap-2
              "
            >
              <span
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Filtros ativos
              </span>

              {statusFiltro !== "todas" && (
                <span
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-lg
                    border
                    border-blue-100
                    bg-blue-50
                    px-2.5
                    py-1.5
                    text-[11px]
                    font-semibold
                    text-blue-700
                  "
                >
                  {statusSelecionado}

                  <button
                    type="button"
                    onClick={() =>
                      alterarStatus("todas")
                    }
                    className="
                      text-blue-400
                      transition-colors
                      hover:text-blue-700
                    "
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {dataInicio && (
                <span
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-lg
                    border
                    border-slate-200
                    bg-slate-50
                    px-2.5
                    py-1.5
                    text-[11px]
                    font-semibold
                    text-slate-600
                  "
                >
                  De {formatarData(dataInicio)}

                  <button
                    type="button"
                    onClick={() =>
                      alterarDataInicio("")
                    }
                    className="
                      text-slate-400
                      transition-colors
                      hover:text-slate-700
                    "
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {dataFim && (
                <span
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-lg
                    border
                    border-slate-200
                    bg-slate-50
                    px-2.5
                    py-1.5
                    text-[11px]
                    font-semibold
                    text-slate-600
                  "
                >
                  Até {formatarData(dataFim)}

                  <button
                    type="button"
                    onClick={() =>
                      alterarDataFim("")
                    }
                    className="
                      text-slate-400
                      transition-colors
                      hover:text-slate-700
                    "
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={limparFiltros}
              className="
                inline-flex
                items-center
                gap-1.5
                self-start
                text-xs
                font-semibold
                text-slate-500
                transition-colors
                hover:text-slate-800
                sm:self-auto
              "
            >
              <RotateCcw size={13} />
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* =====================================================
          FILTROS DESKTOP
          ===================================================== */}
      <div
        className="
          hidden
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
          lg:block
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-slate-100
            px-5
            py-4
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-slate-50
                text-slate-500
                ring-1
                ring-slate-200/80
              "
            >
              <Filter
                size={17}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3
                  className="
                    text-sm
                    font-semibold
                    text-slate-800
                  "
                >
                  Filtros
                </h3>

                {filtrosAtivos && (
                  <span
                    className="
                      inline-flex
                      min-w-5
                      items-center
                      justify-center
                      rounded-full
                      bg-blue-50
                      px-1.5
                      py-0.5
                      text-[10px]
                      font-bold
                      text-blue-600
                    "
                  >
                    {quantidadeFiltros}
                  </span>
                )}
              </div>

              <p
                className="
                  mt-0.5
                  text-[11px]
                  text-slate-400
                "
              >
                Refine as solicitações exibidas
              </p>
            </div>
          </div>

          {filtrosAtivos && (
            <button
              type="button"
              onClick={limparFiltros}
              className="
                inline-flex
                items-center
                gap-1.5
                text-xs
                font-semibold
                text-slate-400
                transition-colors
                hover:text-slate-700
              "
            >
              <RotateCcw size={13} />
              Limpar
            </button>
          )}
        </div>

        <div className="p-5">
          {renderFiltros()}
        </div>
      </div>

      {/* =====================================================
          FILTROS MOBILE
          ===================================================== */}
      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
          lg:hidden
        "
      >
        <button
          type="button"
          onClick={() =>
            setFiltrosAbertos(
              (aberto) => !aberto
            )
          }
          className="
            flex
            w-full
            items-center
            justify-between
            gap-3
            px-4
            py-3.5
            text-left
            transition-colors
            hover:bg-slate-50/70
          "
          aria-expanded={filtrosAbertos}
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-slate-50
                text-slate-500
                ring-1
                ring-slate-200/80
              "
            >
              <Filter
                size={17}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className="
                    text-sm
                    font-semibold
                    text-slate-800
                  "
                >
                  Filtros
                </span>

                {filtrosAtivos && (
                  <span
                    className="
                      inline-flex
                      min-w-5
                      items-center
                      justify-center
                      rounded-full
                      bg-blue-50
                      px-1.5
                      py-0.5
                      text-[10px]
                      font-bold
                      text-blue-600
                    "
                  >
                    {quantidadeFiltros}
                  </span>
                )}
              </div>

              <p
                className="
                  mt-0.5
                  text-[11px]
                  text-slate-400
                "
              >
                {filtrosAtivos
                  ? "Filtros aplicados"
                  : "Filtre por status ou período"}
              </p>
            </div>
          </div>

          <ChevronDown
            size={18}
            className={`
              shrink-0
              text-slate-400
              transition-transform
              duration-200
              ${
                filtrosAbertos
                  ? "rotate-180"
                  : ""
              }
            `}
          />
        </button>

        {filtrosAbertos && (
          <div
            className="
              border-t
              border-slate-100
              px-4
              py-4
            "
          >
            {renderFiltros()}
          </div>
        )}
      </div>

      {/* =====================================================
          CONTADOR
          ===================================================== */}
      <div
        className="
          flex
          items-center
          justify-between
          gap-3
        "
      >
        <p
          className="
            text-xs
            font-medium
            text-slate-500
          "
        >
          <span
            className="
              font-semibold
              text-slate-700
            "
          >
            {filtradas.length}
          </span>{" "}
          solicitaç
          {filtradas.length === 1
            ? "ão"
            : "ões"}

          {filtrosAtivos && (
            <span
              className="
                ml-1
                text-slate-400
              "
            >
              · filtradas
            </span>
          )}
        </p>

        {filtrosAtivos && (
          <div
            className="
              hidden
              items-center
              gap-1.5
              text-[11px]
              font-medium
              text-blue-600
              sm:flex
            "
          >
            <span
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-blue-500
              "
            />
            Filtros ativos
          </div>
        )}
      </div>

      {/* =====================================================
          LISTA
          ===================================================== */}
      {visiveis.length === 0 ? (
        <div
          className="
            flex
            min-h-[220px]
            items-center
            justify-center
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
          "
        >
          <div
            className="
              px-6
              text-center
            "
          >
            <div
              className="
                mx-auto
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-slate-50
                text-slate-400
                ring-1
                ring-slate-200/70
              "
            >
              <Inbox
                size={20}
                strokeWidth={1.7}
              />
            </div>

            <p
              className="
                mt-4
                text-sm
                font-semibold
                text-slate-700
              "
            >
              Nenhuma solicitação encontrada
            </p>

            <p
              className="
                mx-auto
                mt-1.5
                max-w-xs
                text-xs
                leading-5
                text-slate-400
              "
            >
              {filtrosAtivos
                ? "Tente ajustar ou remover alguns filtros para encontrar outras solicitações."
                : "As novas solicitações aparecerão aqui."}
            </p>

            {filtrosAtivos && (
              <button
                type="button"
                onClick={limparFiltros}
                className="
                  mt-4
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-lg
                  px-3
                  py-2
                  text-xs
                  font-semibold
                  text-blue-600
                  transition-colors
                  hover:bg-blue-50
                "
              >
                <RotateCcw size={13} />
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          className="
            grid
            grid-cols-1
            items-stretch
            gap-4
            md:grid-cols-2
            xl:gap-5
          "
        >
          {visiveis.map((ordem) => (
            <OrdemServicoCard
              key={ordem.id}
              ordem={ordem}
              onVisualizar={onVisualizar}
            />
          ))}
        </div>
      )}

      {/* =====================================================
          CARREGAR MAIS
          ===================================================== */}
      {restantes > 0 && (
        <button
          type="button"
          onClick={() =>
            setVisibleCount(
              (value) =>
                value + itensPorCarregamento
            )
          }
          className="
            flex
            h-11
            w-full
            items-center
            justify-center
            rounded-xl
            border
            border-slate-200
            bg-white
            text-xs
            font-semibold
            text-slate-600
            shadow-sm
            transition-all
            duration-200
            hover:border-slate-300
            hover:bg-slate-50
            hover:text-slate-900
            hover:shadow-md
            active:scale-[0.99]
          "
        >
          Carregar mais

          <span
            className="
              ml-1.5
              font-medium
              text-slate-400
            "
          >
            ({restantes} restante
            {restantes === 1 ? "" : "s"})
          </span>
        </button>
      )}

      {/* =====================================================
          MOSTRAR MENOS
          ===================================================== */}
      {restantes === 0 &&
        visibleCount > itensIniciais &&
        filtradas.length > itensIniciais && (
          <button
            type="button"
            onClick={() =>
              setVisibleCount(itensIniciais)
            }
            className="
              flex
              h-11
              w-full
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              bg-white
              text-xs
              font-semibold
              text-slate-500
              shadow-sm
              transition-all
              duration-200
              hover:border-slate-300
              hover:bg-slate-50
              hover:text-slate-800
              hover:shadow-md
            "
          >
            Mostrar menos
          </button>
        )}
    </div>
  );
}