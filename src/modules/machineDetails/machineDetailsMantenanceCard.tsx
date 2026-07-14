import type { CardColumn } from "@/components/data/DataCard";
import type { OrdemServico } from "./machineDetailsTypes";
import { OrdemServicoActions } from "../ordemServico/ordemServicoAction";
import type { UserRole } from "@/modules/login/loginType";

type Tecnico = {
  id: number;
  nome: string;
};

export function getMachineDetailsMobileColumns(
  onView?: (os: OrdemServico) => void,
  onRefresh?: () => void,
  userRole: UserRole = "OPERADOR",
  userId: number = 0,
  tecnicos: Tecnico[] = []
): CardColumn<OrdemServico>[] {
  return [
    {
      render: (row) => {
        const status = String(row.status ?? "").toLowerCase();

        const statusStyle =
          status.includes("abert")
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : status.includes("andamento")
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : status.includes("final")
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-slate-100 text-slate-600 border-slate-200";

        const prioridade = String(
          row.prioridade ?? ""
        ).toLowerCase();

        const prioridadeStyle =
          prioridade.includes("alta")
            ? "bg-red-50 text-red-700 border-red-200"
            : prioridade.includes("media")
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : prioridade.includes("baixa")
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-slate-100 text-slate-600 border-slate-200";

        const tipo = String(
          row.tipo_manutencao ?? ""
        ).toLowerCase();

        const tipoStyle =
          tipo.includes("prevent")
            ? "bg-violet-50 text-violet-700 border-violet-200"
            : tipo.includes("corret")
            ? "bg-orange-50 text-orange-700 border-orange-200"
            : tipo.includes("predit")
            ? "bg-cyan-50 text-cyan-700 border-cyan-200"
            : "bg-slate-100 text-slate-600 border-slate-200";

        return (
          <div
            className="
              bg-white
              border border-slate-200
              rounded-xl
              shadow-sm
              p-4
              space-y-4
            "
          >
            {/* HEADER */}
            <div>
              <h3
                title={row.descricao}
                className="font-semibold text-slate-900 text-sm leading-5 line-clamp-2"
              >
                {row.descricao}
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Ordem de Serviço #{row.id}
              </p>
            </div>

            {/* DADOS */}
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-medium text-slate-500 mb-1">
                  Status
                </p>

                <span
                  className={`inline-flex px-2.5 py-1 rounded-md text-xs border font-medium ${statusStyle}`}
                >
                  {status.replaceAll("_", " ")}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-500 mb-1">
                  Tipo de manutenção
                </p>

                <span
                  className={`inline-flex px-2.5 py-1 rounded-md text-xs border font-medium capitalize ${tipoStyle}`}
                >
                  {row.tipo_manutencao ?? "-"}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-500 mb-1">
                  Prioridade
                </p>

                <span
                  className={`inline-flex px-2.5 py-1 rounded-md text-xs border font-medium uppercase ${prioridadeStyle}`}
                >
                  {row.prioridade ?? "-"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <p className="text-[11px] font-medium text-slate-500">
                    Criado em
                  </p>

                  <p className="text-sm text-slate-700 mt-1">
                    {row.data_abertura
                      ? new Date(
                          row.data_abertura
                        ).toLocaleDateString("pt-BR")
                      : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-slate-500">
                    Nº da OS
                  </p>

                  <p className="text-sm text-slate-700 mt-1">
                    #{row.id}
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div
              className="pt-3 border-t border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <OrdemServicoActions
                mode="mobile"
                ordem={row}
                userRole={userRole}
                userId={userId}
                tecnicos={tecnicos}
                onRefresh={onRefresh}
                onView={onView}
              />
            </div>
          </div>
        );
      },
    },
  ];
}