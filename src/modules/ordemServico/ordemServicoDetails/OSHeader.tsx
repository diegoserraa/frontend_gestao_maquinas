import {
  ArrowLeft,
  Wrench,
  Flag,
  HardHat,
  Clock,
} from "lucide-react";

import type { OrdemServico } from "@/modules/ordemServico/ordemServicoType";
import { ID_TECNICO_EXTERNO } from "@/modules/ordemServico/ordemServicoConstants";

import {
  formatDateTime,
  getStatusStyle,
  getPrioridadeAccent,
} from "./osDetailsHelpers";

type Props = {
  os: OrdemServico;
  maquinaNome?: string;
  onBack: () => void;
};

export function OSHeader({
  os,
  maquinaNome,
  onBack,
}: Props) {
  const statusStyle = getStatusStyle(os.status);
  const StatusIcon = statusStyle.icon;

  const prioridadeAccent =
    getPrioridadeAccent(os.prioridade);

  const isExterno =
    os.id_tecnico === ID_TECNICO_EXTERNO;

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

        {/* Voltar */}
  



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




            {/* Data */}
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