import type { Column } from "@/components/data/DataTable";
import type { OrdemServico } from "./machineDetailsTypes";
import { OrdemServicoActions } from "../ordemServico/ordemServicoAction";
import type { UserRole } from "@/modules/login/loginType";

type Tecnico = {
  id: number;
  nome: string;
};

function getTipoStyle(tipo: string) {
  const t = tipo?.toLowerCase();

  if (t?.includes("prevent")) {
    return "bg-blue-50 text-blue-700 border border-blue-200";
  }

  if (t?.includes("corret")) {
    return "bg-red-50 text-red-700 border border-red-200";
  }

  if (t?.includes("predit")) {
    return "bg-indigo-50 text-indigo-700 border border-indigo-200";
  }

  return "bg-slate-100 text-slate-700 border border-slate-200";
}

function getPrioridadeStyle(prioridade: string) {
  const p = prioridade?.toLowerCase();

  if (p?.includes("alta") || p?.includes("urg")) {
    return "bg-red-50 text-red-700 border border-red-200";
  }

  if (p?.includes("media") || p?.includes("média")) {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }

  if (p?.includes("baixa")) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }

  return "bg-slate-100 text-slate-700 border border-slate-200";
}

export function getMachineDetailsColumns(
  onView?: (os: OrdemServico) => void,
  onRefresh?: () => void,
  userRole: UserRole = "OPERADOR",
  userId: number = 0,
  tecnicos: Tecnico[] = []
): Column<OrdemServico>[] {
  return [
   {
  key: "descricao",
  label: "Ordem de Serviço",
  render: (_, row) => (
    <div className="flex flex-col max-w-[240px]">
      <span
        title={row.descricao}
        className="font-medium text-slate-900 truncate"
      >
        {row.descricao}
      </span>

      <span className="text-xs text-slate-400">
        OS #{row.id}
      </span>
    </div>
  ),
},

    // =========================
    // STATUS (já estava bom)
    // =========================
    {
      key: "status",
      label: "Status",
      render: (_, row) => {
        const status = String(row.status ?? "").toLowerCase();

        const classes =
          status.includes("abert")
            ? "bg-blue-50 text-blue-700 border border-blue-200"
            : status.includes("atribu")
            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
            : status.includes("andamento")
            ? "bg-amber-50 text-amber-700 border border-amber-200"
            : status.includes("final")
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : status.includes("cancel")
            ? "bg-red-50 text-red-700 border border-red-200"
            : "bg-slate-100 text-slate-700 border border-slate-200";

        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize ${classes}`}
          >
            {status.replaceAll("_", " ")}
          </span>
        );
      },
    },

    // =========================
    // TIPO (AGORA COM TAG COLORIDA)
    // =========================
    {
      key: "tipo_manutencao",
      label: "Tipo",
      render: (_, row) => {
        const tipo = String(row.tipo_manutencao ?? "");

        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize ${getTipoStyle(tipo)}`}
          >
            {tipo || "-"}
          </span>
        );
      },
    },

    // =========================
    // PRIORIDADE (AGORA COM TAG COLORIDA)
    // =========================
    {
      key: "prioridade",
      label: "Prioridade",
      render: (_, row) => {
        const prioridade = String(row.prioridade ?? "");

        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize ${getPrioridadeStyle(prioridade)}`}
          >
            {prioridade || "-"}
          </span>
        );
      },
    },

    {
      key: "data_abertura",
      label: "Abertura",
      render: (_, row) => (
        <span>
          {row.data_abertura
            ? new Date(row.data_abertura).toLocaleDateString("pt-BR")
            : "-"}
        </span>
      ),
    },

    {
      key: "acoes" as any,
      label: "Ações",
      render: (_, row) => (
        <OrdemServicoActions
          ordem={row}
          userRole={userRole}
          userId={userId}
          tecnicos={tecnicos}
          onRefresh={onRefresh}
          onView={onView}
        />
      ),
    },
  ];
}