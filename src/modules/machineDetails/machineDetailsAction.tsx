import {
  ClipboardList,
  Activity,
  Wrench,
  Timer,
  Plus,
  Info,
} from "lucide-react";

import { OrdemServicoActions } from "../ordemServico/ordemServicoAction";
import type { UserRole } from "@/modules/login/loginType";
import { useEffect, useState } from "react";
import { getIndicadoresPorMaquina } from "@/modules/machineDetails/machineDetailsService";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type StatusOS =
  | "aberta"
  | "atribuida"
  | "andamento"
  | "finalizada"
  | null;

type Papel = UserRole;

interface MachineDetailsActionsProps {
  osStatus: StatusOS;
  machineId: number;
  papel?: Papel;

  onCreateOS?: (machineId: number) => void;
  onViewOS?: () => void;
  onHistory?: () => void;
}

interface IndicadoresPorMaquina {
  osAbertas: number;
  mttrSegundos: number | null;
  mtbfSegundos: number | null;
  tempoAtendimentoSegundos: number | null;
}

/* =========================
   TONES
========================= */

const toneStyles = {
  blue: {
    card: "bg-blue-50 border-blue-100",
    icon: "bg-blue-100 text-blue-600",
    text: "text-blue-700",
    value: "text-blue-700",
  },

  emerald: {
    card: "bg-emerald-50 border-emerald-100",
    icon: "bg-emerald-100 text-emerald-600",
    text: "text-emerald-700",
    value: "text-emerald-700",
  },

  amber: {
    card: "bg-amber-50 border-amber-100",
    icon: "bg-amber-100 text-amber-600",
    text: "text-amber-700",
    value: "text-amber-700",
  },

  slate: {
    card: "bg-slate-50 border-slate-200",
    icon: "bg-slate-100 text-slate-600",
    text: "text-slate-700",
    value: "text-slate-800",
  },

  rose: {
    card: "bg-rose-50 border-rose-100",
    icon: "bg-rose-100 text-rose-600",
    text: "text-rose-700",
    value: "text-rose-700",
  },
} as const;

type Tone = keyof typeof toneStyles;

/* =========================
   FORMATAR TEMPO
========================= */

function formatarTempo(segundos?: number | null) {
  if (segundos == null) {
    return "—";
  }

  if (segundos < 0) {
    return "—";
  }

  if (segundos >= 86400) {
    return `${(segundos / 86400).toFixed(1)}d`;
  }

  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);

  if (horas === 0) {
    return `${minutos}min`;
  }

  return `${horas}h ${minutos}min`;
}

/* =========================
   KPI CARD
========================= */

function KpiCard({
  title,
  value,
  sub,
  tooltip,
  icon: Icon,
  tone = "slate",
}: {
  title: string;
  value: string;
  sub?: string;
  tooltip?: string;
  icon: React.ElementType;
  tone?: Tone;
}) {
  const s = toneStyles[tone];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`
            border
            rounded-xl
            px-3
            py-2.5
            flex
            items-center
            gap-3
            ${s.card}
            transition-all
            hover:shadow-sm
            cursor-help
          `}
        >
          <div
            className={`
              h-9
              w-9
              rounded-lg
              flex
              items-center
              justify-center
              shrink-0
              ${s.icon}
            `}
          >
            <Icon size={15} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 leading-none">
                {title}
              </p>

              <Info
                size={10}
                className="text-slate-400 shrink-0"
              />
            </div>

            <p
              className={`
                text-base
                font-bold
                leading-none
                mt-1
                ${s.value}
              `}
            >
              {value}
            </p>

            {sub && (
              <p className="text-[10px] text-slate-400 mt-0.5 leading-none">
                {sub}
              </p>
            )}
          </div>
        </div>
      </TooltipTrigger>

      <TooltipContent side="top">
        <p className="max-w-xs text-xs leading-relaxed">
          {tooltip}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

/* =========================
   MAIN COMPONENT
========================= */

