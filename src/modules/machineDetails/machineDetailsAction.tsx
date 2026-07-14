import {
  ClipboardList,
  Eye,
  Activity,
  Wrench,
  Clock3,
  CheckCircle2,
  Timer,
  AlertTriangle,
} from "lucide-react";
import { OrdemServicoActions } from "../ordemServico/ordemServicoAction";
import type { UserRole } from "@/modules/login/loginType";
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
   ACTION BUTTON
========================= */
function ActionButton({
  icon: Icon,
  title,
  tone = "slate",
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  tone?: Tone;
  onClick?: () => void;
}) {
  const s = toneStyles[tone];

  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl border ${s.card}
      px-4 py-3 w-full transition-all duration-150
      hover:shadow-sm hover:-translate-y-px active:scale-[0.98]`}
    >
      <div
        className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${s.icon}`}
      >
        <Icon size={15} />
      </div>

      <span className={`text-[12px] font-semibold leading-tight ${s.text}`}>
        {title}
      </span>
    </button>
  );
}

/* =========================
   KPI CARD
========================= */
function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  tone = "slate",
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  tone?: Tone;
}) {
  const s = toneStyles[tone];

  return (
    <div
      className={`border rounded-xl px-3 py-2.5 flex items-center gap-3 ${s.card}
      transition-all hover:shadow-sm`}
    >
      <div
        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${s.icon}`}
      >
        <Icon size={15} />
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 leading-none mb-0.5">
          {title}
        </p>

        <p className={`text-base font-bold leading-none ${s.value}`}>
          {value}
        </p>

        {sub && (
          <p className="text-[10px] text-slate-400 mt-0.5 leading-none">
            {sub}
          </p>
        )}
      </div>
    </div>
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
  return (
    <div className="w-full h-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

      {/* HEADER */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Painel da Máquina
          </h3>
          <p className="text-[11px] text-slate-400">
            Ações e indicadores rápidos
          </p>
        </div>

        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-500">
          {papel}
        </span>
      </div>

      <div className="p-3">

        {/* OPERADOR */}
   {papel === "OPERADOR" && (
  <OrdemServicoActions
    mode="panel"
    userRole={papel}
    machineId={machineId}
    onCreateOS={onCreateOS}
    onViewOS={onViewOS}
  />
)}

        {/* TÉCNICO */}
        {papel === "TECNICO" && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
            <KpiCard title="OS Abertas" value="3" sub="esta semana" icon={Wrench} tone="blue" />
            <KpiCard title="Paradas" value="8h" sub="acumulado" icon={Timer} tone="amber" />
            <KpiCard title="Últ. Manut." value="12d" sub="atrás" icon={Clock3} tone="slate" />
            <KpiCard title="Finalizadas" value="27" sub="este mês" icon={CheckCircle2} tone="emerald" />
          </div>
        )}

        {/* GESTOR */}
        {papel === "GESTOR" && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
            <KpiCard title="Abertas" value="3" sub="em aberto" icon={ClipboardList} tone="blue" />
            <KpiCard title="Andamento" value="2" sub="em execução" icon={Activity} tone="amber" />
            <KpiCard title="Fechadas" value="18" sub="este mês" icon={CheckCircle2} tone="emerald" />
            <KpiCard title="Atrasadas" value="1" sub="fora do SLA" icon={AlertTriangle} tone="rose" />
          </div>
        )}

      </div>
    </div>
  );
}