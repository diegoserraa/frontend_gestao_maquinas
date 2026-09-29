import {
  ArrowLeft,
  Clock,
  ChevronDown,
  Printer,
  FileDown,
  Loader2,
} from "lucide-react";

import type { OrdemServico } from "@/modules/ordemServico/ordemServicoType";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { formatDateTime, getStatusStyle } from "./osDetailsHelpers";

type Props = {
  os: OrdemServico;
  maquinaNome?: string;
  onBack: () => void;
  /** abre o diálogo de impressão do navegador — pra quem quer só ver/imprimir na hora */
  onImprimir: () => void;
  /** gera o PDF da O.S. (+ um .zip com as fotos, se houver) e baixa na hora */
  onBaixarCompleto: () => void;
  /** true enquanto o PDF/zip está sendo montado — evita clique duplicado */
  baixando?: boolean;
};

export function OSHeader({
  os,
  maquinaNome,
  onBack,
  onImprimir,
  onBaixarCompleto,
  baixando = false,
}: Props) {
  const statusStyle = getStatusStyle(os.status);
  const StatusIcon = statusStyle.icon;

  const isExterno =
    os.execucao_externa === true;

return (
  <div className="relative overflow-hidden">

    {/* Fundo */}
    <div
      className="
        absolute inset-0
        bg-gradient-to-r
        from-blue-50
        via-white
        to-sky-50
        pointer-events-none
      "
    />


    {/* Glow */}
    <div
      className="
        absolute -top-12 right-0
        h-32 w-32
        rounded-full
        bg-blue-100/40
        blur-3xl
        pointer-events-none
      "
    />


    <div
      className="
        relative
        px-4 py-3
        sm:px-6 sm:py-4
      "
    >

      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-start
        "
      >

        {/* Voltar — some no papel, é só navegação */}
        <button
          type="button"
          onClick={onBack}
          title="Voltar"
          className="
            print:hidden
            flex h-9 w-9 shrink-0 items-center justify-center
            rounded-xl border border-slate-200
            bg-white/70 backdrop-blur
            text-slate-500
            hover:bg-white hover:text-slate-700 hover:border-slate-300
            transition
          "
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex-1 min-w-0">


          <div
            className="
              flex
              flex-col
              gap-3

              lg:flex-row
              lg:items-start
              lg:justify-between
            "
          >


            {/* Título */}
            <div className="min-w-0">

              <span
                className="
                  text-[11px]
                  uppercase
                  tracking-[0.20em]
                  text-slate-400
                  font-medium
                "
              >
                Ordem de Serviço
              </span>


              <h1
                className="
                  mt-1
                  text-2xl
                  sm:text-3xl
                  font-bold
                  text-slate-900
                "
              >
                OS #{os.id}
              </h1>


              {maquinaNome && (
                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-500
                    truncate
                  "
                >
                  {maquinaNome}
                </p>
              )}

            </div>




            {/* Data + Imprimir — items-stretch faz o botão (1 linha) acompanhar a
                altura do chip de data (2 linhas) em vez de sobrar espaço nas laterais */}
            <div className="flex flex-wrap items-stretch gap-2">
              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-slate-200
                  bg-white/70
                  backdrop-blur
                  px-3 py-2
                  w-fit
                  max-w-full
                "
              >

                <Clock
                  size={15}
                  className="text-blue-500 shrink-0"
                />


                <div className="min-w-0">

                  <p className="text-[11px] text-slate-500">
                    Aberta em
                  </p>


                  <p
                    className="
                      text-xs
                      sm:text-sm
                      font-semibold
                      text-slate-700
                      truncate
                    "
                  >
                    {formatDateTime(os.data_abertura)}
                  </p>

                </div>

              </div>

              {/* some no papel — não faz sentido imprimir o próprio botão de imprimir/baixar.
                  items-stretch no pai já estica o trigger pra bater com a altura do chip de
                  data ao lado — "height: 100%" aqui atrapalharia o stretch (o pai não tem
                  altura própria definida, só a do conteúdo), por isso NÃO usar h-full */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    disabled={baixando}
                    title="Imprimir ou baixar esta O.S."
                    className="
                      print:hidden
                      flex items-center gap-1.5
                      rounded-xl border border-slate-200
                      bg-white/70 backdrop-blur
                      px-3 py-2
                      text-xs sm:text-sm font-semibold text-slate-700
                      hover:bg-white hover:border-slate-300
                      transition
                      disabled:opacity-60 disabled:cursor-wait
                    "
                  >
                    {baixando ? (
                      <Loader2 size={15} className="text-blue-500 shrink-0 animate-spin" />
                    ) : (
                      <Printer size={15} className="text-blue-500 shrink-0" />
                    )}
                    Baixar / Imprimir
                    <ChevronDown size={13} className="text-slate-400 shrink-0" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" sideOffset={6} className="w-56">
                  <DropdownMenuItem onSelect={onImprimir} className="gap-2.5 cursor-pointer">
                    <Printer size={15} className="text-slate-400" />
                    <span>
                      Imprimir
                      <span className="block text-[11px] font-normal text-slate-400">Abre a caixa de impressão</span>
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={onBaixarCompleto}
                    disabled={baixando}
                    className="gap-2.5 cursor-pointer"
                  >
                    <FileDown size={15} className="text-slate-400" />
                    <span>
                      Baixar arquivo
                      <span className="block text-[11px] font-normal text-slate-400">PDF, ou .zip se houver fotos</span>
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

          </div>



          <div className="mt-3 h-px bg-slate-200" />



          {/* Tags */}
          {/* Tags */}
<div
  className="
    flex
    flex-wrap
    items-center
    gap-1.5
    mt-3
  "
>

  {/* Status */}
  <span
    className={`
      inline-flex items-center gap-1
      px-2 py-1
      sm:px-3 sm:py-1.5
      rounded-full
      text-[11px]
      sm:text-xs
      font-semibold
      border
      ${statusStyle.bg}
      ${statusStyle.text}
      ${statusStyle.border}
    `}
  >
    <StatusIcon size={11} />
    {statusStyle.label}
  </span>


  {/* Tipo */}
  <span
    className="
      inline-flex items-center
      px-2 py-1
      sm:px-3 sm:py-1.5
      rounded-full
      text-[11px]
      sm:text-xs
      font-semibold
      border border-blue-200
      bg-blue-50
      text-blue-700
    "
  >
    {os.tipo_manutencao}
  </span>



  {/* Prioridade */}
  <span
    className={`
      inline-flex items-center
      px-2 py-1
      sm:px-3 sm:py-1.5
      rounded-full
      text-[11px]
      sm:text-xs
      font-semibold
      border

      ${
        os.prioridade === "ALTA"
          ? "bg-red-50 text-red-700 border-red-200"
          : os.prioridade === "MEDIA"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200"
      }
    `}
  >
    {os.prioridade}
  </span>



  {isExterno && (
    <span
      className="
        inline-flex items-center
        px-2 py-1
        sm:px-3 sm:py-1.5
        rounded-full
        text-[11px]
        sm:text-xs
        font-semibold
        border border-slate-200
        bg-slate-50
        text-slate-600
      "
    >
      Externo
    </span>
  )}

</div>


        </div>

      </div>

    </div>

  </div>
);
}