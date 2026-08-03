import { Clock, Timer, UserCog, User, Wrench, Flag } from "lucide-react";

import type { OrdemServico } from "@/modules/ordemServico/ordemServicoType";
import { ID_TECNICO_EXTERNO } from "@/modules/ordemServico/ordemServicoConstants";

import { formatDuration } from "./osDetailsHelpers";

type Props = {
  os: OrdemServico;
  tecnicoNome?: string;
};


function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div
      className="
        flex items-center gap-2
        px-3 py-2.5
        min-w-0
      "
    >
      <div
        className="
          h-8 w-8
          rounded-lg
          bg-slate-50
          text-slate-500
          flex items-center justify-center
          shrink-0
        "
      >
        {icon}
      </div>


      <div className="min-w-0">

        <p
          className="
            text-[10px]
            uppercase
            tracking-wide
            text-slate-400
            truncate
          "
        >
          {label}
        </p>


        <p
          className="
            text-xs
            font-semibold
            text-slate-800
            truncate
          "
        >
          {value}
        </p>


        {hint && (
          <p className="text-[10px] text-blue-500 truncate">
            {hint}
          </p>
        )}

      </div>
    </div>
  );
}



export function OSSummaryCards({ os, tecnicoNome }: Props) {

  const atendimento = formatDuration(
    os.data_inicio_atendimento,
    os.data_resolucao
  );


  const totalResolucao = formatDuration(
    os.data_abertura,
    os.data_resolucao
  );


  const isExterno = os.id_tecnico === ID_TECNICO_EXTERNO;


  const tecnicoLabel = isExterno
    ? "Técnico externo"
    : tecnicoNome ??
      (os.id_tecnico ? `#${os.id_tecnico}` : "Não atribuído");


  return (

    <div
      className="
        grid
        grid-cols-2
        sm:grid-cols-3
        lg:grid-cols-6
        gap-1
      "
    >

      <Stat
        icon={<Clock size={15} />}
        label="Atendimento"
        value={atendimento.texto}
        hint={
          atendimento.emAndamento
            ? "Em andamento"
            : undefined
        }
      />


      <Stat
        icon={<Timer size={15} />}
        label="Resolução"
        value={totalResolucao.texto}
        hint={
          totalResolucao.emAndamento
            ? "Em aberto"
            : undefined
        }
      />


      <Stat
        icon={<UserCog size={15} />}
        label="Responsável"
        value={tecnicoLabel}
      />


      <Stat
        icon={<User size={15} />}
        label="Solicitante"
        value={
          "Diego"
        }
      />


      <Stat
        icon={<Wrench size={15} />}
        label="Manutenção"
        value={os.tipo_manutencao ?? "-"}
      />


      <Stat
        icon={<Flag size={15} />}
        label="Prioridade"
        value={os.prioridade ?? "-"}
      />

    </div>

  );
}