export function MachineDetailsActions({
  osStatus,
  machineId,
  papel,
  onCreateOS,
  onViewOS,
}: MachineDetailsActionsProps) {
  const [indicadores, setIndicadores] =
    useState<IndicadoresPorMaquina | null>(null);

  const [loadingIndicadores, setLoadingIndicadores] =
    useState(true);

  /* =========================
     PERMISSÃO PARA ABRIR OS
  ========================= */

  const podeAbrirOS =
    papel === "GESTOR" ||
    papel === "OPERADOR" ||
    papel === "TECNICO";

  /* =========================
     CARREGAR INDICADORES
  ========================= */

  useEffect(() => {
    async function carregarIndicadores() {
      try {
        setLoadingIndicadores(true);

        const dados =
          await getIndicadoresPorMaquina(machineId);

        setIndicadores(dados);
      } catch (error) {
        console.error(
          "Erro ao carregar indicadores da máquina:",
          error
        );
      } finally {
        setLoadingIndicadores(false);
      }
    }

    if (machineId) {
      carregarIndicadores();
    }
  }, [machineId]);

  /* =========================
     VALOR DOS INDICADORES
  ========================= */

  const valor = (valor?: number | null) => {
    if (loadingIndicadores) {
      return "...";
    }

    return String(valor ?? 0);
  };

  return (
    <div className="w-full h-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

      {/* =========================
          HEADER
      ========================= */}

      <div className="px-4 py-3 border-b border-slate-100">

        {/* DESKTOP */}
        <div className="hidden sm:flex items-center justify-between gap-3">

          {/* TÍTULO */}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">
              Painel da Máquina
            </h3>

            <p className="text-[11px] text-slate-400">
              Ações e indicadores rápidos
            </p>
          </div>

          {/* AÇÕES */}
          <div className="flex items-center gap-2 shrink-0">

            {podeAbrirOS && (
              <button
                type="button"
                onClick={() =>
                  onCreateOS?.(machineId)
                }
                className="
                  h-8
                  min-w-[115px]
                  flex
                  items-center
                  justify-center
                  gap-1.5
                  rounded-lg
                  px-3
                  text-[11px]
                  font-semibold
                  bg-blue-600
                  text-white
                  hover:bg-blue-700
                  transition-all
                  shadow-sm
                  hover:shadow
                  active:scale-[0.98]
                "
              >
                <Plus size={13} />
                Nova OS
              </button>
            )}

            <span
              className="
                shrink-0
                px-2.5
                py-1
                rounded-full
                text-[10px]
                font-semibold
                uppercase
                tracking-wider
                bg-slate-100
                border
                border-slate-200
                text-slate-500
              "
            >
              {papel}
            </span>

          </div>
        </div>

        {/* MOBILE */}
        <div className="sm:hidden">

          {/* TÍTULO + PAPEL */}
          <div className="flex items-start justify-between gap-3">

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900">
                Painel da Máquina
              </h3>

              <p className="text-[11px] text-slate-400">
                Ações e indicadores rápidos
              </p>
            </div>

            <span
              className="
                shrink-0
                px-2.5
                py-1
                rounded-full
                text-[10px]
                font-semibold
                uppercase
                tracking-wider
                bg-slate-100
                border
                border-slate-200
                text-slate-500
              "
            >
              {papel}
            </span>

          </div>

          {/* BOTÃO MOBILE */}
          {podeAbrirOS && (
            <button
              type="button"
              onClick={() =>
                onCreateOS?.(machineId)
              }
              className="
                mt-3
                h-9
                w-full
                flex
                items-center
                justify-center
                gap-1.5
                rounded-lg
                px-3
                text-[11px]
                font-semibold
                bg-blue-600
                text-white
                hover:bg-blue-700
                transition-all
                shadow-sm
                hover:shadow
                active:scale-[0.98]
              "
            >
              <Plus size={14} />
              Nova Ordem de Serviço
            </button>
          )}

        </div>
      </div>

      {/* =========================
          CONTEÚDO
      ========================= */}

      <div className="p-3">

        {/* =========================
            OPERADOR
        ========================= */}

        {papel === "OPERADOR" && (
          <OrdemServicoActions
            mode="panel"
            userRole={papel}
            machineId={machineId}
            onCreateOS={onCreateOS}
            onViewOS={onViewOS}
          />
        )}

        {/* =========================
            GESTOR / TÉCNICO
        ========================= */}

        {(papel === "GESTOR" ||
          papel === "TECNICO") && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">

            {/* OS ABERTAS */}
            <KpiCard
              title="OS Abertas"
              value={valor(indicadores?.osAbertas)}
              sub="pendentes"
              icon={ClipboardList}
              tone="blue"
              tooltip="Quantidade atual de ordens de serviço que estão abertas e ainda não foram atribuídas ou iniciadas."
            />

            {/* MTTR */}
            <KpiCard
              title="MTTR"
              value={formatarTempo(
                indicadores?.mttrSegundos
              )}
              sub="tempo de reparo"
              icon={Wrench}
              tone="emerald"
              tooltip="MTTR (Mean Time To Repair) representa o tempo médio necessário para reparar a máquina e concluir uma manutenção corretiva."
            />

            {/* MTBF */}
            <KpiCard
              title="MTBF"
              value={formatarTempo(
                indicadores?.mtbfSegundos
              )}
              sub="entre falhas"
              icon={Activity}
              tone="amber"
              tooltip="MTBF (Mean Time Between Failures) representa o tempo médio de funcionamento da máquina entre duas falhas consecutivas."
            />

            {/* TEMPO DE ATENDIMENTO */}
            <KpiCard
              title="Atendimento"
              value={formatarTempo(
                indicadores?.tempoAtendimentoSegundos
              )}
              sub="tempo de resposta"
              icon={Timer}
              tone="rose"
              tooltip="Tempo médio entre a abertura da ordem de serviço e o início efetivo do atendimento pelo técnico."
            />

          </div>
        )}

      </div>
    </div>
  );
}